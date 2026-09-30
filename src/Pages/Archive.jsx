import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Header from '../components/Header/Header';
import girlMini from '../assets/girl-mini.svg';
import { governmentTimeline, grandmothers, getPhoto } from '../data/TimeLineData';

const MOBILE_BREAKPOINT = 640;

// The mobile timeline isn't a resized version of the desktop one — it's a
// completely different structure (vertical alternating list vs. a
// horizontal wheel-hijacked track), so this branches the whole render
// instead of trying to make one DOM tree cover both with media queries.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleChange = (event) => setIsMobile(event.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

// Cards are packed by actual event years instead of a continuous year scale:
// cards in the same decade sit SAME_DECADE_GAP apart, and crossing into a new
// decade opens up DECADE_GAP instead — so empty decades never take up space.
const CARD_WIDTH = 230.4; // matches Card's `width: 14.4rem`
const SAME_DECADE_GAP = 16; // 1rem
const DECADE_GAP = 120; // 7.5rem
const EDGE_PADDING = 300;

// How far down TimelineSection's own height the shared horizontal line sits.
// Pushed below 50% so hovered government cards (which pop a polaroid further
// upward) have clearance above the line instead of clipping at the top.
const LINE_TOP = 64;

function buildYearLayout(years) {
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  const positions = new Map();
  let x = EDGE_PADDING;
  let prevDecade = null;

  sorted.forEach((year) => {
    const decade = Math.floor(year / 10) * 10;
    if (prevDecade !== null) {
      x += CARD_WIDTH + (decade === prevDecade ? SAME_DECADE_GAP : DECADE_GAP);
    }
    positions.set(year, x);
    prevDecade = decade;
  });

  const decadeRanges = new Map();
  sorted.forEach((year) => {
    const decade = Math.floor(year / 10) * 10;
    const yearX = positions.get(year);
    const range = decadeRanges.get(decade);
    if (!range) decadeRanges.set(decade, { min: yearX, max: yearX });
    else {
      range.min = Math.min(range.min, yearX);
      range.max = Math.max(range.max, yearX);
    }
  });

  // Tick aligns to the left edge of the decade's first card (not the
  // cluster's center) so the card row visibly starts right under its label.
  const ticks = [...decadeRanges.entries()]
    .map(([decade, { min }]) => ({ decade, x: min - CARD_WIDTH / 2 }))
    .sort((a, b) => a.decade - b.decade);

  const trackWidth = sorted.length ? x + CARD_WIDTH + EDGE_PADDING : EDGE_PADDING * 2;

  return { positions, ticks, trackWidth };
}

const PageBg = styled.div`
  background: linear-gradient(180deg, var(--neutral-10) 0%, var(--bg-secondary) 100%);
`;

// Two viewport-heights: the first scrolls normally, the second stays pinned
// (position: sticky) while a wheel listener redirects vertical scroll input
// into horizontal movement of the timeline track — see the effect below.
const ScrollShell = styled.div`
  position: relative;
  height: 200vh;
`;

const IntroSection = styled.section`
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 120px 24px 40px;
  text-align: center;
  color: var(--neutral-white);
`;

const Icon = styled.img`
  width: 9rem;
  height: auto;
  /* margin-top: 5rem; */
`;

const Title = styled.h1`
  font-family: 'SheLeeOkSun';
  font-size: 4rem;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin-top: -5rem;
`;

const Divider = styled.div`
  width: 1px;
  height: 8rem;
  flex-shrink: 0;
  margin-top: -3rem;
  background: linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, var(--stroke-secondary) 100%);
`;

const Description = styled.p`
  margin: 0;
  max-width: 70%;
  font-size: 0.9rem;
  line-height: 1.4;
  color: color-mix(in srgb, var(--neutral-white) 75%, transparent);
`;

// Lives inside TimelineSection (see below), which only starts covering the
// viewport once scroll passes the first 100vh — so this whole overlay is
// off-screen until then, without needing to touch IntroSection's own box.
const SelectorOverlay = styled.div`
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const SelectLabel = styled.p`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--neutral-white) 60%, transparent);
  margin-bottom: 1rem;
