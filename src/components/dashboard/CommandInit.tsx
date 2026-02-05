"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMission, AVAILABLE_STATES, StateConfig } from "@/context/MissionContext";
import { Globe, Shield, Activity, ChevronRight, Terminal } from "lucide-react";

export default function CommandInit() {
    const { activeState, setActiveState } = useMission();
    const [isBooted, setIsBooted] = useState(false);

    // If state is already selected, don't show this screen
    if (activeState) return null;

    const handleSelect = (state: StateConfig) => {
        // Play boot sound effect here if possible
        setActiveState(state);
    };

    return (
        <div className="fixed inset-0 z-50 bg-cyber-black text-white flex items-center justify-center font-mono">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="relative z-10 w-full max-w-4xl p-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="border-b border-electric-cyan/30 pb-4 mb-8">
                        <h1 className="text-4xl font-bold tracking-[0.2em] text-electric-cyan flex items-center gap-4">
                            <Terminal className="w-8 h-8" />
                            CODEGENESIS
                        </h1>
                        <p className="text-sm text-electric-cyan/60 mt-2 tracking-widest pl-12">
                            SPATIAL ORCHESTRATION SYSTEM v2.5
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Description */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-matrix-green">
                                <Activity className="w-5 h-5 animate-pulse" />
                                <span className="text-sm tracking-widest">SYSTEM ONLINE</span>
                            </div>
                            <p className="text-lg text-white/80 leading-relaxed font-light">
                                Welcome to the Neural Command Interface.
                                Establish a secure uplink to a governance zone to begin
                                sovereign monitoring operations.
                            </p>

                            <div className="p-4 border border-white/10 bg-white/5 rounded text-xs text-white/50 space-y-2">
                                <div className="flex justify-between">
                                    <span>NEURO-SYMBOLIC GATE:</span>
                                    <span className="text-matrix-green">ACTIVE</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>BLOCKCHAIN LEDGER:</span>
                                    <span className="text-matrix-green">CONNECTED</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>SATELLITE DOWNLINK:</span>
                                    <span className="text-matrix-green">STANDBY</span>
                                </div>
                            </div>
                        </div>

                        {/* State Selection Grid */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-white/40 tracking-widest mb-4">
                                SELECT JURISDICTION PROTOCOL
                            </h3>

                            <div className="grid grid-cols-1 gap-3">
                                {AVAILABLE_STATES.map((state) => (
                                    <motion.button
                                        key={state.code}
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect(state)}
                                        className="group relative flex items-center justify-between p-4 border border-electric-cyan/20 hover:border-electric-cyan bg-electric-cyan/5 hover:bg-electric-cyan/10 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-electric-cyan/10 rounded group-hover:bg-electric-cyan/20 transition-colors">
                                                <Globe className="w-5 h-5 text-electric-cyan" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-white group-hover:text-electric-cyan transition-colors">
                                                    {state.name}
                                                </div>
                                                <div className="text-[10px] text-white/40 tracking-widest">
                                                    SECURE UPLINK :: {state.code}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-electric-cyan transition-colors" />

                                        {/* Corner Accents */}
                                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-electric-cyan/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-electric-cyan/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Status */}
                <div className="absolute bottom-10 left-10 right-10 flex justify-between text-[10px] text-white/20 font-mono">
                    <span>V.2.5.0-ALPHA-BUILD</span>
                    <span className="animate-pulse">AWAITING INPUT...</span>
                </div>
            </div>
        </div>
    );
}
