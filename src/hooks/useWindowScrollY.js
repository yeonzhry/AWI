import { useEffect, useState } from 'react';

function useWindowScrollY() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let frame = null;

    const measure = () => {
      frame = null;
      setScrollY(window.scrollY);
    };

    const onScroll = () => {
      if (frame === null) {
        frame = requestAnimationFrame(measure);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return scrollY;
}

export default useWindowScrollY;