`;

const PillRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 9.4375rem);
  gap: 0.5rem;
`;

const Pill = styled.button`
  display: flex;
  width: 9.4375rem;
  padding: 1rem 2rem;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  border-radius: 2.25rem;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  background: ${(props) => (props.$active ? 'var(--cta-interactive)' : 'var(--button-disabled)')};
  color: var(--text-primary);
  transition: background 0.15s ease;


  &:hover {
    background: ${(props) => (props.$active ? 'var(--cta-interactive)' : 'color-mix(in srgb, var(--button-disabled) 70%, var(--neutral-white))')};
  }
`;

const TimelineSection = styled.section`
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
`;

const ScrollTrack = styled.div`
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Track = styled.div`
  position: relative;
  height: 100%;
  min-width: 100%;
`;

const Line = styled.div`
  position: absolute;
  left: 9rem;
  right: 0;
  top: ${LINE_TOP}%;
  height: 1px;
  background: var(--neutral-1);
`;

const DecadeTick = styled.div`
  position: absolute;
  top: ${LINE_TOP}%;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const TickLabel = styled.span`
  font-size: 1.5rem;
  font-family: 'SheLeeOksun';
  color: var(--neutral-1);
`;

const TickMark = styled.span`
  /* width: 1px;
  height: 8px;
  background: color-mix(in srgb, var(--neutral-white) 30%, transparent); */
`;

const EventBox = styled.div`
  position: absolute;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  /* \`transform\` here makes this its own stacking context, which traps the
     polaroid's z-index inside it — without this, the polaroid's z-index was
     compared to nothing above SelectorOverlay and always lost to it. Since
     EventBox itself has no z-index, it fell back to SelectorOverlay's plain
     DOM-order slot, so SelectorOverlay (z-index: 5) always painted on top
     regardless of how high the polaroid's own z-index was raised. */
  z-index: 10;

  &:hover .polaroid {
    opacity: 1;
    visibility: visible;
  }
`;

const GovBox = styled(EventBox)`
  top: ${LINE_TOP}%;
  transform: translate(-50%, calc(-100% - 48px));
`;

const PersonBox = styled(EventBox)`
  top: ${LINE_TOP}%;
  transform: translate(-50%, 22px);
`;

const Stem = styled.span`
  /* width: 1px;
  height: 14px;
  background: color-mix(in srgb, var(--neutral-white) 30%, transparent); */
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 14.4rem;
  height: 8.325rem;
  padding: 1rem;
  border-radius: 1rem;
  text-align: center;
  /* Fixed height + hidden overflow so a longer event text can never grow the
     card — without this, CardYear's position drifted with text length since
     GovBox/PersonBox measure "100%" off the card's own (overflowing) height. */
  overflow: hidden;
`;

const GovCard = styled(Card)`
  background: var(--button-primary);
  color: var(--neutral-white);
`;

const PersonCard = styled(Card)`
  background: var(--surface-primary);
  color: var(--text-primary);
`;

const CardYear = styled.span`
  flex-shrink: 0;
  font-size: 1.6rem;
  font-weight: 700;
  font-family:'SheLeeOksun';
`;

// Fixed-height 2-line text slot: short text is centered inside it, long text
// wraps up to 2 lines and is clamped — so this slot's height (and therefore
// CardYear's position above it) never changes with the text itself.
const CardTextBox = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 70%;
  height: 2.24rem;
`;

const CardText = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.7rem;
  line-height: 1.4;
  word-break: keep-all;

`;

