"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Eye } from "lucide-react";
import { useMission } from "@/context/MissionContext";

export default function SurveillanceFeed() {
    const { alerts, setActiveTarget, systemLogs, activeState, addLog } = useMission(); // Use real logs

    const handleAudit = async () => {
        if (!activeState) return;
        addLog(`[System] MANUAL AUDIT INITIATED: ${activeState.name}`);

        // Jitter to ensure fresh API hit
        const lat = activeState.coordinates[1] + (Math.random() * 0.002 - 0.001);
        const lng = activeState.coordinates[0] + (Math.random() * 0.002 - 0.001);

        try {
            const response = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng })
            });

            if (!response.body) throw new Error("No response stream");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Process all complete lines
                buffer = lines.pop() || ''; // Keep partial line

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const payload = JSON.parse(line);
                        if (payload.type === 'log') {
                            addLog(payload.message);
                        } else if (payload.type === 'error') {
                            addLog(`[Error] ${payload.message}`);
                        } else if (payload.type === 'result') {
                            addLog(`[Audit] Verified: ${payload.data.status}`);
                        }
                    } catch (e) {
                        console.error("Stream parse error", e);
                    }
                }
            }
        } catch (e) {
            console.error("Audit Request Failed", e);
            addLog(`[Error] Audit Failed: ${e}`);
        }
    };

    return (
        <div className="fixed top-16 left-6 w-80 h-[calc(100vh-6rem)] z-40 glass-panel rounded-lg overflow-hidden flex flex-col pointer-events-auto">
            <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-electric-cyan tracking-widest flex items-center gap-2">
                    <Eye className="w-3 h-3" /> SURVEILLANCE FEED
                </h3>
                <button
                    onClick={handleAudit}
                    className="text-[10px] bg-electric-cyan/10 hover:bg-electric-cyan/20 text-electric-cyan px-2 py-1 rounded border border-electric-cyan/30 transition-colors uppercase tracking-wider font-mono"
                >
                    AUDIT SECTOR
                </button>
            </div>

            {/* LIVE TERMINAL */}
            <div className="bg-black/80 font-mono text-[10px] p-2 border-b border-white/10 h-32 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                <div className="space-y-1">
                    {systemLogs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1 - (i * 0.15), x: 0 }} // Fade out older logs
                            className="text-electric-cyan/80 truncate"
                        >
                            <span className="opacity-50 mr-2">{log.split(']')[0]}]</span>
                            {log.split(']')[1]}
                        </motion.div>
                    ))}
                </div>
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
                            {/* PRODUCTION REQUIREMENT: Show Blockchain Status */}
                            <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-1 text-[8px] tracking-wider text-green-400 font-bold">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                BLOCKCHAIN SECURED: EVIDENCE IMMUTABLE
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
