import { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import Header from '../components/Header/Header';
import OfferFlowerButton from '../components/OfferFlowerButton/OfferFlowerButton';
import LetterModal from '../components/LetterModal/LetterModal';
import PetalField from '../components/PetalField/PetalField';
import IconButton from '../components/IconButton/IconButton';
import { CloseIcon } from '../components/IconButton/icons';
import girlPcImg from '../assets/girl_pc.svg';
import curveLine from '../assets/Line 2.svg';
import useWindowScrollY from '../hooks/useWindowScrollY';
import { fetchOfferings, createOffering } from '../services/offerings';
import { moderateComment } from '../lib/moderation';

// Anchor point of the chair's tabletop within girl_pc.svg's own 640x551 viewBox,
// expressed as percentages so the overlay lines up with the artwork at any size.
const CHAIR_X_PERCENT = 32.7;
const CHAIR_SURFACE_PERCENT = 58;

const DARKEN_DELAY_MS = 1100;
const OFFERING_SCROLL_HEIGHT_VH = 500;

// Once the full darken-and-explain intro has been shown and closed, later
// visits skip straight to the reduced "hover the button to see it again"
// version instead of replaying the whole sequence every time.
const INTRO_SEEN_KEY = 'sonyeoege:introSeen';

function hasSeenIntro() {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Ignore write failures (private browsing, storage disabled, etc.) —
    // worst case the intro just replays next visit.
  }
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const growIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const popIn = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.7); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const lineGrow = keyframes`
  from { height: 0; opacity: 0; }
  to { height: 26px; opacity: 1; }
`;

const ScrollArea = styled.div`
  position: relative;
  height: ${(props) => (props.$tall ? `${OFFERING_SCROLL_HEIGHT_VH}vh` : '100vh')};
`;