// Hover-only preview — hidden by default, revealed via EventBox's :hover
// (see the ".polaroid" selector above), since cards themselves only ever
// show the year + event text.
const Polaroid = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 15rem;
  padding: 1rem;
  background: var(--yellow-100, #fffef0);
  box-shadow: 0 0 100px 0 rgba(0, 0, 0, 0.5), 0 -4px 10px 0 rgba(204, 188, 0, 0.4) inset;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 2000000;
`;

// Both card types pop their preview upward (toward the line and beyond),
// rather than person cards dropping theirs downward — with the pill selector
// eating a big chunk of the top of the section, there isn't enough room
// below the line for a downward preview to avoid clipping the viewport edge.
const PolaroidAbove = styled(Polaroid)`
  bottom: calc(100% + 16px);
`;

const PolaroidImage = styled.img`
  width: 100%;
  height: auto;
  object-fit: cover;
`;

const PolaroidYear = styled.span`
  font-size: 2rem;
  font-weight: 700;
  font-family:'SheLeeOkSun';
  color: var(--text-primary);
`;

const PolaroidName = styled.span`

  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
`;

// Same fixed-height, 2-line-clamped pattern as CardTextBox/CardText — keeps
// the polaroid's own height constant instead of growing with the text.
const PolaroidTextBox = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2.24rem;
  padding: 0 0.5rem;
  word-break: keep-all;

`;

const PolaroidText = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.75rem;
  line-height: 1.4;
  text-align: center;
  color: var(--text-primary);
`;

// ---------------------------------------------------------------------
// Mobile: a single vertical, chronologically-merged timeline (government
// events + the selected grandmother's events interleaved by year) with
// cards alternating left/right of a center spine. Tapping a card expands
// its polaroid inline, full-width, directly beneath that row — vertical
// scroll has no viewport-height ceiling the way the horizontal track does,
// so there's no need to fight for popup space the way hover-preview does
// on desktop.
// ---------------------------------------------------------------------

const MobileIntro = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 10rem 1.5rem 2.5rem;
  text-align: center;
  color: var(--neutral-white);
`;

const MobileIcon = styled.img`
  width: 4.5rem;
  height: auto;
`;

const MobileTitle = styled.h1`
  font-family: 'SheLeeOkSun';
  font-size: 1.8rem;
  font-weight: 400;
  margin: 0;
  word-break: keep-all;
`;

const MobileDivider = styled.div`
  width: 1px;
  height: 3rem;
  background: linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, var(--stroke-secondary) 100%);
`;

const MobileDescription = styled.p`
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.6;
  color: color-mix(in srgb, var(--neutral-white) 75%, transparent);
  word-break: keep-all;
`;

const MobileSelectSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.5rem 2.5rem;
`;

const MobileSelectLabel = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--neutral-white) 60%, transparent);
`;

const MobilePillGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
  max-width: 22rem;
`;

const MobilePill = styled.button`
  padding: 0.6rem 0.4rem;
  border-radius: 1.5rem;
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: ${(props) => (props.$active ? 'var(--cta-interactive)' : 'var(--button-disabled)')};
  color: var(--text-primary);
`;

const MobileTimelineWrap = styled.section`
  position: relative;
  padding: 0.5rem 1.25rem 4rem;
`;

const MobileSpine = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--neutral-1);
  transform: translateX(-50%);
`;

// Stays in normal document flow (rather than absolutely positioned) so it
// naturally lands at the right scroll position right before that decade's
// first row, with no need to measure/track row offsets — just pushed to
// start right of the spine's 50% center instead of spanning full-width.
const MobileDecadeLabel = styled.div`
  padding-left: calc(50% + 0.9rem);
  font-size: 1.1rem;
  font-family: 'SheLeeOksun';
  color: var(--neutral-1);
  margin: 0 0 1rem;
`;

const MobileRow = styled.div`
  position: relative;
  padding-bottom: 1.5rem;
`;

const MobileCardLine = styled.div`
  display: flex;
  justify-content: ${(props) => (props.$side === 'left' ? 'flex-end' : 'flex-start')};
`;

const MobileCardSlot = styled.div`
  width: calc(50% - 1.1rem);
`;

// Same shape as desktop's Card/GovCard/PersonCard — centered flex column,
// fixed height + overflow: hidden so CardYear's position never drifts with
// text length, same gov/person background+text colors — just scaled down
// to fit the narrower mobile card slot instead of desktop's 14.4rem.
const MobileCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 5.5rem;
  padding: 0.5rem;
  border: none;
  cursor: pointer;
  border-radius: 0.85rem;
  text-align: center;
  overflow: hidden;
  background: ${(props) => (props.$type === 'gov' ? 'var(--button-primary)' : 'var(--surface-primary)')};
  color: ${(props) => (props.$type === 'gov' ? 'var(--neutral-white)' : 'var(--text-primary)')};
`;

const MobileYear = styled.span`
  flex-shrink: 0;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'SheLeeOksun';
`;

// Fixed-height text slot (mirrors desktop's CardTextBox) so short text
// centers inside it and long text clamps instead of growing the card.
const MobileCardTextBox = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 90%;
  height: 1.5rem;
`;

const MobileEventText = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.55rem;
  line-height: 1.35;
  word-break: keep-all;
`;

// Confined to the same half-width column as the card that opened it
// (mirrors MobileCardLine/MobileCardSlot) instead of spanning the full row —
// grandmother cards on the left get a panel on the left, government cards
// on the right get one on the right.
const MobileExpandLine = styled.div`
  display: flex;
  justify-content: ${(props) => (props.$side === 'left' ? 'flex-end' : 'flex-start')};
`;

const MobileExpandSlot = styled.div`
  width: calc(50% - 1.1rem);
`;

// Same background + inset glow as desktop's Polaroid — narrower and taller
// (closer to the polaroid's own proportions) now that it's confined to the
// card's half-width column instead of the full row.
const MobileExpandPanel = styled.div`
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 0.75rem 1.25rem;
  background: var(--yellow-100, #fffef0);
  /* border-radius: 0.75rem; */
  box-shadow: 0 0 60px 0 rgba(0, 0, 0, 0.5), 0 -4px 10px 0 rgba(204, 188, 0, 0.4) inset;
`;

const MobileExpandImage = styled.img`
  width: 85%;
  height: auto;
  object-fit: cover;
`;

const MobileExpandYear = styled.span`
  font-size: 1.15rem;
  font-weight: 700;
  font-family: 'SheLeeOkSun';
  color: var(--text-primary);
`;

const MobileExpandName = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
`;

const MobileExpandText = styled.p`
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.5;
  text-align: center;
  word-break: keep-all;
  color: var(--text-primary);
`;

function ArchiveMobile({ selected, onSelect, mobileEvents, expandedKey, onToggleExpand }) {
  let prevDecade = null;

  return (
    <PageBg>
      <Header />

      <MobileIntro>
        <MobileIcon src={girlMini} alt="" aria-hidden="true" />
        <MobileTitle>마침표 뒤, 끝나지 않은 시간들</MobileTitle>
        <MobileDivider />
        <MobileDescription>
          미해결인 시간과, 이젠 멈춘 시간.
          <br />
          1965년, 1993년, 2015년- 협상은 있었고, 합의문은 도장이 찍혔습니다.
          <br />
          정부의 시간은 문서 위에서 흐르고 몇 줄의 문장으로 정리되지만, 할머니들의 삶은 다르게
          흘렀습니다.
          <br />그 차이를 마주할 때, 비로소 우리는 묻게 됩니다. 이 문제는, 정말 끝난 것일까요?
        </MobileDescription>
      </MobileIntro>

      <MobileSelectSection>
        <MobileSelectLabel>할머니 생애 살펴보기</MobileSelectLabel>
        <MobilePillGrid>
          {grandmothers.map((g) => (
            <MobilePill
              key={g.id}
              type="button"
              $active={g.id === selected.id}
              onClick={() => onSelect(g.id)}
            >
              {g.name} 할머니
            </MobilePill>
          ))}
        </MobilePillGrid>
      </MobileSelectSection>

      <MobileTimelineWrap>
        <MobileSpine />
        {mobileEvents.map((event) => {
          const decade = Math.floor(event.year / 10) * 10;
          const showDecade = decade !== prevDecade;
          prevDecade = decade;
          // Fixed by type rather than alternating by position — grandmother
          // events always on the left, government events always on the
          // right, so the two "tracks" stay easy to tell apart at a glance
          // (mirrors the desktop layout's line-above/line-below split).
          const side = event.type === 'person' ? 'right' : 'left';
          const isExpanded = expandedKey === event.key;

          return (
            <div key={event.key}>
              {showDecade && <MobileDecadeLabel>{decade}</MobileDecadeLabel>}
              <MobileRow>
                <MobileCardLine $side={side}>
                  <MobileCardSlot>
                    <MobileCard
                      type="button"
                      $type={event.type}
                      onClick={() => onToggleExpand(event.key)}
                    >
                      <MobileYear>{event.year}</MobileYear>
                      <MobileCardTextBox>
                        <MobileEventText>{event.text}</MobileEventText>
                      </MobileCardTextBox>
                    </MobileCard>
                  </MobileCardSlot>
                </MobileCardLine>

                {isExpanded && (
                  <MobileExpandLine $side={side}>
                    <MobileExpandSlot>
                      <MobileExpandPanel>
                        {event.photo && <MobileExpandImage src={event.photo} alt="" />}
                        <MobileExpandYear>{event.year}</MobileExpandYear>
                        {event.personName && (
                          <MobileExpandName>{event.personName} 할머니</MobileExpandName>
                        )}
                        <MobileExpandText>{event.text}</MobileExpandText>
                      </MobileExpandPanel>
                    </MobileExpandSlot>
                  </MobileExpandLine>
                )}
              </MobileRow>
            </div>
          );
        })}
      </MobileTimelineWrap>
    </PageBg>
  );
}

function Archive() {
  const [selectedId, setSelectedId] = useState(grandmothers[0].id);
  const [expandedKey, setExpandedKey] = useState(null);
  const isMobile = useIsMobile();
  const sectionRef = useRef(null);
  const scrollRef = useRef(null);

  const selected = useMemo(
    () => grandmothers.find((g) => g.id === selectedId) ?? grandmothers[0],
    [selectedId]
  );

  // Government events + the selected grandmother's own events, merged into
  // one chronological list — only needed for the mobile branch below, but
  // computed unconditionally since hooks can't be called after an early
  // return.
  const mobileEvents = useMemo(() => {
    const gov = governmentTimeline.map((event) => ({
      key: `gov-${event.year}-${event.text}`,
      year: event.year,
      text: event.text,
      type: 'gov',
      photo: getPhoto('government', event.year),
      personName: null,
    }));
    const person = selected.events.map((event) => ({
      key: `${selected.id}-${event.year}-${event.text}`,
      year: event.year,
      text: event.text,
      type: 'person',
      photo: getPhoto(selected.id, event.year),
      personName: selected.name,
    }));
    return [...gov, ...person].sort((a, b) => a.year - b.year);
  }, [selected]);

  const handleSelect = (id) => {
    setSelectedId(id);
    setExpandedKey(null);
  };

  const handleToggleExpand = (key) => {
    setExpandedKey((current) => (current === key ? null : key));
  };

  const { positions, ticks, trackWidth } = useMemo(() => {
    const years = [
      ...governmentTimeline.map((event) => event.year),
      ...selected.events.map((event) => event.year),
    ];
    return buildYearLayout(years);
  }, [selected]);

  useEffect(() => {
    const handleWheel = (event) => {
      const section = sectionRef.current;
      const scroller = scrollRef.current;
      if (!section || !scroller) return;

      // Only take over once the pinned section is actually filling the
      // viewport (i.e. position: sticky has caught it at top: 0).
      const { top } = section.getBoundingClientRect();
      if (top > 0.5 || top < -0.5) return;

      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      const atStart = scroller.scrollLeft <= 0;
      const atEnd = scroller.scrollLeft >= maxScroll - 0.5;

      if ((event.deltaY > 0 && !atEnd) || (event.deltaY < 0 && !atStart)) {
        event.preventDefault();
        scroller.scrollLeft += event.deltaY;
      }
      // otherwise let the browser handle it — releases the pin so normal
      // vertical scroll can continue past (or back into) this section.
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  if (isMobile) {
    return (
      <ArchiveMobile
        selected={selected}
        onSelect={handleSelect}
        mobileEvents={mobileEvents}
        expandedKey={expandedKey}
        onToggleExpand={handleToggleExpand}
      />
    );
  }

  return (
    <PageBg>
      <Header />

      <ScrollShell>
        <IntroSection>
          <Icon src={girlMini} alt="" aria-hidden="true" />
          <Title>마침표 뒤, 끝나지 않은 시간들</Title>
          <Divider />
          <Description>
            미해결인 시간과, 이젠 멈춘 시간
            <br />
            1965년, 1993년, 2015년- 협상은 있었고, 합의문은 도장이 찍혔습니다.
            <br />
            정부의 시간은 문서 위에서 흐르고, 몇 줄의 문장으로 정리됩니다. 하지만 같은 시간,
            할머니들의 삶은 다르게 흘렀습니다.
            <br />
            매주 수요일, 같은 자리에서 같은 이야기를 반복해야 했던 시간. 증언하고, 기다리고,
            늙어가고, 그리고 하나둘 세상을 떠난 시간.
            <br />
            국가는 "해결됐다"고 말하는 동안, 당사자들은 여전히 끝나지 않은 하루하루를 살아야
            했습니다.
            <br />그 차이를 마주할 때, 비로소 우리는 묻게 됩니다. 이 문제는, 정말 끝난 것일까요?
          </Description>
        </IntroSection>

        <TimelineSection ref={sectionRef}>
          <SelectorOverlay>
            <SelectLabel>할머니 생애 살펴보기</SelectLabel>
            <PillRow>
              {grandmothers.map((g) => (
                <Pill
                  key={g.id}
                  type="button"
                  $active={g.id === selectedId}
                  onClick={() => setSelectedId(g.id)}
                >
                  {g.name} 할머니
                </Pill>
              ))}
            </PillRow>
          </SelectorOverlay>

          <ScrollTrack ref={scrollRef}>
            <Track style={{ width: trackWidth }}>
              <Line />

              {ticks.map(({ decade, x }) => (
                <DecadeTick key={decade} style={{ left: x }}>
                  <TickLabel>{decade}</TickLabel>
                  <TickMark />
                </DecadeTick>
              ))}

              {governmentTimeline.map((event) => {
                const photo = getPhoto('government', event.year);
                return (
                  <GovBox key={`gov-${event.year}-${event.text}`} style={{ left: positions.get(event.year) }}>
                    {photo && (
                      <PolaroidAbove className="polaroid">
                        <PolaroidImage src={photo} alt="" />
                        <PolaroidYear>{event.year}</PolaroidYear>
                        <PolaroidTextBox>
                          <PolaroidText>{event.text}</PolaroidText>
                        </PolaroidTextBox>
                      </PolaroidAbove>
                    )}
                    <GovCard>
                      <CardYear>{event.year}</CardYear>
                      <CardTextBox>
                        <CardText>{event.text}</CardText>
                      </CardTextBox>
                    </GovCard>
                    <Stem />
                  </GovBox>
                );
              })}

              {selected.events.map((event) => {
                const photo = getPhoto(selected.id, event.year);
                return (
                  <PersonBox
                    key={`${selected.id}-${event.year}-${event.text}`}
                    style={{ left: positions.get(event.year) }}
                  >
                    <Stem />
                    <PersonCard>
                      <CardYear>{event.year}</CardYear>
                      <CardTextBox>
                        <CardText>{event.text}</CardText>
                      </CardTextBox>
                    </PersonCard>
                    {photo && (
                      <PolaroidAbove className="polaroid">
                        <PolaroidImage src={photo} alt="" />
                        <PolaroidYear>{event.year}</PolaroidYear>
                        <PolaroidName>{selected.name} 할머니</PolaroidName>
                        <PolaroidTextBox>
                          <PolaroidText>{event.text}</PolaroidText>
                        </PolaroidTextBox>
                      </PolaroidAbove>
                    )}
                  </PersonBox>
                );
              })}
            </Track>
          </ScrollTrack>
        </TimelineSection>
      </ScrollShell>
    </PageBg>
  );
}

export default Archive;
