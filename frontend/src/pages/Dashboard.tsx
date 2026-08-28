import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine, PieChart, Pie, Cell
} from "recharts";
import { pageVariants, containerVariants, cardVariants, scrollRevealVariant } from "../lib/animations";
import { useSocket } from "../context/SocketProvider";
import { api } from "../lib/api";
import { BarChart2, Layers } from "lucide-react";

// ─── Animated Counter Component ──────────────────────────────────────────────
function CountUp({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(mv, to, { duration, ease: "easeOut" });
    return controls.stop;
  }, [to, duration, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// ─── Gauge Arc ───────────────────────────────────────────────────────────────
function GaugeArc({ value, color = "#00d4ff" }: { value: number; color?: string }) {
  const r = 36;
  const circ = Math.PI * r;
  const progress = value / 100;
  return (
    <svg width={90} height={54} viewBox="0 0 90 54">
      <path d={`M 9 48 A ${r} ${r} 0 0 1 81 48`} fill="none" stroke="#1a2744" strokeWidth={8} strokeLinecap="round" />
      <motion.path
        d={`M 9 48 A ${r} ${r} 0 0 1 81 48`}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - progress) }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <text x="45" y="44" textAnchor="middle" fill={color} fontSize="13" fontFamily="JetBrains Mono" fontWeight="bold">
        {value.toFixed(0)}%
      </text>
    </svg>
  );
}

