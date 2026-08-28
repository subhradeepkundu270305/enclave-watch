import { useEffect } from "react";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, cardVariants } from "../lib/animations";
import { api } from "../lib/api";

const DETECTOR_META = [
  { name: "ddos", algo: "EWMA + Adaptive σ Threshold", color: "#ff3366", desc: "Detects volumetric SYN flood attacks by comparing connection rate against an adaptive EWMA baseline." },
  { name: "c2_beacon", algo: "FFT Power Spectrum", color: "#7c3aed", desc: "Identifies C2 heartbeat beaconing by detecting dominant periodic frequencies in inter-arrival time data." },
  { name: "dns_tunnel", algo: "Shannon Entropy + N-gram", color: "#ffaa00", desc: "Detects DNS tunnelling through high-entropy subdomain strings and anomalous query frequency." },
  { name: "encrypted_malware", algo: "Mahalanobis Distance", color: "#00d4ff", desc: "Flags TLS sessions far from the baseline JA3 fingerprint distribution, weighted by self-signed cert presence." },
  { name: "port_scan", algo: "Unique Port Count + Rate", color: "#00ff88", desc: "Triggers when a source IP exceeds both unique destination port count and connection rate thresholds." },
  { name: "data_exfil", algo: "CUSUM + Welford Baseline", color: "#ff6b35", desc: "Detects sustained outbound byte spikes via CUSUM on standardised per-device byte deviations." },
];

export default function DetectionEngines() {
  useEffect(() => {
    api.detectors().catch(() => {});
  }, []);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">Detection Engines</h1>
      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DETECTOR_META.map((det) => (
          <motion.div key={det.name} variants={cardVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass rounded-xl p-5 border border-cyber-border relative overflow-hidden">
            {/* Colour strip */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: det.color }} />

            <div className="flex items-start justify-between mb-3">
              <h2 className="font-mono font-bold text-sm text-cyber-text capitalize">
                {det.name.replace(/_/g, " ")}
              </h2>
              <span className="text-[9px] font-mono border rounded px-1.5 py-0.5 text-cyber-green border-cyber-green/40">
                ACTIVE
              </span>
            </div>

            <p className="text-cyber-muted text-xs mb-3">{det.desc}</p>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono border rounded px-1.5 py-0.5"
                style={{ color: det.color, borderColor: det.color + "66" }}>
                {det.algo}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
