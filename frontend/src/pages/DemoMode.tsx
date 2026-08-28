import { useState } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { api } from "../lib/api";

const ATTACKS = [
  { type: "ddos",              label: "DDoS SYN Flood",       color: "#ff3366", icon: "💥" },
  { type: "c2_beacon",         label: "C2 Beaconing",         color: "#7c3aed", icon: "📡" },
  { type: "dns_tunnel",        label: "DNS Tunnelling",        color: "#ffaa00", icon: "🔗" },
  { type: "encrypted_malware", label: "Encrypted Malware",    color: "#00d4ff", icon: "🔐" },
  { type: "port_scan",         label: "Port Scan",            color: "#00ff88", icon: "🔍" },
  { type: "data_exfil",        label: "Data Exfiltration",    color: "#ff6b35", icon: "📤" },
];

const STEPS = [
  "Normal baseline traffic is continuously generated (Zeek conn.log style).",
  "DDoS: a burst of SYN packets floods a single target from varied spoofed IPs.",
  "C2 Beacon: a host makes periodic low-volume connections at regular intervals (+jitter).",
  "DNS Tunnel: long high-entropy subdomains are queried, encoding fake exfiltrated data.",
  "Encrypted Malware: TLS sessions with self-signed cert + anomalous JA3 fingerprint.",
  "Port Scan: one host probes sequential ports with minimal payload.",
  "Exfiltration: massive outbound byte spike from one device far above its baseline.",
  "Evidence chain built: SHA-256 hash-linked, Ed25519-signed, persisted to SQLite.",
];

export default function DemoMode() {
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog]         = useState<string[]>([]);
  const [step, setStep]       = useState(0);

  const trigger = async (type: string, label: string) => {
    setLoading(type);
    setLog((p) => [`[${new Date().toLocaleTimeString()}] Triggered: ${label}`, ...p]);
    try {
      await api.demoGenerate(type);
      setLog((p) => [`[${new Date().toLocaleTimeString()}] ✓ Events queued for ${label}`, ...p]);
    } catch (e: any) {
      setLog((p) => [`[${new Date().toLocaleTimeString()}] ✗ Error: ${e.message}`, ...p]);
    }
    setLoading(null);
  };

  const runAll = async () => {
    setLoading("all");
    setLog((p) => [`[${new Date().toLocaleTimeString()}] Running all 6 attack types…`, ...p]);
    try {
      await api.demoRunAll();
      setLog((p) => [`[${new Date().toLocaleTimeString()}] ✓ All attacks queued`, ...p]);
    } catch (e: any) {
      setLog((p) => [`[${new Date().toLocaleTimeString()}] ✗ Error: ${e.message}`, ...p]);
    }
    setLoading(null);
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-2">Demo Mode</h1>
      <p className="text-cyber-muted text-sm font-mono mb-6">Trigger synthetic attacks and walk through the PCAP narration</p>

      {/* Attack buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        {ATTACKS.map(({ type, label, color, icon }) => (
          <motion.button key={type} whileTap={{ scale: 0.92 }} onClick={() => trigger(type, label)}
            disabled={loading !== null}
            className="glass rounded-xl p-4 border text-left transition-all hover:scale-[1.02]"
            style={{ borderColor: color + "44" }}>
            <div className="text-2xl mb-2">{icon}</div>
            <p className="font-mono font-bold text-sm" style={{ color }}>{label}</p>
            <p className="text-cyber-muted text-[10px] font-mono mt-1">
              {loading === type ? "Generating…" : "Click to trigger"}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Run all */}
      <motion.button whileTap={{ scale: 0.94 }} onClick={runAll} disabled={loading !== null}
        className="w-full glass rounded-xl p-4 border border-cyber-accent/40 text-cyber-accent font-mono font-bold hover:bg-cyber-accent/10 transition-colors mb-6">
        {loading === "all" ? "⏳ Running All Attacks…" : "⚡ Run All Attacks"}
      </motion.button>

      {/* Narrated walkthrough */}
      <div className="glass rounded-xl p-5 border border-cyber-border mb-5">
        <h2 className="text-sm font-mono font-semibold text-cyber-text mb-4">Narrated PCAP Walkthrough</h2>
        <div className="flex flex-col gap-2">
          {STEPS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              onClick={() => setStep(i)}
              className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${step === i ? "bg-cyber-accent/10 border border-cyber-accent/30" : "hover:bg-cyber-surface/50"}`}>
              <span className={`font-mono text-xs w-5 flex-shrink-0 ${step === i ? "text-cyber-accent" : "text-cyber-muted"}`}>{i + 1}.</span>
              <p className={`text-xs ${step === i ? "text-cyber-text" : "text-cyber-muted"}`}>{s}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="glass rounded-xl p-5 border border-cyber-border">
        <h2 className="text-sm font-mono font-semibold text-cyber-text mb-3">Event Log</h2>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {log.map((l, i) => (
            <p key={i} className={`text-xs font-mono ${l.includes("✓") ? "text-cyber-green" : l.includes("✗") ? "text-cyber-red" : "text-cyber-muted"}`}>{l}</p>
          ))}
          {log.length === 0 && <p className="text-cyber-muted text-xs font-mono">No actions yet…</p>}
        </div>
      </div>
    </motion.div>
  );
}
