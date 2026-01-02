import { type FC, type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  children?: ReactNode;
}

const ScrollToTop: FC<ScrollToTopProps> = (props) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const canControlScrollRestoration = 'scrollRestoration' in window.history;
    if (canControlScrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return props.children;
};

export default ScrollToTop;
