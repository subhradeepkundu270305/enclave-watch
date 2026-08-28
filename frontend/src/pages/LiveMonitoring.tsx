import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, alertRowVariant } from "../lib/animations";
import { useSocket } from "../context/SocketProvider";

function fmtBytes(b: any): string {
  const n = typeof b === "number" ? b : Number(b);
  if (!isFinite(n) || isNaN(n)) return "0 B";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)} KB`;
  return `${n} B`;
}

function fmtTime(ts: any): string {
  const n = typeof ts === "number" ? ts : Number(ts);
  if (!isFinite(n) || isNaN(n)) return "--:--:--";
  return new Date(n * 1000).toLocaleTimeString();
}

const PROTO_COLOR: Record<string, string> = {
  TCP: "text-cyber-accent", UDP: "text-cyber-green", ICMP: "text-cyber-amber",
};

export default function LiveMonitoring() {
  const { subscribe } = useSocket();
  const [events, setEvents] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribe("network_event", (msg: any) => {
      if (paused) return;
      setEvents((p) => [msg, ...p].slice(0, 200));
    });
    return unsub;
  }, [subscribe, paused]);

  useEffect(() => {
    if (!paused && tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [events, paused]);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold gradient-text">Live Monitoring</h1>
          <p className="text-cyber-muted text-sm mt-1 font-mono">Real-time parsed connection events</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyber-muted text-xs font-mono">{events.length} events</span>
          <button
            onClick={() => setPaused((p) => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors
              ${paused ? "border-cyber-green text-cyber-green" : "border-cyber-red text-cyber-red"}`}
          >
            {paused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
        </div>
      </div>

      <div ref={tableRef} className="glass rounded-xl border border-cyber-border overflow-auto max-h-[78vh]">
        <table className="w-full text-[11px] font-mono">
          <thead className="sticky top-0 bg-cyber-surface/95 backdrop-blur z-10">
            <tr className="text-cyber-muted border-b border-cyber-border">
              {["Timestamp", "Protocol", "Source IP", "Destination IP", "Port", "Bytes Out", "Bytes In", "Duration", "Attack Type"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {events.map((ev, i) => (
                <motion.tr
                  key={ev.id ?? i}
                  layout
                  variants={alertRowVariant}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, height: 0 }}
                  className={`border-b border-cyber-border/30 hover:bg-cyber-surface/60 transition-colors
                    ${ev.attack_type && ev.attack_type !== "normal" ? "bg-cyber-red/5" : ""}`}
                >
                  <td className="px-3 py-2 text-cyber-muted">{fmtTime(ev.ts)}</td>
                  <td className={`px-3 py-2 ${PROTO_COLOR[ev.protocol] ?? "text-cyber-text"}`}>{ev.protocol}</td>
                  <td className="px-3 py-2 text-cyber-accent">{ev.src_ip}</td>
                  <td className="px-3 py-2 text-cyber-text">{ev.dst_ip}</td>
                  <td className="px-3 py-2 text-cyber-purple">{ev.dst_port}</td>
                  <td className="px-3 py-2 text-cyber-text">{fmtBytes(ev.bytes_out)}</td>
                  <td className="px-3 py-2 text-cyber-text">{fmtBytes(ev.bytes_in)}</td>
                  <td className="px-3 py-2 text-cyber-muted">{(ev.duration ?? 0).toFixed(3)}s</td>
                  <td className="px-3 py-2">
                    {ev.attack_type && ev.attack_type !== "normal" && (
                      <span className="text-cyber-red border border-cyber-red/40 rounded px-1.5 py-0.5 text-[9px]">
                        {ev.attack_type.toUpperCase()}
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {events.length === 0 && (
          <div className="p-12 text-center text-cyber-muted font-mono text-sm">
            Waiting for events…
          </div>
        )}
      </div>
    </motion.div>
  );
}
