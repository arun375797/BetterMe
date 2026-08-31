import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ReactLenis, useLenis } from "lenis/react";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScroll({ children }) {
  if (prefersReducedMotion()) {
    return children;
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.16,
        duration: 0.7,
        smoothWheel: true,
        anchors: false,
        syncTouch: false,
      }}
    >
      <ScrollToTop />
      {children}
    </ReactLenis>
  );
}
