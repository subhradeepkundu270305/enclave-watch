import { motion } from "framer-motion";
import { cardVariants } from "../lib/animations";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  color?: "accent" | "green" | "red" | "amber" | "purple";
  icon?: React.ReactNode;
  live?: boolean;
}

const colorMap = {
  accent: { text: "text-cyber-accent", glow: "shadow-glow-accent", border: "border-cyber-accent/20" },
  green:  { text: "text-cyber-green",  glow: "shadow-glow-green",  border: "border-cyber-green/20"  },
  red:    { text: "text-cyber-red",    glow: "shadow-glow-red",    border: "border-cyber-red/20"    },
  amber:  { text: "text-cyber-amber",  glow: "shadow-glow-amber",  border: "border-cyber-amber/20"  },
  purple: { text: "text-cyber-purple", glow: "shadow-glow-purple", border: "border-cyber-purple/20" },
};

export function StatCard({ title, value, sub, color = "accent", icon, live }: StatCardProps) {
  const c = colorMap[color];
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`glass rounded-xl p-4 ${c.border} ${c.glow} relative overflow-hidden`}
    >
      {/* Background shimmer */}
      <div className={`absolute inset-0 opacity-5 ${c.text} bg-current rounded-xl`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <p className="text-cyber-muted text-xs font-mono uppercase tracking-widest">{title}</p>
          {icon && <span className={c.text}>{icon}</span>}
          {live && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`text-[8px] font-mono ${c.text} border border-current px-1 rounded`}
            >
              LIVE
            </motion.span>
          )}
        </div>
        <p className={`text-2xl font-mono font-bold ${c.text}`}>{value}</p>
        {sub && <p className="text-cyber-muted text-xs mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}
