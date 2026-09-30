export function CloseIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
      <path
        d="M1 1L13 13M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" {...props}>
      <path
        d="M9 1L1.7 8L9 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" {...props}>
      <path
        d="M1 1L8.3 8L1 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon(props) {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" {...props}>
      <path d="M15 9L0.75 17.2272V0.772758L15 9Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon(props) {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" {...props}>
      <rect x="0.5" y="0.5" width="4" height="15" rx="1" fill="currentColor" />
      <rect x="9.5" y="0.5" width="4" height="15" rx="1" fill="currentColor" />
    </svg>
  );
}
