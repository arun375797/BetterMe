import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ReactLenis, useLenis } from "lenis/react";

export const appLenis = { current: null };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  appLenis.current = lenis || null;

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScroll({ children }) {
  const reduced = prefersReducedMotion();

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: reduced ? 1 : 0.16,
        duration: reduced ? 0 : 0.7,
        smoothWheel: !reduced,
        anchors: false,
        syncTouch: false,
        prevent: (node) =>
          Boolean(
            node?.hasAttribute?.("data-lenis-prevent") ||
              node?.closest?.("[data-lenis-prevent]")
          ),
      }}
    >
      <ScrollToTop />
      {children}
    </ReactLenis>
  );
}
