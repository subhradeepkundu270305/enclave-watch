import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, alertRowVariant } from "../lib/animations";
import { api } from "../lib/api";
import { AlertBadge, ThreatTypeBadge } from "../components/AlertBadge";

const IOC_TYPES = ["IP Address", "Domain", "JA3 Hash", "Alert Title"];

export default function RetroHunt() {
  const [iocType, setIocType] = useState("IP Address");
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const hunt = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Search over recent alerts
      const r = await api.alerts({ limit: "200" });
      const bundles: any[] = r.alerts ?? [];
      const q = query.toLowerCase();
      const matched = bundles
        .map((b: any) => b.alert ?? b)
        .filter((a: any) => {
          if (iocType === "IP Address")   return a.src_ip?.includes(q) || a.dst_ip?.includes(q);
          if (iocType === "Alert Title")  return a.title?.toLowerCase().includes(q);
          if (iocType === "Domain")       return a.evidence_dict?.top_evidence?.dns_query?.includes(q);
          if (iocType === "JA3 Hash")     return JSON.stringify(a).toLowerCase().includes(q);
          return false;
        });
      setResults(matched);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-2">Retro-Hunt</h1>
      <p className="text-cyber-muted text-sm font-mono mb-6">Search historical alerts and events by IOC</p>

      <div className="glass rounded-xl p-5 border border-cyber-border mb-5">
        <div className="flex gap-2 mb-4">
          {IOC_TYPES.map((t) => (
            <button key={t} onClick={() => setIocType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors
                ${iocType === t ? "bg-cyber-accent/20 text-cyber-accent border-cyber-accent/50" : "border-cyber-border text-cyber-muted"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && hunt()}
            placeholder={`Search by ${iocType}…`}
            className="flex-1 bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-cyber-text font-mono text-sm focus:outline-none focus:border-cyber-accent" />
          <motion.button whileTap={{ scale: 0.94 }} onClick={hunt} disabled={loading}
            className="px-4 py-2 rounded-lg bg-cyber-accent/20 border border-cyber-accent/50 text-cyber-accent font-mono text-sm hover:bg-cyber-accent/30 transition-colors">
            {loading ? "Hunting…" : "Hunt"}
          </motion.button>
        </div>
      </div>

      {searched && (
        <div className="glass rounded-xl border border-cyber-border overflow-auto max-h-[60vh]">
          <div className="px-4 py-3 border-b border-cyber-border">
            <p className="text-cyber-muted text-xs font-mono">{results.length} match(es) for "{query}"</p>
          </div>
          <AnimatePresence>
            {results.map((a, i) => (
              <motion.div key={a.id ?? i} variants={alertRowVariant} initial="hidden" animate="visible"
                className="px-4 py-3 border-b border-cyber-border/40 hover:bg-cyber-surface/50 transition-colors">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <AlertBadge severity={a.severity} />
                  <ThreatTypeBadge type={a.threat_type} />
                  <span className="text-cyber-muted text-[10px] font-mono">
                    {new Date((a.ts ?? 0) * 1000).toLocaleString()}
                  </span>
                </div>
                <p className="text-cyber-text text-sm">{a.title}</p>
                <p className="text-cyber-accent text-xs font-mono mt-0.5">{a.src_ip}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {results.length === 0 && (
            <p className="text-center text-cyber-muted py-10 font-mono text-sm">No results found</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
