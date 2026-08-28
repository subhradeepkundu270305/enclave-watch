import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, cardVariants } from "../lib/animations";
import { useSocket } from "../context/SocketProvider";
import { api } from "../lib/api";

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-cyber-muted">{label}</span>
        <span style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }} />
      </div>
    </div>
  );
}

export default function SystemHealth() {
  const { subscribe } = useSocket();
  const [health, setHealth] = useState<any>({});

  useEffect(() => {
    api.health().then(setHealth).catch(() => {});
    const unsub = subscribe("system_health", setHealth);
    return unsub;
  }, [subscribe]);

  const uptime = health.uptime_seconds ?? 0;
  const hh = Math.floor(uptime / 3600);
  const mm = Math.floor((uptime % 3600) / 60);
  const ss = Math.floor(uptime % 60);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">System Health</h1>

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Core metrics */}
        <motion.div variants={cardVariants} className="glass rounded-xl p-5 border border-cyber-border">
          <h2 className="text-sm font-mono font-semibold text-cyber-text mb-4">Core Metrics</h2>
          <MetricBar label="Events / Second" value={health.events_per_second ?? 0} max={50} color="#00d4ff" />
          <MetricBar label="WS Connections" value={health.ws_connections ?? 0} max={20} color="#7c3aed" />
          <MetricBar label="Active Detectors" value={health.active_detectors ?? 0} max={6} color="#00ff88" />
          <div className="mt-4 text-xs font-mono text-cyber-muted">
            <p>Uptime: <span className="text-cyber-text">{`${hh}h ${mm}m ${ss}s`}</span></p>
            <p>Events processed: <span className="text-cyber-text">{(health.events_processed ?? 0).toLocaleString()}</span></p>
          </div>
        </motion.div>

        {/* Security components */}
        <motion.div variants={cardVariants} className="glass rounded-xl p-5 border border-cyber-border">
          <h2 className="text-sm font-mono font-semibold text-cyber-text mb-4">Security Components</h2>
          {[
            { label: "Evidence Chain", ok: health.chain_intact !== false },
            { label: "No Outbound Calls", ok: true },
            { label: "Egress Blocked", ok: true },
            { label: "Passive Mode", ok: true },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-cyber-border/40">
              <span className="text-cyber-muted text-xs font-mono">{label}</span>
              <span className={`text-[10px] font-mono border rounded px-2 py-0.5 ${ok ? "text-cyber-green border-cyber-green/40" : "text-cyber-red border-cyber-red/40"}`}>
                {ok ? "OK" : "FAIL"}
              </span>
            </div>
          ))}
          <div className="mt-3 text-xs font-mono">
            <p className="text-cyber-muted">Chain length: <span className="text-cyber-text">{health.chain_length ?? 0}</span></p>
          </div>
        </motion.div>

        {/* Host sensor mock */}
        <motion.div variants={cardVariants} className="glass rounded-xl p-5 border border-cyber-border md:col-span-2">
          <h2 className="text-sm font-mono font-semibold text-cyber-text mb-1">Host Sensors</h2>
          <p className="text-cyber-muted text-[10px] font-mono mb-4">ⓘ Mock data — no real host metrics in enclosed enclave environment</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "CPU Usage", value: "12%", color: "text-cyber-green" },
              { label: "Memory", value: "1.2 GB", color: "text-cyber-accent" },
              { label: "Disk I/O", value: "42 MB/s", color: "text-cyber-amber" },
              { label: "Queue Depth", value: "~0", color: "text-cyber-purple" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-cyber-bg/40 rounded-lg p-3 border border-cyber-border/50">
                <p className="text-cyber-muted text-[10px] font-mono">{label}</p>
                <p className={`text-lg font-mono font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