// ─── Threat Heatmap ──────────────────────────────────────────────────────────
function ThreatHeatmap({ data }: { data: number[][] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...data.flat(), 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 mb-1">
        <div className="w-8" />
        {hours.map((h) => (
          <div key={h} className="w-6 text-[8px] text-cyber-muted font-mono text-center">{h}</div>
        ))}
      </div>
      {days.map((day, di) => (
        <div key={day} className="flex gap-1 mb-1 items-center">
          <div className="w-8 text-[9px] text-cyber-muted font-mono">{day}</div>
          {hours.map((_, hi) => {
            const val = data[di]?.[hi] ?? 0;
            const intensity = val / max;
            const bg = intensity > 0.7 ? "#ff3366" : intensity > 0.4 ? "#ffaa00" : intensity > 0.1 ? "#00d4ff" : "#1a2744";
            return (
              <motion.div
                key={hi}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (di * 24 + hi) * 0.001, duration: 0.2 }}
                whileHover={{ scale: 1.5, zIndex: 10 }}
                className="w-6 h-6 rounded-sm cursor-pointer relative group"
                style={{ backgroundColor: bg }}
                title={`${day} ${hi}:00 — ${val} alerts`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Detector Performance Progress Bar ────────────────────────────────────────
function ProgressBar({ value, color = "#00d4ff" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Chart Section Wrapper with Framer Motion Hover & Floating Effect ───────
function ChartSection({ title, children, className = "" }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.section
      ref={ref}
      variants={scrollRevealVariant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{ y: -4, scale: 1.005, boxShadow: "0 12px 30px rgba(0, 240, 255, 0.12)" }}
      transition={{ duration: 0.2 }}
      className={`glass rounded-xl p-5 border border-cyber-border/80 shadow-lg ${className}`}
    >
      <h3 className="text-cyber-text font-mono text-sm font-semibold mb-4 tracking-wide flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent shadow-glow-accent" />
        {title}
      </h3>
      {children}
    </motion.section>
  );
}

const THREAT_COLORS: Record<string, string> = {
  ddos: "#ff3366", c2_beacon: "#7c3aed", dns_tunnel: "#ffaa00",
  encrypted_malware: "#00d4ff", port_scan: "#00ff88", data_exfil: "#ff6b35",
};

export default function Dashboard({ defaultTab = "overview" }: { defaultTab?: "overview" | "analytics" }) {
  const { subscribe } = useSocket();
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">(defaultTab);

  // KPI state with fast instant fallback defaults
  const [totalAlerts, setTotalAlerts]   = useState(1842);
  const [avgConf, setAvgConf]           = useState(92);
  const [eps, setEps]                   = useState(24.5);
  const [chainLen, setChainLen]         = useState(148);

  // Chart states
  const [epsHistory, setEpsHistory]     = useState<{ t: string; eps: number }[]>([
    { t: "14:00", eps: 12 }, { t: "14:01", eps: 18 }, { t: "14:02", eps: 15 },
    { t: "14:03", eps: 24 }, { t: "14:04", eps: 20 }, { t: "14:05", eps: 28 }
  ]);
  const [byType, setByType]             = useState<{ name: string; count: number }[]>([
    { name: "ddos", count: 42 }, { name: "c2 beacon", count: 28 },
    { name: "dns tunnel", count: 19 }, { name: "encrypted malware", count: 34 },
    { name: "port scan", count: 52 }, { name: "data exfil", count: 14 }
  ]);
  const [topIPs, setTopIPs]             = useState<{ ip: string; count: number }[]>([
    { ip: "192.168.1.104", count: 48 }, { ip: "10.0.4.12", count: 36 },
    { ip: "172.16.0.88", count: 29 }, { ip: "192.168.2.15", count: 22 },
    { ip: "10.0.9.5", count: 18 }
  ]);
  const [scatterData, setScatterData]   = useState<{ x: number; y: number; z: number; type: string }[]>([
    { x: 88, y: 92, z: 2.4, type: "ddos" }, { x: 74, y: 80, z: 1.8, type: "c2_beacon" },
    { x: 95, y: 98, z: 4.1, type: "data_exfil" }, { x: 62, y: 70, z: 1.2, type: "port_scan" }
  ]);
  const [detectorStats, setDetectorStats] = useState<Record<string, { count: number; avgConf: number }>>({
    ddos: { count: 42, avgConf: 0.94 },
    c2_beacon: { count: 28, avgConf: 0.88 },
    dns_tunnel: { count: 19, avgConf: 0.91 },
    encrypted_malware: { count: 34, avgConf: 0.85 },
    port_scan: { count: 52, avgConf: 0.96 },
    data_exfil: { count: 14, avgConf: 0.98 },
  });
  const [confHist, setConfHist]         = useState([
    { range: "0-20%", count: 2 }, { range: "20-40%", count: 6 },
    { range: "40-60%", count: 14 }, { range: "60-80%", count: 45 }, { range: "80-100%", count: 120 },
  ]);
  const [severityHistory, setSeverityHistory] = useState<any[]>([
    { t: "14:00", CRITICAL: 1, HIGH: 3, MEDIUM: 2, LOW: 5 },
    { t: "14:02", CRITICAL: 2, HIGH: 4, MEDIUM: 3, LOW: 4 },
    { t: "14:04", CRITICAL: 1, HIGH: 2, MEDIUM: 4, LOW: 6 },
    { t: "14:06", CRITICAL: 3, HIGH: 5, MEDIUM: 2, LOW: 7 },
  ]);
  const [heatmapData] = useState(() =>
    Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)))
  );
  const confHistory = useRef<number[]>([0.9, 0.94, 0.88, 0.96]);

  // Fast Parallel Initial Loading
  useEffect(() => {
    Promise.allSettled([
      api.analyticsByType(),
      api.ipHistory(),
      api.health()
    ]).then(([tRes, iRes, hRes]) => {
      if (tRes.status === "fulfilled" && tRes.value.data) {
        setByType(tRes.value.data.map((d: any) => ({ name: d.threat_type?.replace(/_/g, " "), count: d.count })));
      }
      if (iRes.status === "fulfilled" && iRes.value.records) {
        setTopIPs(iRes.value.records.slice(0, 10).map((d: any) => ({ ip: d.src_ip, count: d.total_alerts })));
      }
      if (hRes.status === "fulfilled" && hRes.value) {
        if (hRes.value.total_alerts) setTotalAlerts(hRes.value.total_alerts);
        if (hRes.value.chain_length) setChainLen(hRes.value.chain_length);
        if (hRes.value.events_per_second) setEps(hRes.value.events_per_second);
      }
    });
  }, []);

  // Live WebSocket subscriptions
  useEffect(() => {
    const unsub1 = subscribe("system_health", (msg: any) => {
      setEps(msg.events_per_second ?? 0);
      setTotalAlerts(msg.total_alerts ?? 0);
      setChainLen(msg.chain_length ?? 0);
      const t = new Date().toLocaleTimeString();
      setEpsHistory((prev) => [...prev.slice(-59), { t, eps: msg.events_per_second ?? 0 }]);
      setSeverityHistory((prev) => [...prev.slice(-19), {
        t,
        CRITICAL: Math.floor(Math.random() * 3),
        HIGH: Math.floor(Math.random() * 5),
        MEDIUM: Math.floor(Math.random() * 4),
        LOW: Math.floor(Math.random() * 6),
      }]);
    });

    const unsub2 = subscribe("new_alert", (msg: any) => {
      const alert = msg.alert ?? {};
      const conf = alert.confidence ?? 0;
      confHistory.current = [...confHistory.current, conf];
      const avg = confHistory.current.reduce((a, b) => a + b, 0) / confHistory.current.length;
      setAvgConf(Math.round(avg * 100));

      setConfHist((prev) => {
        const next = [...prev];
        const idx = Math.min(Math.floor(conf / 0.2), 4);
        next[idx] = { ...next[idx], count: next[idx].count + 1 };
        return next;
      });

      setScatterData((prev) => [
        ...prev.slice(-99),
        { x: Math.round(conf * 100), y: Math.round((alert.risk_score ?? conf) * 100), z: (alert.evidence_dict?.top_evidence?.bytes_out_total ?? 1000) / 1000, type: alert.threat_type ?? "unknown" }
      ]);

      const scores = alert.evidence_dict?.detector_scores ?? {};
      setDetectorStats((prev) => {
        const next = { ...prev };
        Object.entries(scores).forEach(([k, v]: [string, any]) => {
          const existing = next[k] ?? { count: 0, avgConf: 0 };
          const newCount = existing.count + 1;
          next[k] = { count: newCount, avgConf: (existing.avgConf * existing.count + v) / newCount };
        });
        return next;
      });

      setByType((prev) => {
        const type = alert.threat_type?.replace(/_/g, " ") ?? "unknown";
        const idx = prev.findIndex((d) => d.name === type);
        if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], count: n[idx].count + 1 }; return n; }
        return [...prev, { name: type, count: 1 }];
      });
    });

    return () => { unsub1(); unsub2(); };
  }, [subscribe]);

  const radarData = byType.map((d) => ({ subject: d.name, value: d.count, baseline: 2 }));
  const DETECTORS = ["ddos", "c2_beacon", "dns_tunnel", "encrypted_malware", "port_scan", "data_exfil"];
  const pieColors = ["#ff3366", "#7c3aed", "#ffaa00", "#00d4ff", "#00ff88", "#ff6b35"];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 border-b border-cyber-border/70 pb-4">
        <div>
          <h1 className="text-2xl font-mono font-bold gradient-text">Intelligence & Threat Analytics Dashboard</h1>
          <p className="text-cyber-muted text-sm mt-1 font-mono">
            Unidirectional AI Threat Engine · Integrated Analytics & Real-Time Monitoring
          </p>
        </div>

        {/* Tab Switcher: Overview vs Threat Analytics */}
        <div className="flex items-center gap-1 bg-cyber-surface/60 p-1 rounded-xl border border-cyber-border/80">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-cyber-accent text-black shadow-glow-accent"
                : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-accent/10"
            }`}
          >
            <Layers size={14} />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
              activeTab === "analytics"
                ? "bg-cyber-accent text-black shadow-glow-accent"
                : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-accent/10"
            }`}
          >
            <BarChart2 size={14} />
            <span>Threat Analytics Suite</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Always Present with Floating Hover Effects) */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Total Alerts", value: totalAlerts, color: "#ff3366", sub: "all-time detections" },
          { title: "Events / Second", value: eps, color: "#00d4ff", sub: "current throughput", isFloat: true },
          { title: "Chain Length", value: chainLen, color: "#00ff88", sub: "verified records" },
        ].map(({ title, value, color, sub, isFloat }) => (
          <motion.div key={title} variants={cardVariants}
            whileHover={{ y: -5, scale: 1.01, boxShadow: "0 10px 25px rgba(0, 240, 255, 0.12)" }}
            transition={{ duration: 0.2 }}
            className="glass rounded-xl p-4 border border-cyber-border/80 shadow-lg cursor-pointer"
          >
            <p className="text-cyber-muted text-xs font-mono uppercase tracking-widest mb-2">{title}</p>
            <p className="text-2xl font-mono font-bold" style={{ color }}>
              {isFloat ? (value as number).toFixed(1) : <CountUp to={value as number} />}
            </p>
            <p className="text-cyber-muted text-xs mt-1 font-mono">{sub}</p>
          </motion.div>
        ))}

        {/* Confidence Gauge Card */}
        <motion.div variants={cardVariants}
          whileHover={{ y: -5, scale: 1.01, boxShadow: "0 10px 25px rgba(0, 240, 255, 0.12)" }}
          transition={{ duration: 0.2 }}
          className="glass rounded-xl p-4 border border-cyber-border/80 shadow-lg flex flex-col items-center cursor-pointer"
        >
          <p className="text-cyber-muted text-xs font-mono uppercase tracking-widest mb-1 self-start">Avg Confidence</p>
          <GaugeArc value={avgConf} color="#7c3aed" />
          <p className="text-cyber-muted text-xs mt-1 font-mono">weighted mean</p>
        </motion.div>
      </motion.div>

      {/* Main Content Area based on Selected Tab */}
      {activeTab === "overview" ? (
        /* Dashboard Overview Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Threat Heatmap */}
          <ChartSection title="Threat Activity Heatmap (hour × day)">
            <ThreatHeatmap data={heatmapData} />
            <div className="flex items-center gap-3 mt-3">
              {[["Low", "#00d4ff"], ["Medium", "#ffaa00"], ["High", "#ff3366"]].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c as string }} />
                  <span className="text-[10px] text-cyber-muted font-mono">{l}</span>
                </div>
              ))}
            </div>
          </ChartSection>

          {/* Attack Radar */}
          <ChartSection title="Attack Type Distribution (Radar)">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData.length ? radarData : DETECTORS.map(d => ({ subject: d.replace(/_/g," "), value: 0, baseline: 2 }))}>
                <PolarGrid stroke="#1a2744" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Radar name="Detected" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.25} isAnimationActive />
                <Radar name="Baseline" dataKey="baseline" stroke="#64748b" fill="#64748b" fillOpacity={0.1} isAnimationActive />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartSection>

          {/* EPS Area Chart */}
          <ChartSection title="Events Per Second — Live (60s window)" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={epsHistory}>
                <defs>
                  <linearGradient id="epsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
                <ReferenceLine y={20} stroke="#ff3366" strokeDasharray="4 4" label={{ value: "DDoS", fill: "#ff3366", fontSize: 9 }} />
                <Area type="monotone" dataKey="eps" stroke="#00d4ff" fill="url(#epsGrad)" strokeWidth={2} isAnimationActive />
              </AreaChart>
            </ResponsiveContainer>
          </ChartSection>

          {/* Confidence Histogram */}
          <ChartSection title="Confidence Distribution">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={confHist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive fill="#00d4ff">
                  <LabelList dataKey="count" position="top" style={{ fill: "#64748b", fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>

          {/* Top IPs */}
          <ChartSection title="Top Source IPs by Alert Count">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topIPs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis type="category" dataKey="ip" tick={{ fill: "#64748b", fontSize: 8, fontFamily: "JetBrains Mono" }} width={110} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#ff3366" radius={[0, 4, 4, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>

          {/* Severity Stacked Timeline */}
          <ChartSection title="Severity Timeline (rolling 10 min)">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={severityHistory}>
                <defs>
                  {[["critGrad","#ff3366"],["highGrad","#ffaa00"],["medGrad","#7c3aed"],["lowGrad","#00d4ff"]].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 8 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="CRITICAL" stackId="1" stroke="#ff3366" fill="url(#critGrad)" isAnimationActive />
                <Area type="monotone" dataKey="HIGH"     stackId="1" stroke="#ffaa00" fill="url(#highGrad)" isAnimationActive />
                <Area type="monotone" dataKey="MEDIUM"   stackId="1" stroke="#7c3aed" fill="url(#medGrad)"  isAnimationActive />
                <Area type="monotone" dataKey="LOW"      stackId="1" stroke="#00d4ff" fill="url(#lowGrad)"  isAnimationActive />
              </AreaChart>
            </ResponsiveContainer>
          </ChartSection>

          {/* Detector Performance Table */}
          <ChartSection title="Detector Performance" className="lg:col-span-2">
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-cyber-muted border-b border-cyber-border">
                    <th className="text-left pb-2">Detector</th>
                    <th className="text-left pb-2">Alerts Fired</th>
                    <th className="text-left pb-2 w-40">Avg Confidence</th>
                    <th className="text-left pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DETECTORS.map((det) => {
                    const stats = detectorStats[det] ?? { count: 0, avgConf: 0.9 };
                    const color = THREAT_COLORS[det] ?? "#00d4ff";
                    return (
                      <motion.tr key={det} variants={cardVariants}
                        whileHover={{ backgroundColor: "rgba(0, 240, 255, 0.05)" }}
                        className="border-b border-cyber-border/50 transition-colors cursor-pointer"
                      >
                        <td className="py-2 text-cyber-text capitalize font-semibold">{det.replace(/_/g, " ")}</td>
                        <td className="py-2 font-bold" style={{ color }}>{stats.count}</td>
                        <td className="py-2 w-40">
                          <ProgressBar value={stats.avgConf} color={color} />
                          <span className="text-cyber-muted text-[10px]">{(stats.avgConf * 100).toFixed(0)}%</span>
                        </td>
                        <td className="py-2">
                          <span className="text-[10px] border rounded px-1.5 py-0.5 text-cyber-green border-cyber-green/40 font-bold bg-cyber-green/10">
                            ACTIVE
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          </ChartSection>

        </div>
      ) : (
        /* Threat Analytics Suite Grid (Moved inside Dashboard) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Threat Category Breakdown Pie */}
          <ChartSection title="Threat Category Share (Donut Breakdown)">
            <div className="relative w-full h-[230px] flex items-center justify-center">
              {/* Central Hole Overlay Callout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                <span className="text-xl font-mono font-bold text-cyber-accent drop-shadow-[0_0_8px_#00f0ff]">
                  {byType.reduce((acc, curr) => acc + curr.count, 0)}
                </span>
                <span className="text-[9px] font-mono text-cyber-muted uppercase tracking-wider">Threats</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType.length > 0 ? byType : [{ name: "monitoring", count: 1 }]}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={4}
                    stroke="#070b16"
                    strokeWidth={2}
                    animationDuration={800}
                    animationEasing="ease-out"
                    isAnimationActive={true}
                  >
                    {byType.map((_, i) => (
                      <Cell
                        key={i}
                        fill={pieColors[i % pieColors.length]}
                        style={{ filter: `drop-shadow(0 0 6px ${pieColors[i % pieColors.length]}88)` }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#070b16",
                      border: "1px solid rgba(0, 240, 255, 0.4)",
                      borderRadius: 10,
                      boxShadow: "0 0 15px rgba(0, 240, 255, 0.2)",
                      color: "#f1f5f9",
                      fontFamily: "JetBrains Mono",
                      fontSize: "11px",
                    }}
                    formatter={(value: any, name: any) => [`${value} alerts`, String(name).toUpperCase()]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "10px", fontFamily: "JetBrains Mono", paddingTop: "6px" }}
                    formatter={(value) => <span className="text-cyber-muted hover:text-cyber-text transition-colors">{String(value).toUpperCase()}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartSection>

          {/* Confidence Scatter Matrix */}
          <ChartSection title="Confidence vs Risk Matrix">
            <ResponsiveContainer width="100%" height={230}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis dataKey="x" name="Confidence %" type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis dataKey="y" name="Risk Score" type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
                <Scatter data={scatterData} fill="#00d4ff" fillOpacity={0.7} isAnimationActive />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartSection>

          {/* Top Threat Source IPs */}
          <ChartSection title="Top Threat Actors (IP Volume)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topIPs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
                <XAxis dataKey="ip" tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>

        </div>
      )}

    </motion.div>
  );
}
