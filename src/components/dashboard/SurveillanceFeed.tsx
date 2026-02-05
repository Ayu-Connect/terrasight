"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Eye } from "lucide-react";
import { useMission } from "@/context/MissionContext";

export default function SurveillanceFeed() {
    const { alerts, setActiveTarget } = useMission();

    return (
        <div className="fixed top-16 left-6 w-80 h-[calc(100vh-6rem)] z-40 glass-panel rounded-lg overflow-hidden flex flex-col pointer-events-auto">
            <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-electric-cyan tracking-widest flex items-center gap-2">
                    <Eye className="w-3 h-3" /> SURVEILLANCE FEED
                </h3>
                <span className="text-[10px] text-white/50 animate-pulse">LIVE</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: "auto" }}
                            exit={{ opacity: 0, x: -20 }}
                            onClick={() => setActiveTarget(alert)}
                            className={`
                  p-3 rounded-md border border-white/5 bg-black/40 hover:bg-white/5 transition-colors cursor-pointer group
                  ${alert.type === 'CRITICAL' ? 'border-l-2 border-l-red-500' : ''}
                  ${alert.type === 'WARNING' ? 'border-l-2 border-l-warning-amber' : ''}
                  ${alert.type === 'INFO' ? 'border-l-2 border-l-electric-cyan' : ''}
                `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold ${alert.type === 'CRITICAL' ? 'text-red-500' :
                                        alert.type === 'WARNING' ? 'text-warning-amber' : 'text-electric-cyan'
                                    }`}>{alert.type}</span>
                                <span className="text-[9px] text-white/30">{alert.time}</span>
                            </div>
                            <div className="text-xs font-mono text-white/90 mb-1 leading-tight group-hover:text-electric-cyan transition-colors">
                                {alert.msg}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-white/50 font-mono">
                                <MapPin className="w-2 h-2" /> {alert.loc}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {alerts.length === 0 && (
                    <div className="p-4 text-center text-xs text-white/30 animate-pulse">
                        SCANNING SECTOR 4...
                    </div>
                )}
            </div>
        </div>
    );
}
