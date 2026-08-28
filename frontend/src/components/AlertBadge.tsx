type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;

const MAP: Record<string, string> = {
  CRITICAL: "bg-cyber-red/20 text-cyber-red border-cyber-red/40",
  HIGH:     "bg-cyber-amber/20 text-cyber-amber border-cyber-amber/40",
  MEDIUM:   "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40",
  LOW:      "bg-cyber-accent/10 text-cyber-accent border-cyber-accent/30",
};

export function AlertBadge({ severity }: { severity: Severity }) {
  const cls = MAP[severity] ?? MAP.LOW;
  return (
    <span className={`text-[10px] font-mono font-bold border rounded px-2 py-0.5 ${cls}`}>
      {severity}
    </span>
  );
}

const TYPE_COLORS: Record<string, string> = {
  ddos:              "bg-cyber-red/10 text-cyber-red border-cyber-red/30",
  c2_beacon:         "bg-cyber-purple/10 text-cyber-purple border-cyber-purple/30",
  dns_tunnel:        "bg-cyber-amber/10 text-cyber-amber border-cyber-amber/30",
  encrypted_malware: "bg-cyber-accent/10 text-cyber-accent border-cyber-accent/30",
  port_scan:         "bg-cyber-green/10 text-cyber-green border-cyber-green/30",
  data_exfil:        "bg-cyber-red/10 text-cyber-red border-cyber-red/30",
};

export function ThreatTypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? "bg-cyber-muted/10 text-cyber-muted border-cyber-muted/30";
  const label = type.replace(/_/g, " ").toUpperCase();
  return (
    <span className={`text-[10px] font-mono border rounded px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}
