import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Updates() {
  const [pk, setPk] = useState<string>("");
  useEffect(() => { api.settings().then((s) => setPk(s.public_key_pem ?? "")).catch(() => {}); }, []);

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="p-6 max-w-2xl">
      <h1 className="text-2xl font-mono font-bold gradient-text mb-2">Updates</h1>
      <p className="text-cyber-muted text-sm font-mono mb-6">Sealed-enclave update model</p>

      <div className="space-y-5">
        {[
          { title: "Sealed Enclave Update Policy",
            body: "The monitoring enclave operates in a hermetically sealed environment. No software updates are pulled from the internet. Updates must be delivered via physically authenticated signed packages on air-gapped media (USB / DVD), verified against the enclave's public update key before installation." },
          { title: "Update Signing Key (Ed25519 Public Key)",
            body: pk || "Loading…", mono: true },
          { title: "Threat Intelligence Feeds",
            body: "No live external threat-intel feeds are used. The AI detection models are periodically retrained offline and deployed as signed model packages. This prevents adversarial feed poisoning." },
          { title: "Detector Version",
            body: "v1.0.0 — SIH 2026 Hackathon Build. All detectors bundled at startup. Hot-reloading not available in passive mode." },
        ].map(({ title, body, mono }) => (
          <motion.div key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5 border border-cyber-border">
            <h2 className="text-sm font-mono font-semibold text-cyber-accent mb-3">{title}</h2>
            {mono ? (
              <pre className="text-[10px] font-mono text-cyber-green bg-cyber-bg/60 rounded-lg p-3 overflow-auto whitespace-pre-wrap">{body}</pre>
            ) : (
              <p className="text-cyber-muted text-sm">{body}</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
