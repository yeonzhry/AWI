import styled from 'styled-components';

const Circle = styled.button`
  display: flex;
  width: ${(props) => props.$size};
  height: ${(props) => props.$size};
  aspect-ratio: 1 / 1;
  justify-content: center;
  align-items: center;
  gap: 0.625rem;
  border-radius: ${(props) => props.$size};
  border: none;
  background: ${(props) => props.$background};
  color: ${(props) => props.$color};
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    /* transform: scale(0.94); */
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

function IconButton({
  children,
  onClick,
  ariaLabel,
  size = '2.75rem',
  background = 'rgba(235, 248, 252, 0.30)',
  color = 'var(--text-tertiary)',
  disabled = false,
  className,
}) {
  return (
    <Circle
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={className}
      $size={size}
      $background={background}
      $color={color}
    >
      {children}
    </Circle>
  );
}

export default IconButton;
