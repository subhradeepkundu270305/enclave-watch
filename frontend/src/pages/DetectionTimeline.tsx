import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { useSocket } from "../context/SocketProvider";
import { AlertBadge, ThreatTypeBadge } from "../components/AlertBadge";

export default function DetectionTimeline() {
  const { subscribe } = useSocket();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const unsub = subscribe("new_alert", (msg: any) => {
      const a = msg.alert ?? msg;
      setItems((p) => [a, ...p].slice(0, 50));
    });
    return unsub;
  }, [subscribe]);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">Detection Timeline</h1>

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-accent via-cyber-purple to-transparent" />

        {items.length === 0 && (
          <p className="text-cyber-muted font-mono text-sm">Waiting for alerts…</p>
        )}

        {items.map((a, i) => (
          <motion.div key={a.id ?? i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 120 }}
            className="relative mb-6">
            {/* Dot */}
            <div className="absolute -left-[18px] top-2 w-3 h-3 rounded-full border-2 border-cyber-accent bg-cyber-bg" />

            <div className="glass rounded-xl p-4 border border-cyber-border">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-cyber-muted text-[10px] font-mono">
                  {new Date((a.ts ?? 0) * 1000).toLocaleString()}
                </span>
                <AlertBadge severity={a.severity} />
                <ThreatTypeBadge type={a.threat_type} />
              </div>
              <p className="text-cyber-text text-sm font-semibold">{a.title}</p>
              <p className="text-cyber-muted text-xs mt-1">{a.description}</p>
              <div className="flex gap-4 mt-2 text-[10px] font-mono text-cyber-muted">
                <span>SRC: <span className="text-cyber-accent">{a.src_ip}</span></span>
                <span>CONF: <span className="text-cyber-text">{((a.confidence ?? 0) * 100).toFixed(0)}%</span></span>
                <span>RISK: <span className="text-cyber-amber">{(a.risk_score ?? 0).toFixed(2)}</span></span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
