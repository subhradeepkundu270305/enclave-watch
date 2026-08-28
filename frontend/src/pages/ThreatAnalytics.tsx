import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { pageVariants, scrollRevealVariant } from "../lib/animations";
import { api } from "../lib/api";

const TYPE_COLORS = ["#ff3366","#7c3aed","#ffaa00","#00d4ff","#00ff88","#ff6b35"];
const SEV_COLORS  = { CRITICAL:"#ff3366", HIGH:"#ffaa00", MEDIUM:"#7c3aed", LOW:"#00d4ff" };

function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={scrollRevealVariant} initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="glass rounded-xl p-5 border border-cyber-border">
      <h2 className="text-sm font-mono font-semibold text-cyber-text mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}

export default function ThreatAnalytics() {
  const [byType, setByType]       = useState<any[]>([]);
  const [bySeverity, setBySeverity] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    Promise.all([api.analyticsByType(), api.analyticsBySeverity()])
      .then(([t, s]) => {
        setByType(t.data ?? []);
        setBySeverity(s.data ?? []);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full" />
    </div>
  );

  if (error) return <div className="p-6 text-cyber-red font-mono">Error: {error}</div>;

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">Threat Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartBlock title="Alerts by Threat Type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
              <XAxis dataKey="threat_type" tick={{ fill: "#64748b", fontSize: 9 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
              <Bar dataKey="count" radius={[4,4,0,0]} isAnimationActive>
                {byType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>

        <ChartBlock title="Alerts by Severity">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bySeverity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
              <XAxis dataKey="severity" tick={{ fill: "#64748b", fontSize: 9 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1a2744", borderRadius: 8 }} />
              <Bar dataKey="count" radius={[4,4,0,0]} isAnimationActive>
                {bySeverity.map((d: any, i) => (
                  <Cell key={i} fill={(SEV_COLORS as any)[d.severity] ?? "#64748b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      </div>
    </motion.div>
  );
}
