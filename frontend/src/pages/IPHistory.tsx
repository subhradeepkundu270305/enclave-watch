import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, cardVariants } from "../lib/animations";
import { api } from "../lib/api";
import { AlertBadge } from "../components/AlertBadge";

export default function IPHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ipHistory().then((r) => { setRecords(r.records ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const total = records.length;
  const topIp = records[0]?.src_ip ?? "—";
  const repeats = records.filter((r) => r.total_alerts > 1).length;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">IP History</h1>

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Top Attacker", value: topIp, color: "text-cyber-red" },
          { label: "Total IPs", value: total.toString(), color: "text-cyber-accent" },
          { label: "Repeat Offenders", value: `${repeats} (${total ? ((repeats/total)*100).toFixed(0) : 0}%)`, color: "text-cyber-amber" },
        ].map(({ label, value, color }) => (
          <motion.div key={label} variants={cardVariants} className="glass rounded-xl p-4 border border-cyber-border">
            <p className="text-cyber-muted text-[10px] font-mono uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-lg font-mono font-bold ${color}`}>{value}</p>
          </motion.div>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex justify-center p-12">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="glass rounded-xl border border-cyber-border overflow-auto max-h-[60vh]">
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-cyber-surface/95 backdrop-blur">
              <tr className="text-cyber-muted border-b border-cyber-border">
                {["Source IP", "Alerts", "Highest Severity", "Threat Types", "First Seen", "Last Seen"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <motion.tr key={r.src_ip ?? i}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-cyber-border/30 hover:bg-cyber-surface/50 transition-colors">
                  <td className="px-3 py-2 text-cyber-accent">{r.src_ip}</td>
                  <td className="px-3 py-2 text-cyber-text font-bold">{r.total_alerts}</td>
                  <td className="px-3 py-2"><AlertBadge severity={r.highest_severity ?? "LOW"} /></td>
                  <td className="px-3 py-2 text-cyber-muted">{r.threat_types}</td>
                  <td className="px-3 py-2 text-cyber-muted">{new Date((r.first_seen ?? 0) * 1000).toLocaleString()}</td>
                  <td className="px-3 py-2 text-cyber-muted">{new Date((r.last_seen ?? 0) * 1000).toLocaleString()}</td>
                </motion.tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={6} className="text-center text-cyber-muted py-10">No IP history yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
