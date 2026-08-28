import { motion } from "framer-motion";
import { cardVariants } from "../lib/animations";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "accent" | "green" | "red" | "amber" | "purple" | "none";
  hover?: boolean;
}

const glowMap = {
  accent: "shadow-glow-accent border-cyber-accent/20",
  green:  "shadow-glow-green  border-cyber-green/20",
  red:    "shadow-glow-red    border-cyber-red/20",
  amber:  "shadow-glow-amber  border-cyber-amber/20",
  purple: "shadow-glow-purple border-cyber-purple/20",
  none:   "border-cyber-border",
};

export function GlowCard({ children, className = "", glow = "none", hover = true }: GlowCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`glass rounded-xl border ${glowMap[glow]} ${className}`}
    >
      {children}
    </motion.div>
  );
}
