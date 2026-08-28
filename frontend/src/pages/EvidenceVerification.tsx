import { useState } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { api } from "../lib/api";
import { CheckCircle, XCircle } from "lucide-react";

export default function EvidenceVerification() {
  const [alertId, setAlertId]     = useState("");
  const [bundle, setBundle]       = useState<any>(null);
  const [result, setResult]       = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [tamperResult, setTamper] = useState<any>(null);

  const load = async () => {
    if (!alertId.trim()) return;
    setLoading(true);
    try {
      const b = await api.alertEvidence(alertId.trim());
      setBundle(b);
      setResult(null);
      setTamper(null);
    } catch { setBundle(null); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    if (!alertId.trim()) return;
    const r = await api.verifyAlert(alertId.trim());
    setResult(r);
  };

  const tamper = async () => {
    if (!alertId.trim()) return;
    const r = await api.tamperTest(alertId.trim());
    setTamper(r);
    setBundle(r.bundle ?? bundle);
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-6">Evidence & Verification</h1>

      {/* Alert ID input */}
      <div className="glass rounded-xl p-5 border border-cyber-border mb-5">
        <p className="text-cyber-muted text-xs font-mono mb-2">ALERT ID</p>
        <div className="flex gap-3">
          <input
            value={alertId} onChange={(e) => setAlertId(e.target.value)}
            placeholder="Paste alert UUID here…"
            className="flex-1 bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-cyber-text font-mono text-sm focus:outline-none focus:border-cyber-accent"
          />
          <button onClick={load} disabled={loading}
            className="px-4 py-2 rounded-lg bg-cyber-accent/20 border border-cyber-accent/50 text-cyber-accent font-mono text-sm hover:bg-cyber-accent/30 transition-colors">
            {loading ? "Loading…" : "Load"}
          </button>
        </div>
      </div>

      {bundle && (
        <>
          {/* JSON viewer */}
          <div className="glass rounded-xl p-5 border border-cyber-border mb-5">
            <h2 className="text-sm font-mono font-semibold text-cyber-text mb-3">Evidence Bundle</h2>
            <pre className="text-[10px] text-cyber-text font-mono bg-cyber-bg/60 rounded-lg p-4 overflow-auto max-h-80 whitespace-pre-wrap">
              {JSON.stringify(bundle, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-5">
            <motion.button whileTap={{ scale: 0.94 }} onClick={verify}
              className="px-5 py-2.5 rounded-lg bg-cyber-green/20 border border-cyber-green/50 text-cyber-green font-mono text-sm hover:bg-cyber-green/30 transition-colors">
              ✓ Verify Evidence
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={tamper}
              className="px-5 py-2.5 rounded-lg bg-cyber-red/20 border border-cyber-red/50 text-cyber-red font-mono text-sm hover:bg-cyber-red/30 transition-colors">
              ✗ Tamper Test
            </motion.button>
          </div>

          {/* Verify result */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-xl p-5 border mb-4 ${result.verified ? "border-cyber-green/50 shadow-glow-green" : "border-cyber-red/50 shadow-glow-red"}`}>
              <div className="flex items-center gap-3">
                {result.verified
                  ? <CheckCircle className="text-cyber-green" size={24} />
                  : <XCircle className="text-cyber-red" size={24} />}
                <div>
                  <p className={`font-mono font-bold ${result.verified ? "text-cyber-green" : "text-cyber-red"}`}>
                    {result.verified ? "VERIFICATION PASSED" : "VERIFICATION FAILED"}
                  </p>
                  <p className="text-cyber-muted text-xs font-mono mt-0.5">Reason: {result.reason}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tamper result */}
          {tamperResult && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5 border border-cyber-red/50 shadow-glow-red">
              <div className="flex items-center gap-3 mb-3">
                <XCircle className="text-cyber-red" size={24} />
                <div>
                  <p className="font-mono font-bold text-cyber-red">TAMPER TEST — VERIFICATION FAILED (expected)</p>
                  <p className="text-cyber-muted text-xs font-mono">Reason: {tamperResult.reason}</p>
                </div>
              </div>
              <p className="text-cyber-muted text-xs font-mono">
                The bundle was deliberately mutated. The cryptographic chain detected the tampering.
              </p>
            </motion.div>
          )}
        </>
      )}

      {!bundle && !loading && (
        <div className="glass rounded-xl p-10 border border-cyber-border text-center">
          <p className="text-cyber-muted font-mono text-sm">Enter an alert ID from the Alerts page to load its evidence bundle</p>
        </div>
      )}
    </motion.div>
  );
}
