import { useEffect } from "react";

/**
 * useSmoothScroll — initialises Lenis smooth scroll and ties its RAF loop
 * to Framer Motion's useAnimationFrame so scroll-linked animations stay
 * perfectly in sync with page transitions.
 *
 * Call ONCE in App.tsx — not per page.
 */
export function useSmoothScroll() {
  useEffect(() => {
    // Lenis is loaded dynamically to avoid SSR issues in Vite
    let lenis: any = null;
    let rafId: number;

    async function init() {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
      });

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    }

    init().catch(() => {
      // Lenis unavailable — graceful degradation, native scroll still works
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);
}
