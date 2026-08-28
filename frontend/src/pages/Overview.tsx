import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { pageVariants, containerVariants } from "../lib/animations";
import { useSocket } from "../context/SocketProvider";
import { StatCard } from "../components/StatCard";
import { AlertBadge, ThreatTypeBadge } from "../components/AlertBadge";
import { api } from "../lib/api";
import { Activity, Shield, Zap, Link } from "lucide-react";

const PIPELINE_STAGES = [
  { label: "Traffic Copy",    desc: "TAP / SPAN / Diode input",        color: "text-cyber-accent", dotBg: "bg-cyber-accent", glow: "shadow-[0_0_10px_#00f0ff]" },
  { label: "Network Parsing", desc: "Zeek-style conn.log extraction",   color: "text-cyber-green",  dotBg: "bg-cyber-green",  glow: "shadow-[0_0_10px_#00ff88]" },
  { label: "Streaming",       desc: "asyncio.Queue (Kafka substitute)", color: "text-cyber-amber",  dotBg: "bg-cyber-amber",  glow: "shadow-[0_0_10px_#ffb700]" },
  { label: "AI Detection",    desc: "6 parallel ML detectors",          color: "text-cyber-purple", dotBg: "bg-cyber-purple", glow: "shadow-[0_0_10px_#a855f7]" },
  { label: "Alert & Evidence",desc: "SHA-256 + Ed25519 chain",          color: "text-cyber-red",    dotBg: "bg-cyber-red",    glow: "shadow-[0_0_10px_#ff0055]" },
  { label: "Dashboard",       desc: "React UI over WebSocket",           color: "text-cyber-accent", dotBg: "bg-cyber-accent", glow: "shadow-[0_0_10px_#00f0ff]" },
];

export default function Overview() {
  const { subscribe } = useSocket();
  const [health, setHealth]         = useState<any>({ uptime_seconds: 3600, active_detectors: 6, chain_length: 12 });
  const [recentAlerts, setRecent]   = useState<any[]>([]);
  const [epsData, setEpsData]       = useState<{ t: string; eps: number }[]>([
    { t: "14:00", eps: 12 }, { t: "14:01", eps: 18 }, { t: "14:02", eps: 15 },
    { t: "14:03", eps: 24 }, { t: "14:04", eps: 20 }, { t: "14:05", eps: 28 }
  ]);
  const [eventsProcessed, setEvProc]= useState(14850);

  useEffect(() => {
    // Parallel fast fetch
    Promise.allSettled([
      api.health(),
      api.alerts({ limit: "10" }),
    ]).then(([hRes, aRes]) => {
      if (hRes.status === "fulfilled") {
        setHealth(hRes.value);
        if (hRes.value.events_processed) setEvProc(hRes.value.events_processed);
      }
      if (aRes.status === "fulfilled") {
        setRecent(aRes.value.alerts?.slice(0, 8) ?? []);
      }
    });
  }, []);

  useEffect(() => {
    const u1 = subscribe("system_health", (msg: any) => {
      setHealth(msg);
      setEvProc(msg.events_processed ?? 0);
      const t = new Date().toLocaleTimeString();
      setEpsData((p) => [...p.slice(-59), { t, eps: msg.events_per_second ?? 0 }]);
    });
    const u2 = subscribe("new_alert", (msg: any) => {
      setRecent((p) => [msg, ...p].slice(0, 8));
    });
    return () => { u1(); u2(); };
  }, [subscribe]);

  const uptime = health.uptime_seconds
    ? `${Math.floor(health.uptime_seconds / 3600)}h ${Math.floor((health.uptime_seconds % 3600) / 60)}m`
    : "1h 0m";

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">System Overview</h1>

      {/* KPIs with Smooth Floating & Hover Animation */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Uptime" value={uptime} color="green" icon={<Activity size={16} />} />
        <StatCard title="Events Processed" value={eventsProcessed.toLocaleString()} color="accent" live icon={<Zap size={16} />} />
        <StatCard title="Active Detectors" value={health.active_detectors ?? 6} color="purple" icon={<Shield size={16} />} />
        <StatCard title="Chain Length" value={health.chain_length ?? 0} color="amber" icon={<Link size={16} />} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Pipeline Visual Card */}
        <motion.div
          whileHover={{ y: -4, scale: 1.005, boxShadow: "0 10px 25px rgba(0, 240, 255, 0.1)" }}
          transition={{ duration: 0.2 }}
          className="glass rounded-xl p-5 border border-cyber-border/80 shadow-lg"
        >
          <h2 className="text-sm font-mono font-semibold text-cyber-text mb-4">6-Stage Detection Pipeline</h2>
          <div className="flex flex-col gap-1.5">
            {PIPELINE_STAGES.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 6, backgroundColor: "rgba(0, 240, 255, 0.08)" }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-cyber-surface/50 border border-transparent hover:border-cyber-accent/30 cursor-pointer transition-all"
              >
                <span className="font-mono text-xs font-bold text-cyber-muted w-4">0{i + 1}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${s.dotBg} ${s.glow} shrink-0`} />
                <div>
                  <p className={`text-xs font-mono font-semibold ${s.color}`}>{s.label}</p>
                  <p className="text-[10px] text-cyber-muted">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* EPS Chart Card */}
        <motion.div
          whileHover={{ y: -4, scale: 1.005, boxShadow: "0 10px 25px rgba(0, 240, 255, 0.1)" }}
          transition={{ duration: 0.2 }}
          className="glass rounded-xl p-5 border border-cyber-border/80 shadow-lg"
        >
          <h2 className="text-sm font-mono font-semibold text-cyber-text mb-4">Events Per Second (Real-Time)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={epsData}>
              <defs>
                <linearGradient id="epsG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
              <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 8 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
              <Area type="monotone" dataKey="eps" stroke="#00d4ff" fill="url(#epsG)" strokeWidth={2} isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Alerts Table Card */}
      <motion.div
        whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0, 240, 255, 0.08)" }}
        transition={{ duration: 0.2 }}
        className="glass rounded-xl p-5 border border-cyber-border/80 shadow-lg"
      >
        <h2 className="text-sm font-mono font-semibold text-cyber-text mb-4">Recent Alerts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-cyber-muted border-b border-cyber-border">
                {["Time", "Severity", "Type", "Source IP", "Confidence", "Title"].map((h) => (
                  <th key={h} className="text-left pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAlerts.map((b: any, i) => {
                const a = b.alert ?? b;
                return (
                  <motion.tr key={a.id ?? i}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    whileHover={{ backgroundColor: "rgba(0, 240, 255, 0.06)" }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-cyber-border/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 pr-4 text-cyber-muted">{new Date((a.ts ?? 0) * 1000).toLocaleTimeString()}</td>
                    <td className="py-2.5 pr-4"><AlertBadge severity={a.severity} /></td>
                    <td className="py-2.5 pr-4"><ThreatTypeBadge type={a.threat_type} /></td>
                    <td className="py-2.5 pr-4 text-cyber-accent font-semibold">{a.src_ip}</td>
                    <td className="py-2.5 pr-4 text-cyber-text">{((a.confidence ?? 0) * 100).toFixed(0)}%</td>
                    <td className="py-2.5 text-cyber-text truncate max-w-xs">{a.title}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {recentAlerts.length === 0 && (
            <p className="text-cyber-muted text-xs text-center py-8 font-mono">Awaiting live alerts stream…</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
