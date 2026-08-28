import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { SocketProvider, useSocket } from "./context/SocketProvider";
import { Sidebar } from "./components/Sidebar";
import { AIChatbot } from "./components/AIChatbot";
import { useSmoothScroll } from "./lib/smoothScroll";

// Pages
import Overview          from "./pages/Overview";
import Dashboard         from "./pages/Dashboard";
import LiveMonitoring    from "./pages/LiveMonitoring";
import Alerts            from "./pages/Alerts";
import DetectionTimeline from "./pages/DetectionTimeline";
import Network           from "./pages/Network";
import IPHistory         from "./pages/IPHistory";
import EvidenceVerification from "./pages/EvidenceVerification";
import DetectionEngines  from "./pages/DetectionEngines";
import SystemHealth      from "./pages/SystemHealth";
import RetroHunt         from "./pages/RetroHunt";
import Updates           from "./pages/Updates";
import DemoMode          from "./pages/DemoMode";
import Settings          from "./pages/Settings";

function AppShell() {
  const { connected } = useSocket();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  useSmoothScroll();

  return (
    <div className="flex min-h-screen bg-cyber-bg cyber-grid-bg">
      <Sidebar connected={connected} onOpenAssistant={() => setChatOpen(true)} />
      
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"            element={<Overview />} />
            <Route path="/dashboard"   element={<Dashboard defaultTab="overview" />} />
            <Route path="/live"        element={<LiveMonitoring />} />
            <Route path="/alerts"      element={<Alerts />} />
            <Route path="/timeline"    element={<DetectionTimeline />} />
            <Route path="/analytics"   element={<Dashboard defaultTab="analytics" />} />
            <Route path="/network"     element={<Network />} />
            <Route path="/ip-history"  element={<IPHistory />} />
            <Route path="/evidence"    element={<EvidenceVerification />} />
            <Route path="/engines"     element={<DetectionEngines />} />
            <Route path="/health"      element={<SystemHealth />} />
            <Route path="/retro-hunt"  element={<RetroHunt />} />
            <Route path="/updates"     element={<Updates />} />
            <Route path="/demo"        element={<DemoMode />} />
            <Route path="/settings"    element={<Settings />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Cool & Attractive Round Floating AI Assistant Launcher */}
      {!chatOpen && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 group cursor-pointer"
          onClick={() => setChatOpen(true)}
        >
          {/* Hover Tooltip Pill */}
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            whileHover={{ opacity: 1, x: 0, scale: 1 }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-cyber-accent/40 bg-[#070b16]/90 text-cyber-accent text-xs font-mono font-bold shadow-glow-accent pointer-events-none"
          >
            <Sparkles size={12} className="animate-spin text-cyber-accent" />
            <span>AI ASSISTANT</span>
          </motion.div>

          {/* Glowing Round AI Button */}
          <div className="relative flex items-center justify-center">
            {/* Outer Expanding Radar Glow Rings */}
            <motion.span
              animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-cyber-accent"
            />
            <motion.span
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyber-accent via-cyber-purple to-cyber-green opacity-50 blur-sm"
            />

            <motion.button
              whileHover={{ scale: 1.12, rotate: 6 }}
              whileTap={{ scale: 0.92 }}
              className="relative w-14 h-14 rounded-full bg-[#050812] border-2 border-cyber-accent text-cyber-accent flex items-center justify-center shadow-glow-accent cursor-pointer overflow-hidden group-hover:border-cyber-green transition-all"
              title="Open Enclave AI Assistant"
            >
              {/* Inner ambient glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyber-accent/20 via-transparent to-cyber-purple/30 group-hover:from-cyber-green/20 transition-all" />
              <Bot size={26} className="relative z-10 text-cyber-accent group-hover:text-cyber-green transition-colors drop-shadow-[0_0_10px_#00f0ff]" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Floating AI Chatbot Drawer */}
      <AIChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AppShell />
      </SocketProvider>
    </BrowserRouter>
  );
}
