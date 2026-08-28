import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { api } from "../lib/api";
import { Globe, ShieldAlert, Cpu, LayoutDashboard, Lock, Zap, ShieldCheck } from "lucide-react";

interface NodeData {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  x: number;
  y: number;
  color: string;
  icon: any;
  status: string;
}

export default function Network() {
  const [health, setHealth] = useState<any>({});
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => {});
  }, []);

  const nodes: NodeData[] = [
    {
      id: "internet",
      title: "Internet / External Net",
      subtitle: "Mirrored TAP/SPAN Feed",
      role: "Passive IP packet source. Raw un-filtered network stream.",
      x: 400,
      y: 70,
      color: "#64748b",
      icon: Globe,
      status: "PASSIVE FEED",
    },
    {
      id: "diode",
      title: "Hardware Data Diode",
      subtitle: "Physical Unidirectional Valve",
      role: "Fiber optic TX-only hardware diode. Physically blocks reverse photon transmission.",
      x: 400,
      y: 230,
      color: "#ffaa00",
      icon: Lock,
      status: "EGRESS BLOCKED",
    },
    {
      id: "enclave",
      title: "Monitoring Enclave",
      subtitle: "Air-Gapped Processing Node",
      role: "Isolated enclave host running Zeek parser & FIFO streaming queue.",
      x: 400,
      y: 390,
      color: "#00d4ff",
      icon: ShieldAlert,
      status: "AIR-GAPPED",
    },
    {
      id: "detector",
      title: "AI Detection Engine",
      subtitle: "6 Parallel ML Pipelines",
      role: "Statistical EWMA, FFT, Entropy, Mahalanobis & CUSUM threat detectors.",
      x: 210,
      y: 540,
      color: "#a855f7",
      icon: Cpu,
      status: "6 ENGINES ACTIVE",
    },
    {
      id: "dashboard",
      title: "Cyber-Dark UI",
      subtitle: "Local React Dashboard",
      role: "Real-time WebSocket event broadcaster and cryptographic evidence viewer.",
      x: 590,
      y: 540,
      color: "#00ff88",
      icon: LayoutDashboard,
      status: "WEBSOCKET STREAM",
    },
  ];

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-mono font-bold gradient-text">Network Topology & Data Flow</h1>
        <p className="text-cyber-muted text-sm font-mono mt-1">
          Strictly Unidirectional IP Architecture · Hardware Data Diode Isolation · SIH 2026
        </p>
      </div>

      {/* Main Topology Card */}
      <div className="glass rounded-2xl p-6 border border-cyber-border/80 shadow-glow-accent relative overflow-hidden mb-6">
        {/* Background Grid CSS overlay */}
        <div className="absolute inset-0 cyber-grid-bg opacity-75 pointer-events-none" />

        {/* SVG Canvas (620px height) */}
        <div className="relative w-full max-w-4xl mx-auto" style={{ height: 620 }}>
          <svg viewBox="0 0 800 620" className="w-full h-full overflow-visible">
            <defs>
              {/* Tactical Cyber Grid Pattern */}
              <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="1" />
                <path d="M 40 0 L 40 40 L 0 40" fill="none" stroke="rgba(0, 240, 255, 0.04)" strokeWidth="0.5" />
                <circle cx="40" cy="40" r="1" fill="rgba(0, 240, 255, 0.3)" />
              </pattern>

              {/* Central Neon Ambient Glow */}
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.12" />
                <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#030509" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* LAYER 0: Grid Background & Ambient Center Glow */}
            <rect width="800" height="620" fill="url(#tacticalGrid)" rx="16" />
            <circle cx="400" cy="310" r="300" fill="url(#centerGlow)" />

            {/* Tactical Corner HUD Brackets */}
            <g stroke="#00f0ff" strokeWidth="1.5" opacity="0.6">
              {/* Top Left */}
              <path d="M 20 40 L 20 20 L 40 20" fill="none" />
              {/* Top Right */}
              <path d="M 760 20 L 780 20 L 780 40" fill="none" />
              {/* Bottom Left */}
              <path d="M 20 580 L 20 600 L 40 600" fill="none" />
              {/* Bottom Right */}
              <path d="M 760 600 L 780 600 L 780 580" fill="none" />
            </g>

            {/* LAYER 1: Connection Lines (Cleanly broken at badge boundaries) */}
            
            {/* 1. Internet (y: 100) -> Inbound Mirror Badge (y: 137) */}
            <motion.path
              d="M 400 100 L 400 137"
              stroke="#475569"
              strokeWidth="3.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
            {/* 1. Inbound Mirror Badge (y: 163) -> Data Diode (y: 200) */}
            <motion.path
              d="M 400 163 L 400 200"
              stroke="#475569"
              strokeWidth="3.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />

            {/* 2. Data Diode (y: 260) -> Barrier Banner (y: 295) */}
            <motion.path
              d="M 400 260 L 400 295"
              stroke="#ffaa00"
              strokeWidth="3.5"
              strokeDasharray="6 4"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            />
            {/* 2. Barrier Banner (y: 325) -> Monitoring Enclave (y: 360) */}
            <motion.path
              d="M 400 325 L 400 360"
              stroke="#ffaa00"
              strokeWidth="3.5"
              strokeDasharray="6 4"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            />

            {/* 3. Monitoring Enclave (y: 420) -> AI Detection Engine (210, 510) */}
            <motion.path
              d="M 400 420 L 210 510"
              stroke="#00f0ff"
              strokeWidth="3.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            />

            {/* 4. Monitoring Enclave (y: 420) -> Cyber-Dark UI (590, 510) */}
            <motion.path
              d="M 400 420 L 590 510"
              stroke="#00f0ff"
              strokeWidth="3.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            />

            {/* LAYER 2: Badges & Physical Barrier Line */}
            
            {/* Inbound Mirror Badge */}
            <g transform="translate(400, 150)">
              <rect x="-70" y="-13" width="140" height="26" rx="7" fill="#060913" stroke="#475569" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                ▼ INBOUND MIRROR
              </text>
            </g>

            {/* Red Physical Barrier Line Banner */}
            <g transform="translate(400, 310)">
              <rect x="-270" y="-15" width="540" height="30" rx="8" fill="#0e040a" stroke="#ff0055" strokeWidth="1.5" strokeDasharray="6 3" />
              <text x="0" y="4" textAnchor="middle" fill="#ff0055" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                ⛔ PHYSICAL BARRIER — ZERO RETURN PATH / EGRESS BLOCKED
              </text>
            </g>

            {/* LAYER 3: Integrated Node Cards */}
            {nodes.map((node) => {
              const Icon = node.icon;
              const isHovered = hoveredNode === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer Card Frame */}
                  <rect
                    x="-110"
                    y="-30"
                    width="220"
                    height="60"
                    rx="14"
                    fill="#070b16"
                    stroke={isHovered ? node.color : node.color + "66"}
                    strokeWidth={isHovered ? "2" : "1"}
                    filter={isHovered ? `drop-shadow(0 0 12px ${node.color}66)` : undefined}
                    className="transition-all duration-200"
                  />

                  {/* Left Circle Icon */}
                  <circle
                    cx="-76"
                    cy="0"
                    r="18"
                    fill="#030509"
                    stroke={node.color}
                    strokeWidth="1.5"
                  />
                  <foreignObject x="-90" y="-14" width="28" height="28">
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon size={16} style={{ color: node.color }} />
                    </div>
                  </foreignObject>

                  {/* Right Text */}
                  <text
                    x="-46"
                    y="-6"
                    fill="#f1f5f9"
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    {node.title}
                  </text>
                  <text
                    x="-46"
                    y="10"
                    fill={node.color}
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                  >
                    {node.subtitle}
                  </text>
                </g>
              );
            })}

            {/* LAYER 4 (TOPMOST): Moving Glowing Balls */}
            
            {/* 1. Yellow Ball: Internet -> Diode */}
            <circle r="6" fill="#ffcc00" style={{ filter: "drop-shadow(0 0 10px #ffcc00) drop-shadow(0 0 20px #ffcc00)" }}>
              <animateMotion path="M 400 100 L 400 200" dur="1.6s" repeatCount="indefinite" />
            </circle>

            {/* 2. Blue Ball: Diode -> Enclave */}
            <circle r="6" fill="#00f0ff" style={{ filter: "drop-shadow(0 0 10px #00f0ff) drop-shadow(0 0 20px #00f0ff)" }}>
              <animateMotion path="M 400 260 L 400 360" dur="1.8s" repeatCount="indefinite" />
            </circle>

            {/* 3. Purple Ball: Enclave -> AI Detection */}
            <circle r="6" fill="#a855f7" style={{ filter: "drop-shadow(0 0 10px #a855f7) drop-shadow(0 0 20px #a855f7)" }}>
              <animateMotion path="M 400 420 L 210 510" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* 4. Green Ball: Enclave -> Dashboard UI */}
            <circle r="6" fill="#00ff88" style={{ filter: "drop-shadow(0 0 10px #00ff88) drop-shadow(0 0 20px #00ff88)" }}>
              <animateMotion path="M 400 420 L 590 510" dur="2s" repeatCount="indefinite" />
            </circle>

          </svg>
        </div>

        {/* Hover Information Banner */}
        <div className="mt-4 p-4 glass rounded-xl border border-cyber-border/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-cyber-accent uppercase tracking-wider">
              {hoveredNode
                ? nodes.find((n) => n.id === hoveredNode)?.title
                : "Unidirectional Passive Security Enforcement"}
            </h4>
            <p className="text-xs text-cyber-muted font-mono mt-0.5">
              {hoveredNode
                ? nodes.find((n) => n.id === hoveredNode)?.role
                : "Hover over any node above to inspect its security role, physical boundary enforcement, and traffic handling."}
            </p>
          </div>
        </div>
      </div>

      {/* Health & Egress Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Data Diode Status", value: "HARDWARE ENFORCED", color: "text-cyber-green", icon: ShieldCheck },
          { label: "Active WS Streams", value: health.ws_connections ?? 1, color: "text-cyber-accent", icon: Zap },
          { label: "Egress Policy", value: "BLOCK ALL (0 BYTES OUT)", color: "text-cyber-red", icon: Lock },
          { label: "Enclave Mode", value: "PASSIVE AIR-GAPPED", color: "text-cyber-amber", icon: ShieldAlert },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass rounded-xl p-4 border border-cyber-border flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyber-muted text-[10px] font-mono uppercase tracking-wider">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <p className={`text-xs font-mono font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
