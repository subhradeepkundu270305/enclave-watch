import type { Variants } from "framer-motion";

/** Page entry/exit transition */
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

/** Staggered container for card grids */
export const containerVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/** Individual card inside a staggered grid */
export const cardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/** New alert row slides in from left */
export const alertRowVariant: Variants = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 150, damping: 20 } },
};

/** Infinite pulse glow for live status dots */
export const pulseVariant: Variants = {
  animate: {
    scale:   [1, 1.25, 1],
    opacity: [0.6, 1, 0.6],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
  },
};

/** Scroll-reveal for chart sections */
export const scrollRevealVariant: Variants = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

/** Sidebar nav item lateral nudge */
export const navItemHover = { x: 5, transition: { type: "spring", stiffness: 300, damping: 25 } };

/** Button press */
export const buttonTap = { scale: 0.94 };

/** Pipeline node cascade */
export const pipelineNodeVariant = (index: number): Variants => ({
  hidden:  { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1, scale: 1,
    transition: { delay: index * 0.12, duration: 0.4, ease: "easeOut" },
  },
});

/** Fade-in only */
export const fadeInVariant: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};