const Stage = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 130px 24px 60px;
  background: linear-gradient(180deg, var(--neutral-10) 0%, var(--bg-secondary) 64.1%);

  @media (max-width: 640px) {
    padding: 96px 16px 40px;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 10rem;

  @media (max-width: 640px) {
    margin-top: 16rem;
  }
`;

const SceneImage = styled.img`
  display: block;
  /* height-only sizing (min(72vh, 620px)) is fine on desktop's wide-short
     viewports, but on a narrow-tall phone viewport 72vh is huge relative to
     width, blowing the image (and the girl figure) way past the screen edge.
     Constraining both axes and letting the browser pick whichever is
     tighter keeps the same desktop size while capping it on mobile. */
  width: auto;
  height: auto;
  max-height: min(72vh, 620px);
  max-width: 92vw;
  position: relative;
  z-index: 2;
  animation: ${fadeIn} 0.7s ease-out both;
`;

const DarkOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--neutral-black);
  pointer-events: none;
  opacity: ${(props) => (props.$active ? 0.3 : 0)};
  transition: opacity 1s ease;
`;

const FloorOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  height: min(22.8125rem, 45vh);
  background: linear-gradient(0deg, #ecf5ef 0%, #c5e1cf 81.25%, rgba(42, 48, 51, 0) 100%);
  opacity: ${(props) => (props.$active ? 1 : 0)};
  transition: opacity 1.2s ease;
  pointer-events: none;
`;

const InviteStack = styled.div`
  position: absolute;
  left: ${CHAIR_X_PERCENT}%;
  bottom: ${100 - CHAIR_SURFACE_PERCENT}%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(280px, 62vw);
  z-index: 20;
`;

const Modal = styled.div`
  /* Wide enough to fit the whole body sentence on one line — grows past
     InviteStack's own (narrow) width and stays centered on the chair. */
  width: max-content;
  max-width: 90vw;
  padding: 24px 22px 20px;
  border-radius: 16px;
  /* background: rgba(24, 25, 27, 0.72); */
  /* border: 1px solid rgba(255, 255, 255, 0.1); */
  text-align: center;
  color: #f4f4f2;
  opacity: 0;
  animation: ${growIn} 0.6s ease-out 2.05s forwards;

  /* The chair (and this card's centering anchor) sits left of screen
     center, so on a phone-width screen there isn't equal room on both
     sides for a card that's allowed to grow wider than InviteStack — it
     just runs off the left edge. Below the one-liner's breakpoint, go
     back to wrapping within InviteStack's own narrow width instead. */
  /* Mobile gets its own centered version (MobileIntroWrap) instead — the
     chair sits well left of screen-center on a phone, so a card anchored to
     it can't also read as "centered on the screen" the way the mockup wants. */
  @media (max-width: 640px) {
    display: none;
  }
`;

// Same box, but shown as an instant hover preview on repeat visits — no long
// choreographed delay, just a quick fade in/out while the button is hovered.
// Hover isn't a touch-device concept, so this never shows on mobile at all —
// mobile only ever gets the once-per-visit intro (see MobileIntroWrap).
const PreviewModal = styled(Modal)`
  opacity: 0;
  animation: ${fadeIn} 0.2s ease-out forwards;

  @media (max-width: 640px) {
    display: none;
  }
`;

const CloseBtn = styled(IconButton)`
  position: absolute;
  top: -1.6rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(235, 248, 252, 0.30);
  img {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 640px) {
    margin-top: -2rem;
    img {
    width: 32px;
    height: 32px;
  }
  }
`;

const Title = styled.h2`
  margin-bottom: 1rem;
  font-family: Pretendard;
  font-size: 1.25rem;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 1.1rem;
    margin-bottom: 10rem;
    margin-top: -1rem;
  }
`;

const Body = styled.p`
  margin: 0;
  font-family: Pretendard;
  font-size: 0.8rem;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  color: var(--text-secondary, #B2B2B2);
  text-align: center;
  margin-top: 1.2rem;
  white-space: nowrap;

  @media (max-width: 640px) {
    white-space: normal;
    word-break: keep-all;
    margin-top: -9.5rem;
  }
`;

const Connector = styled.div`
  width: 1px;
  height: 0;
  border-left: 1px dashed color-mix(in srgb, var(--neutral-white) 40%, transparent);
  opacity: 0;
  animation: ${lineGrow} 0.35s ease-out 1.9s forwards;

  /* Replaced by the curved MobileCurve on mobile (see below). */
  @media (max-width: 640px) {
    display: none;
  }
`;

const PreviewConnector = styled(Connector)`
  animation: ${lineGrow} 0.2s ease-out forwards;
`;

// Mobile-only centered intro card + the curved dashed line down to the
// chair-anchored caption/button. Only shown before the first dismiss —
// mobile has no hover-preview replay, just the once-per-visit intro.
// Positioned relative to ImageWrapper (not InviteStack, which is itself
// off-center — anchored to the chair) so "left: 50%" here really is the
// screen's horizontal center, matching the mockup.
const MobileIntroWrap = styled.div`
  display: none;
  position: absolute;
  top: -11rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(320px, 86vw);
  z-index: 25;

  @media (max-width: 640px) {
    display: block;
  }
`;

// growIn's own keyframes animate `transform` (translateY + scale) — putting
// that animation directly on MobileIntroWrap would silently replace its
// static translateX(-50%) centering for the whole time the animation is
// active/forwards-filled (only one `transform` value can win), which is
// exactly what was knocking the card off-center once it finished animating.
// Splitting the animated grow-in onto an inner element keeps the outer
// wrapper's centering transform untouched.
const MobileIntroInner = styled.div`
  text-align: center;
  /* Desktop's title/body get their light color for free by inheriting it
     from Modal's own color: #f4f4f2. MobileIntroInner had no such color
     set, so Title fell back to the page's default (near-black) text color
     instead. */
  color: #f4f4f2;
  opacity: 0;
  animation: ${growIn} 0.6s ease-out 2.05s forwards;
`;

const MobileCurveWrap = styled.div`
  display: none;
  position: absolute;
  top: -3rem;
  left: 38%;
  width: 2.75rem;
  pointer-events: none;
  z-index: 24;
  opacity: 0;
  animation: ${fadeIn} 0.4s ease-out 2.3s forwards;

  @media (max-width: 640px) {
    display: block;
  }
`;

const MobileCurveImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  margin-top: -4rem;
`;

const Caption = styled.p`
  /* margin: 10px 0; */
  font-size: 1.25rem;
  font-family: 'SheLeeOkSun';
  font-weight: 400;
  color: #f4f4f2;
  opacity: ${(props) => (props.$instant ? 1 : 0)};
  animation: ${(props) => (props.$instant ? 'none' : css`${fadeIn} 0.5s ease-out 1.4s forwards`)};

  @media (max-width: 640px) {
    margin-bottom: 0.5rem;
  }
`;

const ButtonSlot = styled.div`
  /* The envelope artwork has a little transparent canvas above the envelope
     itself (room for its glow/sparkle decorations), which otherwise pushes
     the caption + invite card further from the chair than they should be.
     Pull that dead space out of the flex flow. */
  margin-top: -0.75rem;
  opacity: ${(props) => (props.$instant ? 1 : 0)};
  animation: ${(props) => (props.$instant ? 'none' : css`${popIn} 0.5s ease-out 1.5s forwards`)};

  @media (max-width: 640px) {
    margin-top: -1.75rem;
  }
`;

function Main() {
  // Tracks whether the full intro has already been shown+closed — either
  // from a previous visit (localStorage) or from closing it just now in this
  // same session, so the hover preview kicks in immediately without needing
  // a reload.
  const [seenIntro, setSeenIntro] = useState(hasSeenIntro);
  const [dismissed, setDismissed] = useState(seenIntro);
  const [darkened, setDarkened] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [offerings, setOfferings] = useState([]);
  const [viewingOffering, setViewingOffering] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const scrollY = useWindowScrollY();

  useEffect(() => {
    // Return visits skip the darken-background intro entirely — they only
    // get the quick hover preview on the offer button, never a dark screen.
    if (seenIntro) return undefined;
    const timer = setTimeout(() => setDarkened(true), DARKEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [seenIntro]);

  useEffect(() => {
    fetchOfferings()
      .then(setOfferings)
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load offerings from Supabase:', error);
      });
  }, []);

  const handleOffer = () => {
    setDismissed(true);
    setSeenIntro(true);
    markIntroSeen();
  };

  const closePreview = () => setHoverPreview(false);

  const handleLetterSubmit = async (message) => {
    // Client-side-only filter (see src/lib/moderation.js) — profanity blocks
    // outright, borderline AI-flagged/history-denial text goes in hidden for
    // review instead of being rejected, everything else posts normally.
    const moderation = moderateComment(message);
    if (moderation.action === 'block') {
      window.alert(moderation.reason);
      return false;
    }

    setLetterOpen(false);
    handleOffer();

    const isHidden = moderation.action === 'review';

    try {
      const offering = await createOffering(message, isHidden);
      if (isHidden) {
        window.alert('검토 대기 상태로 등록되었습니다. 관리자 확인 후 게시됩니다.');
      } else {
        setOfferings((prev) => [...prev, offering]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save offering to Supabase:', error);
      // Keep the petal appearing locally even if the write failed, so the
      // flow doesn't feel broken while Supabase credentials are being set up.
      // A "review" message that failed to save stays hidden rather than
      // showing up locally, since it was never actually approved.
      if (!isHidden) {
        setOfferings((prev) => [
          ...prev,
          { id: `local-${Date.now()}`, message, created_at: new Date().toISOString() },
        ]);
      }
    }

    return true;
  };

  const handlePetalClick = (offering) => {
    setViewingOffering(offering);
    setViewOpen(true);
  };

  return (
    <>
      <Header />

      <ScrollArea $tall={dismissed}>
        <Stage>
          <FloorOverlay $active={dismissed} />

          <ImageWrapper>
            <SceneImage src={girlPcImg} alt="촛불 켜진 의자 옆에 앉은 소녀상" draggable="false" />

            <InviteStack
              onMouseEnter={() => seenIntro && setHoverPreview(true)}
              onMouseLeave={() => seenIntro && setHoverPreview(false)}
            >
              {!dismissed && (
                <>
                  <Modal>
                    <CloseBtn
                      onClick={handleOffer}
                      ariaLabel="닫기"
                      size="2.5rem"
                      background="var(--button-primary)"
                      color="var(--neutral-white)"
                    >
                      <CloseIcon width="14" height="14" />
                    </CloseBtn>
                    <Title>소녀에게 마음을 전해보세요</Title>
                    <Body>
                      소녀의 옆자리에 한 문장을 남겨주세요.
                      <br/>남긴 글은 이옥선 할머니의 손글씨로 새겨집니다.

                    </Body>
                  </Modal>
                  <Connector />
                </>
              )}
              {dismissed && seenIntro && hoverPreview && (
                <>
                  <PreviewModal>
                    <CloseBtn
                      onClick={closePreview}
                      ariaLabel="닫기"
                      size="2.5rem"
                      background="var(--button-primary)"
                      color="var(--neutral-white)"
                    >
                      <CloseIcon width="14" height="14" />
                    </CloseBtn>
                    <Title>소녀에게 마음을 전해보세요</Title>
                    <Body>
                      소녀의 옆자리에 한 문장을 남겨주세요.
                      <br/>남긴 글은 이옥선 할머니의 손글씨로 새겨집니다.
                    </Body>
                  </PreviewModal>
                  <PreviewConnector />
                </>
              )}
              <Caption $instant={seenIntro}>헌화하기</Caption>
              <ButtonSlot $instant={seenIntro}>
                <OfferFlowerButton
                  onClick={() => setLetterOpen(true)}
                  hoverEnabled={dismissed}
                />
              </ButtonSlot>
            </InviteStack>

            {!dismissed && (
              <>
                <MobileIntroWrap>
                  <MobileIntroInner>
                    <CloseBtn
                      onClick={handleOffer}
                      ariaLabel="닫기"
                      size="2.5rem"
                      background="var(--button-primary)"
                      color="var(--neutral-white)"
                    >
                      <CloseIcon width="14" height="14" />
                    </CloseBtn>
                    <Title>소녀에게 마음을 전해보세요</Title>
                    <Body>
                      소녀의 옆자리에 한 문장을 남겨주세요.
                      <br />남긴 글은 이옥선 할머니의 손글씨로 새겨집니다.
                    </Body>
                  </MobileIntroInner>
                </MobileIntroWrap>

                <MobileCurveWrap>
                  <MobileCurveImg src={curveLine} alt="" />
                </MobileCurveWrap>
              </>
            )}
          </ImageWrapper>

          {dismissed && (
            <PetalField scrollY={scrollY} offerings={offerings} onPetalClick={handlePetalClick} />
          )}

          <DarkOverlay $active={darkened && !dismissed} />
        </Stage>
      </ScrollArea>

      <LetterModal
        open={letterOpen}
        onClose={() => setLetterOpen(false)}
        onSubmit={handleLetterSubmit}
      />

      <LetterModal
        open={viewOpen}
        /* Only hides the modal (open: false) — deliberately doesn't clear
           viewingOffering here. Doing so used to null out viewMessage in
           the same tick as the close, flipping isViewOnly to false while
           the modal was still mid-fade-out, so it would visibly swap to
           the "write a letter" layout for an instant right as it closed.
           Leaving the last-viewed offering in place until the next petal
           click overwrites it keeps the content stable through the fade. */
        onClose={() => setViewOpen(false)}
        viewMessage={viewingOffering?.message}
      />
    </>
  );
}

export default Main;
