import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import HTMLFlipBook from 'react-pageflip';
import Header from '../components/Header/Header';
import book1 from '../assets/book1.svg';
import book2 from '../assets/book2.svg';
import book3 from '../assets/book3.svg';
import book4 from '../assets/book4.svg';
import bookMobile1 from '../assets/bookMobile1.svg';
import bookMobile2 from '../assets/bookMobile2.svg';
import bookMobile3 from '../assets/bookMobile3.svg';
import bookMobile4 from '../assets/bookMobile4.svg';
import trayArt from '../assets/Vector 20.svg';
import nextIcon from '../assets/next.svg';
import pastIcon from '../assets/past.svg';

const MOBILE_BREAKPOINT = 640;

// HTMLFlipBook's width/height/min*/max* are JS props, not CSS — react-pageflip
// sizes itself against those numbers regardless of viewport, so a desktop-only
// minWidth of 600 just overflows a ~390px phone screen outright. There's no
// CSS-only fix for that; the book's own size props have to change with the
// viewport.
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

const PageBg = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--neutral-10) 0%, var(--bg-secondary) 100%);
  
`;

const Stage = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 7rem 2rem 3rem;

  @media (max-width: 640px) {
    padding: 2rem 2.5rem 2.5rem;
  }
`;

// Sits right on top of the book's own edge (half in, half out) instead of
// out in the flex row — only one of these shows at a time (see About()),
// so the book stays centered no matter which page you're on. next.svg/
// past.svg are complete ready-made circular buttons, so this is just an
// unstyled <button> wrapping the icon for click/keyboard/aria semantics.
const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  display: block;
  border: none;
  background: none;
  padding: 0;
  line-height: 0;
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 640px) {
    img {
      width: 24px;
      height: 24px;
    }
  }
`;

const PrevButton = styled(NavButton)`
  left: -5rem;

  @media (max-width: 640px) {
    left: -3rem;
  }
`;

const NextButton = styled(NavButton)`
  right: -5rem;

  @media (max-width: 640px) {
    right: -3rem;
  }
`;

// Holds the flipbook plus the gray "tray" it visually rests on — the tray
// sits behind (negative z-index) and pokes out a bit past the book's own
// edges, same idea as the base/stand under the pages in the old book.svg.
const BookFrame = styled.div`
  position: relative;
  /* z-index: 0 (not the default auto) turns this into its own stacking
     context, so TrayArt's z-index: -1 is scoped to just behind it — without
     this, "-1" had no local context to attach to and escaped all the way up
     to the page root, landing behind PageBg's own opaque background instead
     of just behind the book. */
  z-index: 0;

`;

const TrayArt = styled.img`
  position: absolute;
  z-index: -1;
  /* img is a replaced element, so it needs an explicit width/height to
     stretch (top/right/bottom/left alone don't do it like they would for a
     plain div) — but setting all four insets *and* width/height at once is
     over-constrained and the browser silently drops right/bottom, which is
     what was collapsing the peek-out to nothing. Pin only top+left and size
     via width/height instead, so the extra size has somewhere to go. */
  top: 9%;
  left: -5%;
  width: 110%;
  height: 100%;
  pointer-events: none;
  user-select: none;

   @media (max-width: 640px) {
    display: none;
  }
`;

// book1–4 are complete pages (page-curl shape + illustration + text all
// baked into the vector already) — one per physical page, in reading order.
const PageImg = styled.img`
  /* width: 100rem; */
  height: auto;
  object-fit: fill;
  display: block;
  pointer-events: none;
  user-select: none;
`;

const pages = [
  <PageImg key="book1" src={book1} alt="소녀에게" />,
  <PageImg key="book2" src={book2} alt="프로젝트 소개" />,
  <PageImg key="book3" src={book3} alt="소녀에게, Interviews, Timeline 소개" />,
  <PageImg key="book4" src={book4} alt="Credits" />,
];

// Dedicated single-page art (no two-page-spread layout baked in) — mobile
// turns one full page at a time instead of showing a shrunk-down spread.
const mobilePages = [
  <PageImg key="bookMobile1" src={bookMobile1} alt="소녀에게" />,
  <PageImg key="bookMobile2" src={bookMobile2} alt="프로젝트 소개" />,
  <PageImg key="bookMobile3" src={bookMobile3} alt="소녀에게, Interviews, Timeline 소개" />,
  <PageImg key="bookMobile4" src={bookMobile4} alt="Credits" />,
];

function About() {
  const bookRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const isMobile = useIsMobile();
  const isFirst = pageIndex === 0;
  // usePortrait turns single pages on mobile instead of a two-page spread,
  // so "last" means the last individual page rather than the last spread.
  const isLast = isMobile ? pageIndex >= mobilePages.length - 1 : pageIndex >= pages.length - 2;
  const navIconSize = isMobile ? 32 : 44;

  return (
    <PageBg>
      <Header />
      <Stage>
        <BookFrame>
          <TrayArt src={trayArt} alt="" />
          {!isFirst && (
            <PrevButton
              aria-label="이전 페이지"
              onClick={() => bookRef.current?.pageFlip().flipPrev()}
            >
              <img src={pastIcon} alt="" width={navIconSize} height={navIconSize} />
            </PrevButton>
          )}
          <HTMLFlipBook
            key={isMobile ? 'mobile' : 'desktop'}
            ref={bookRef}
            /* Desktop stays a two-page spread at these per-page dimensions
               (actual rendered width ~2x). Mobile switches to usePortrait —
               one full page at a time — sized to bookMobile's own 420:595
               aspect ratio. */
            width={isMobile ? 280 : 760}
            height={isMobile ? 396 : 760}
            size="stretch"
            minWidth={isMobile ? 240 : 600}
            maxWidth={isMobile ? 320 : 760}
            minHeight={isMobile ? 340 : 520}
            maxHeight={isMobile ? 452 : 760}
            showCover={false}
            usePortrait={isMobile}
            drawShadow
            maxShadowOpacity={0.5}
            /* page-flip scales flippingTime down by how far the flip
               actually travels in px (capped at the full value once that
               distance hits 1000): duration = min(1, travelPx / 1000) *
               flippingTime. Desktop's spread is wide enough to already hit
               that cap, so the configured value applies almost as-is — but
               mobile's single narrow page travels well under 1000px, so the
               same number gets scaled down to a fraction of itself and the
               flip snaps shut in ~300ms no matter what's configured here.
               Compensating with a much larger number on mobile is what
               actually gets it back to a natural-feeling ~700-800ms. */
            flippingTime={isMobile ? 1500 : 800}
            onFlip={(e) => setPageIndex(e.data)}
          >
            {isMobile ? mobilePages : pages}
          </HTMLFlipBook>
          {!isLast && (
            <NextButton
              aria-label="다음 페이지"
              onClick={() => bookRef.current?.pageFlip().flipNext()}
            >
              <img src={nextIcon} alt="" width={navIconSize} height={navIconSize} />
            </NextButton>
          )}
        </BookFrame>
      </Stage>
    </PageBg>
  );
}

export default About;
