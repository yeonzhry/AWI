import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { CloseIcon } from '../IconButton/icons';

const NAV_ITEMS = [
  { label: 'About', to: '/about' },
  { label: 'Interviews', to: '/interviews' },
  { label: 'Archive', to: '/archive' },
];

const MOBILE_BREAKPOINT = '640px';

const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 40px;
  pointer-events: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 18px 20px;
    justify-content: space-between;
  }
`;

// Full pill nav — the only thing visible above the mobile breakpoint.
const Nav = styled.nav`
  pointer-events: auto;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
`;

// Logo-left / hamburger-right pair — only visible at and below the mobile
// breakpoint, replacing the single wide pill which has no room to breathe
// once the three text links + logo have to share a phone-width bar.
const MobileBar = styled.div`
  display: none;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  pointer-events: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: flex;
  }
`;

const MenuButton = styled.button`
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--text-primary);
  color: var(--yellow-100);
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
`;

const HamburgerIcon = styled.svg`
  width: 18px;
  height: 14px;
`;

// Same cream-pill mood as the desktop nav, just stacked vertically and
// anchored under the hamburger button instead of laid out in one wide bar.
const MobileMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 10.5rem;
  padding: 0.5rem;
  border-radius: 1.5rem;
  background: var(--yellow-100);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--neutral-black) 25%, transparent);
  pointer-events: auto;
`;

const MobileNavWrap = styled.div`
  position: relative;
`;

// Rendered before MobileMenu in the DOM (not via z-index) so it paints
// underneath the dropdown but still above the rest of the page — both sit
// inside Bar's own stacking context (position: fixed + z-index: 100), so a
// plain DOM-order paint is enough without needing a local z-index of its own.
const MenuBackdrop = styled.button`
  position: fixed;
  inset: 0;
  pointer-events: auto;
  border: none;
  background: transparent;
  padding: 0;
  cursor: default;
`;

const NavList = styled.ul`
  display: inline-flex;
  align-items: center;
  height: 3.75rem;
  display: flex;
  padding: 0 0.53125rem;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  border-radius: 2rem;
  background: var(--yellow-100);
  list-style: none;
  margin: 0;
`;

const Mark = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  padding: 0.625rem 0.4375rem;
  gap: 0.625rem;
  border-radius: 1.375rem;
  border: none;
  background: ${(props) => (props.$isHome ? 'var(--button-primary)' : 'transparent')};
  cursor: pointer;
  flex-shrink: 0;
  /* MobileBar sets pointer-events: none on itself (only specific children,
     like MenuButton, opt back in) — Mark never opted in, so the mobile logo
     was silently unclickable. */
  pointer-events: auto;
`;

const MarkIcon = styled.img`
  height: ${(props) => (props.$isHome ? '20px' : '24px')};
  width: auto;
  filter: ${(props) => (props.$isHome ? 'none' : 'brightness(0)')};
`;

const linkStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.75rem 1.5rem;
  border-radius: 1.625rem;
  font-size: 1.25rem;
  font-family: 'SheLeeOkSun';
  font-style: normal;
  font-weight: 400;
  line-height: 1.4;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: var(--cta-interactive);
    color: var(--text-primary);
  }

  &:active {
    background: var(--button-primary);
    color: var(--neutral-white);
  }

`;

const NavAnchor = styled.a`
  ${linkStyles}
  color: var(--text-primary);
  background: transparent;
`;

const NavRouterLink = styled(Link)`
  ${linkStyles}
  color: ${(props) => (props.$active ? 'var(--neutral-white)' : 'var(--text-primary)')};
  background: ${(props) => (props.$active ? 'var(--button-primary)' : 'transparent')};

  ${(props) => props.$block && `width: 100%; justify-content: flex-start;`}
`;

function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  // A route change always came from the user picking somewhere to go, so
  // the mobile dropdown (if open) has served its purpose.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const renderNavItem = (item, { block } = {}) =>
    item.to ? (
      <NavRouterLink
        to={item.to}
        $active={location.pathname === item.to}
        $block={block}
        onClick={() => setMenuOpen(false)}
      >
        {item.label}
      </NavRouterLink>
    ) : (
      <NavAnchor href={item.href}>{item.label}</NavAnchor>
    );

  return (
    <Bar>
      <Nav aria-label="주요 메뉴">
        <NavList>
          <li>
            <Mark to="/" aria-label="홈으로" $isHome={isHome}>
              <MarkIcon src={logo} alt="" aria-hidden="true" $isHome={isHome} />
            </Mark>
          </li>
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>{renderNavItem(item)}</li>
          ))}
        </NavList>
      </Nav>

      <MobileBar>
        {/* Always styled like the Main-page ("home") logo mark, regardless
            of which page is actually active — unlike the desktop pill nav,
            this is the only thing in the mobile bar, so it doesn't need to
            visually announce "you're not on the home page" the way the
            desktop mark's active/inactive styling does. Still a real
            Link to "/", so tapping it from any other page goes home. */}
        <Mark to="/" aria-label="홈으로" $isHome>
          <MarkIcon src={logo} alt="" aria-hidden="true" $isHome />
        </Mark>

        <MobileNavWrap>
          <MenuButton
            type="button"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <CloseIcon width="14" height="14" />
            ) : (
              <HamburgerIcon viewBox="0 0 18 14" fill="none" aria-hidden="true">
                <path d="M0 1H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M0 7H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M0 13H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </HamburgerIcon>
            )}
          </MenuButton>

          {menuOpen && (
            <>
              <MenuBackdrop aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />
              <MobileMenu aria-label="주요 메뉴">
                {NAV_ITEMS.map((item) => (
                  <div key={item.label}>{renderNavItem(item, { block: true })}</div>
                ))}
              </MobileMenu>
            </>
          )}
        </MobileNavWrap>
      </MobileBar>
    </Bar>
  );
}

export default Header;
