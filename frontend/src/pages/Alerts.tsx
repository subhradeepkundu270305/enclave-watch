import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, alertRowVariant } from "../lib/animations";
import { useSocket } from "../context/SocketProvider";
import { AlertBadge, ThreatTypeBadge } from "../components/AlertBadge";
import { api } from "../lib/api";

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const TYPES = ["ALL", "ddos", "c2_beacon", "dns_tunnel", "encrypted_malware", "port_scan", "data_exfil"];

export default function Alerts() {
  const { subscribe } = useSocket();
  const [alerts, setAlerts]       = useState<any[]>([]);
  const [severity, setSeverity]   = useState("ALL");
  const [type, setType]           = useState("ALL");
  const [selected, setSelected]   = useState<any>(null);

  useEffect(() => {
    const params: Record<string, string> = { limit: "100" };
    if (severity !== "ALL") params.severity = severity;
    if (type !== "ALL") params.threat_type = type;
    api.alerts(params).then((r) => {
      setAlerts(r.alerts?.map((b: any) => b.alert ?? b) ?? []);
    }).catch(() => {});
  }, [severity, type]);

  useEffect(() => {
    const unsub = subscribe("new_alert", (msg: any) => {
      const a = msg.alert ?? msg;
      setAlerts((p) => [a, ...p]);
    });
    return unsub;
  }, [subscribe]);

  const filtered = alerts.filter((a) =>
    (severity === "ALL" || a.severity === severity) &&
    (type === "ALL" || a.threat_type === type)
  );

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">Alerts</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <p className="text-cyber-muted text-[10px] font-mono mb-1">SEVERITY</p>
          <div className="flex gap-1">
            {SEVERITIES.map((s) => (
              <button key={s} onClick={() => setSeverity(s)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors
                  ${severity === s ? "bg-cyber-accent/20 text-cyber-accent border-cyber-accent/50" : "border-cyber-border text-cyber-muted hover:border-cyber-accent/30"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-cyber-muted text-[10px] font-mono mb-1">TYPE</p>
          <div className="flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors
                  ${type === t ? "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/50" : "border-cyber-border text-cyber-muted hover:border-cyber-purple/30"}`}>
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl border border-cyber-border overflow-auto max-h-[70vh]">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-cyber-surface/95 backdrop-blur">
            <tr className="text-cyber-muted border-b border-cyber-border">
              {["Time", "Severity", "Type", "Source IP", "Confidence", "Title", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((a, i) => (
                <motion.tr key={a.id ?? i} variants={alertRowVariant} initial="hidden" animate="visible"
                  className="border-b border-cyber-border/30 hover:bg-cyber-surface/60 cursor-pointer"
                  onClick={() => setSelected(a)}>
                  <td className="px-3 py-2 text-cyber-muted">{new Date((a.ts ?? 0) * 1000).toLocaleTimeString()}</td>
                  <td className="px-3 py-2"><AlertBadge severity={a.severity} /></td>
                  <td className="px-3 py-2"><ThreatTypeBadge type={a.threat_type} /></td>
                  <td className="px-3 py-2 text-cyber-accent">{a.src_ip}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-cyber-border rounded-full overflow-hidden">
                        <div className="h-full bg-cyber-accent rounded-full" style={{ width: `${(a.confidence ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-cyber-text">{((a.confidence ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-cyber-text truncate max-w-xs">{a.title}</td>
                  <td className="px-3 py-2 text-cyber-accent">→</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-cyber-muted py-12 font-mono text-sm">No alerts match filters</p>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-strong rounded-xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-cyber-accent font-mono font-bold text-sm">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-cyber-muted hover:text-cyber-text">✕</button>
              </div>
              <pre className="text-[10px] text-cyber-text font-mono bg-cyber-bg/60 rounded-lg p-4 overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(selected, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
