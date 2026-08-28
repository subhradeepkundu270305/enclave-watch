import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { pulseVariant } from "../lib/animations";
import {
  LayoutDashboard, Activity, Bell, Clock,
  Network, Globe, FileCheck, Cpu, HeartPulse, Search,
  RefreshCw, PlayCircle, Settings, ShieldAlert, Bot
} from "lucide-react";

interface SidebarProps {
  connected: boolean;
  onOpenAssistant?: () => void;
}

const NAV = [
  { to: "/",            label: "Overview",            icon: Activity },
  { to: "/dashboard",   label: "Dashboard",          icon: LayoutDashboard },
  { to: "/live",        label: "Live Monitoring",     icon: Globe },
  { to: "/alerts",      label: "Alerts",              icon: Bell },
  { to: "/timeline",    label: "Detection Timeline",  icon: Clock },
  { to: "/network",     label: "Network Topology",    icon: Network },
  { to: "/ip-history",  label: "IP Threat History",   icon: Globe },
  { to: "/evidence",    label: "Evidence & Verify",   icon: FileCheck },
  { to: "/engines",     label: "Detection Engines",   icon: Cpu },
  { to: "/health",      label: "System Health",       icon: HeartPulse },
  { to: "/retro-hunt",  label: "Retro-Hunt IOC",      icon: Search },
  { to: "/updates",     label: "Updates & Policy",    icon: RefreshCw },
  { to: "/demo",        label: "Demo Mode",           icon: PlayCircle },
  { to: "/settings",    label: "Settings",            icon: Settings },
];

const BADGES = [
  { label: "PASSIVE MONITORING", cls: "badge-passive" },
  { label: "READ-ONLY ENCLAVE", cls: "badge-readonly" },
  { label: "EGRESS HARDENED",   cls: "badge-egress"  },
  { label: "ZERO OUTBOUND",     cls: "badge-decrypt" },
];

export function Sidebar({ connected, onOpenAssistant }: SidebarProps) {
  return (
    <aside
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="w-64 h-screen bg-[#030509]/95 backdrop-blur-xl border-r border-cyber-border/70 flex flex-col fixed left-0 top-0 z-30 shadow-2xl overflow-y-auto selection:bg-cyber-accent selection:text-black"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-cyber-border/80 flex items-center gap-3">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              "0 0 10px rgba(0, 240, 255, 0.3)",
              "0 0 22px rgba(0, 240, 255, 0.8)",
              "0 0 10px rgba(0, 240, 255, 0.3)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-accent/20 to-cyber-purple/20 border border-cyber-accent/60 flex items-center justify-center text-cyber-accent shadow-glow-accent shrink-0"
        >
          <ShieldAlert size={20} className="text-cyber-accent drop-shadow-[0_0_6px_#00f0ff]" />
        </motion.div>
        <div>
          <span className="font-mono text-sm font-bold text-cyber-text tracking-widest uppercase block">
            Enclave Watch
          </span>
          <span className="text-[10px] text-cyber-muted font-mono block">NTRO SIH 2026</span>
        </div>
      </div>

      {/* Connection Indicator */}
      <div className="px-4 py-2.5 bg-cyber-surface/30 border-b border-cyber-border/40 flex items-center justify-between">
        <span className="text-[11px] font-mono text-cyber-muted font-medium">WS Pipeline</span>
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: connected ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-cyber-green shadow-glow-green" : "bg-cyber-red shadow-glow-red"
            }`}
          />
          <span
            className={`font-mono text-[10px] font-bold ${
              connected ? "text-cyber-green" : "text-cyber-red"
            }`}
          >
            {connected ? "LIVE READ-ONLY" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      {/* Quick AI Assistant Trigger */}
      {onOpenAssistant && (
        <div className="p-2.5 border-b border-cyber-border/40">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAssistant}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyber-accent/20 to-cyber-purple/20 border border-cyber-accent/40 text-cyber-accent flex items-center justify-center gap-2 text-xs font-mono font-bold shadow-glow-accent transition-all"
          >
            <Bot size={15} className="animate-pulse text-cyber-accent" />
            <span>ENCLAVE AI ASSISTANT</span>
          </motion.button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-1.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 5, backgroundColor: isActive ? "rgba(0, 240, 255, 0.18)" : "rgba(0, 240, 255, 0.08)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer group
                  ${isActive
                    ? "bg-cyber-accent/15 text-cyber-accent font-semibold shadow-glow-accent"
                    : "text-cyber-muted hover:text-cyber-text"
                  }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeSideBarBar"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyber-accent rounded-r-full shadow-glow-accent"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon size={17} className={isActive ? "text-cyber-accent" : "text-cyber-muted group-hover:text-cyber-accent transition-colors"} />
                <span className="truncate tracking-wide">{label}</span>
                
                {isActive && (
                  <motion.span
                    variants={pulseVariant}
                    animate="animate"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-accent shadow-glow-accent"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Badges footer */}
      <div className="p-3 border-t border-cyber-border/70 flex flex-col gap-1">
        {BADGES.map(({ label, cls }) => (
          <div key={label} className={`${cls} text-[9px] py-0.5 justify-center tracking-widest`}>
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
}
