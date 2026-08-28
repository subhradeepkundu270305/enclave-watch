import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Shield, Cpu, Key, Play } from "lucide-react";
import { api } from "../lib/api";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  quickActions?: { label: string; action: () => void }[];
}

const PRESET_GUIDES = [
  {
    icon: Shield,
    title: "System Architecture",
    prompt: "Explain the Enclave Watch architecture and diode setup.",
  },
  {
    icon: Cpu,
    title: "6 AI Detectors",
    prompt: "How do the 6 AI detection engines work?",
  },
  {
    icon: Key,
    title: "Evidence Chain",
    prompt: "Explain SHA-256 hash linkage & Ed25519 signature chain.",
  },
  {
    icon: Play,
    title: "Run Demo Attacks",
    prompt: "How do I run a demo attack scenario?",
  },
];

export function AIChatbot({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Welcome to **Enclave Watch Intelligence Assistant**! I am your interactive guide for the NTRO passive cyber threat detection pipeline. Ask me anything about our AI detection modules, cryptographic evidence chain, or demo scenarios.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (!textToSend) setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate AI response synthesis
    setTimeout(async () => {
      const response = await generateBotResponse(query);
      setIsTyping(false);
      setMessages((prev) => [...prev, response]);
    }, 700);
  };

  const generateBotResponse = async (query: string): Promise<Message> => {
    const q = query.toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (q.includes("arch") || q.includes("diode") || q.includes("unidirectional")) {
      return {
        id: Date.now().toString(),
        sender: "bot",
        text: "🔒 **Unidirectional Enclave Architecture**:\n\n- **Diode Hardware Isolated**: All network traffic enters the enclave via TAP/SPAN in one direction only.\n- **Zero Outbound Egress**: The enclave backend has NO outbound connections, preventing probe/handshake leaks.\n- **Passive Analysis**: All 6 detection modules operate purely on passively observed packet & flow metadata.",
        timestamp: timeStr,
      };
    }

    if (q.includes("detector") || q.includes("engine") || q.includes("ai") || q.includes("6")) {
      return {
        id: Date.now().toString(),
        sender: "bot",
        text: "⚡ **6 Parallel AI Threat Modules**:\n\n1. **DDoS SYN Flood**: Exponentially Weighted Moving Average (EWMA) + adaptive $k\\sigma$ threshold.\n2. **C2 Beaconing**: Fast Fourier Transform (FFT) power spectrum analysis for periodic heartbeats.\n3. **DNS Tunneling**: Shannon Entropy ($H > 3.5$) + N-gram subdomain likelihood scoring.\n4. **Encrypted Malware**: Mahalanobis Distance on TLS JA3 fingerprint distributions.\n5. **Port Scanning**: Unique destination port threshold + connection rate limit.\n6. **Data Exfiltration**: Cumulative Sum (CUSUM) on standardized per-device byte deviations.",
        timestamp: timeStr,
      };
    }

    if (q.includes("evidence") || q.includes("chain") || q.includes("crypto") || q.includes("sha") || q.includes("ed25519")) {
      return {
        id: Date.now().toString(),
        sender: "bot",
        text: "🔑 **Cryptographic Evidence Chain**:\n\n- **Canonical Hashing**: Every alert payload is normalized to canonical JSON and hashed using `SHA-256`.\n- **Sequential Chain**: Each block links the previous block's hash (`chain_hash = SHA256(prev_hash || content_hash || timestamp)`).\n- **Ed25519 Signatures**: Every hash is signed using an Ed25519 private key generated inside the enclave.\n- **Tamper Verification**: Try the `/verify` or `/tamper-test` endpoints on the **Evidence & Verify** page!",
        timestamp: timeStr,
      };
    }

    if (q.includes("demo") || q.includes("attack") || q.includes("run") || q.includes("trigger")) {
      return {
        id: Date.now().toString(),
        sender: "bot",
        text: "🚀 **Demo Scenario Execution**:\n\nYou can trigger synthetic attack bursts directly from the **Demo Mode** tab or click the quick action below to launch all 6 attack scenarios right now!",
        timestamp: timeStr,
        quickActions: [
          {
            label: "⚡ Launch All 6 Demo Attacks",
            action: async () => {
              try {
                await api.demoRunAll();
                handleSend("Triggered all 6 synthetic attack scenarios.");
              } catch (e: any) {
                alert(`Error triggering demo: ${e.message}`);
              }
            },
          },
        ],
      };
    }

    if (q.includes("health") || q.includes("status") || q.includes("live")) {
      try {
        const h = await api.health();
        return {
          id: Date.now().toString(),
          sender: "bot",
          text: `📊 **Live System Status**:\n\n- **Uptime**: ${Math.floor(h.uptime_seconds / 60)} min\n- **Events Processed**: ${h.events_processed?.toLocaleString()}\n- **Events / Sec**: ${h.events_per_second?.toFixed(1)}\n- **Total Alerts**: ${h.total_alerts}\n- **Chain Length**: ${h.chain_length} blocks\n- **Chain Intact**: ${h.chain_intact ? "YES ✅" : "NO ❌"}`,
          timestamp: timeStr,
        };
      } catch {
        // Fallback if backend unreachable
      }
    }

    // Default intelligent helper response
    return {
      id: Date.now().toString(),
      sender: "bot",
      text: `I understood your query about "${query}".\n\nEnclave Watch processes unidirectional IP traffic with zero egress. Explore our views:\n- **Dashboard**: Visual analytics suite\n- **Live Monitoring**: Real-time parsed connections\n- **Alerts**: Filtered threat logs\n- **Evidence & Verify**: Cryptographic integrity checks`,
      timestamp: timeStr,
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[540px] glass-strong rounded-2xl border border-cyber-accent/40 shadow-glow-accent z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-cyber-bg/90 border-b border-cyber-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyber-accent/20 border border-cyber-accent/50 text-cyber-accent">
                <Bot size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-cyber-accent tracking-wide flex items-center gap-1.5">
                  ENCLAVE INTELLIGENCE
                  <Sparkles size={12} className="text-cyber-green" />
                </h3>
                <p className="text-[10px] font-mono text-cyber-muted">AI Assistant · Passive Guide</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Preset Quick Topics */}
          <div className="px-3 py-2 bg-black/40 border-b border-cyber-border/60 flex gap-1.5 overflow-x-auto scrollbar-none">
            {PRESET_GUIDES.map((g) => (
              <button
                key={g.title}
                onClick={() => handleSend(g.prompt)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-cyber-surface/80 border border-cyber-border/80 text-cyber-muted hover:text-cyber-accent hover:border-cyber-accent/50 transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
              >
                <g.icon size={11} className="text-cyber-accent" />
                <span>{g.title}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div data-lenis-prevent onWheel={(e) => e.stopPropagation()} className="flex-1 p-4 overflow-y-auto overscroll-contain space-y-3.5 bg-cyber-bg/40">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed font-sans ${
                    m.sender === "user"
                      ? "bg-cyber-accent/20 border border-cyber-accent/40 text-cyber-text rounded-br-none"
                      : "glass border border-cyber-border text-cyber-text rounded-bl-none font-mono"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Quick Action Buttons if present */}
                  {m.quickActions && (
                    <div className="mt-2 pt-2 border-t border-cyber-border/60 flex flex-col gap-1.5">
                      {m.quickActions.map((qa, i) => (
                        <button
                          key={i}
                          onClick={qa.action}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-cyber-green/20 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green/30 transition-all text-center cursor-pointer"
                        >
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono text-cyber-muted mt-1 px-1">{m.timestamp}</span>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-cyber-accent text-xs font-mono p-2">
                <Bot size={14} className="animate-spin" />
                <span>Synthesizing response…</span>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-cyber-bg/90 border-t border-cyber-border flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Assistant about threats, architecture..."
              className="flex-1 bg-cyber-surface border border-cyber-border rounded-xl px-3 py-2 text-xs font-mono text-cyber-text focus:outline-none focus:border-cyber-accent"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!input.trim()}
              className="px-3.5 py-2 rounded-xl bg-cyber-accent/20 border border-cyber-accent/50 text-cyber-accent hover:bg-cyber-accent/30 disabled:opacity-40 transition-all"
            >
              <Send size={15} />
            </motion.button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
