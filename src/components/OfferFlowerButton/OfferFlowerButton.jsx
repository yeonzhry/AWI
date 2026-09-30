import { useState } from 'react';
import styled from 'styled-components';
import triBtnDefault from '../../assets/triBtn_PC_hover.svg';
import triBtnHover from '../../assets/tributing.svg';

// The default and hover artwork are two separate Figma exports with different
// canvas crops around the same envelope shape, so a naive width/height swap
// makes the envelope jump. These numbers scale + offset the hover artwork so
// the envelope's own silhouette stays anchored in the same spot on hover.
const DEFAULT_WIDTH = 7.66344;
const DEFAULT_HEIGHT = 8.89782;
const HOVER_WIDTH = 9.66931;
const HOVER_HEIGHT = 12.3438;
const HOVER_LEFT = -0.98876;
const HOVER_TOP = -3.68748;

const Button = styled.button`
  position: relative;
  display: inline-block;
  width: ${DEFAULT_WIDTH}rem;
  height: ${DEFAULT_HEIGHT}rem;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  /* A CSS var (rather than touching the rem sizes above) so the delicate
     hover-offset math for the two mismatched artwork crops stays untouched —
     scaling the whole button visually down is independent of that. */
  --scale: 1;
  transition: transform 0.2s ease;
  transform: ${(props) => (props.$hovered ? 'translateY(-3px) scale(var(--scale))' : 'scale(var(--scale))')};

  @media (max-width: 640px) {
    --scale: 0.72;

  }

  &:active {
    transform: translateY(0) scale(calc(var(--scale) * 0.97));
  }
`;

const Art = styled.img`
  position: absolute;
  pointer-events: none;
  width: ${(props) => (props.$hovered ? HOVER_WIDTH : DEFAULT_WIDTH)}rem;
  height: ${(props) => (props.$hovered ? HOVER_HEIGHT : DEFAULT_HEIGHT)}rem;
  left: ${(props) => (props.$hovered ? HOVER_LEFT : 0)}rem;
  top: ${(props) => (props.$hovered ? HOVER_TOP :1)}rem;
`;

function OfferFlowerButton({ onClick, label = '헌화하기', className, hoverEnabled = true }) {
  const [hovered, setHovered] = useState(false);

  const activate = () => {
    if (hoverEnabled) setHovered(true);
  };
  const deactivate = () => setHovered(false);

  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={className}
      $hovered={hovered}
      onMouseEnter={activate}
      onMouseLeave={deactivate}
      onFocus={activate}
      onBlur={deactivate}
    >
      <Art
        src={hovered ? triBtnHover : triBtnDefault}
        alt=""
        aria-hidden="true"
        $hovered={hovered}
      />
    </Button>
  );
}

export default OfferFlowerButton;
