import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Settings() {
  const [settings, setSettings] = useState<any>({});
  useEffect(() => { api.settings().then(setSettings).catch(() => {}); }, []);

  const rows = [
    { label: "Operation Mode", value: settings.operation_mode ?? "PASSIVE_MONITORING" },
    { label: "Egress Rule", value: settings.egress_rule ?? "BLOCK_ALL" },
    { label: "Data Retention", value: `${settings.data_retention_days ?? 90} days` },
    { label: "WS Ping Interval", value: "30s" },
    { label: "EWMA α", value: "0.3" },
    { label: "EWMA k (threshold)", value: "3.0" },
    { label: "CUSUM h", value: "5.0" },
    { label: "Port Scan Unique Port Threshold", value: "15" },
    { label: "DNS Entropy Threshold", value: "3.5" },
    { label: "TLS Mahalanobis Threshold", value: "3.0" },
    { label: "Feature Window", value: "60s" },
    { label: "Traffic Gen Interval", value: "200ms" },
  ];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6 max-w-2xl">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-2">Settings</h1>
      <p className="text-cyber-muted text-sm font-mono mb-6">Read-only configuration display</p>

      <div className="glass rounded-xl border border-cyber-border overflow-hidden">
        {rows.map(({ label, value }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="flex items-center justify-between px-5 py-3 border-b border-cyber-border/40 hover:bg-cyber-surface/40 transition-colors">
            <span className="text-cyber-muted text-xs font-mono">{label}</span>
            <span className="text-cyber-accent text-xs font-mono font-bold">{value}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 glass rounded-xl p-5 border border-cyber-border">
        <h2 className="text-sm font-mono font-semibold text-cyber-amber mb-3">Read-Only Notice</h2>
        <p className="text-cyber-muted text-sm">
          This system operates in passive monitoring mode. Configuration changes require physical access
          to the enclave and a signed update package. Settings cannot be modified via the dashboard interface.
        </p>
      </div>
    </motion.div>
  );
}
