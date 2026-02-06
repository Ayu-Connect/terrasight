"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, FileText, Gavel, X, Loader2 } from "lucide-react";
import { useMission } from "@/context/MissionContext";
import { generateFIR } from "@/lib/governance/fir";
import { useState } from "react";

export default function ComplianceDossier() {
    const { activeTarget, setActiveTarget } = useMission();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateFIR = async () => {
        if (!activeTarget) return;
        setIsGenerating(true);
        try {
            const pdfBytes = await generateFIR(activeTarget.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e) {
            console.error("Failed to generate FIR", e);
        }
        setIsGenerating(false);
    };

    if (!activeTarget) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="fixed top-16 right-6 w-96 h-[calc(100vh-6rem)] z-40 glass-panel rounded-lg overflow-hidden flex flex-col pointer-events-auto"
            >
                <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3 text-warning-amber" /> COMPLIANCE DOSSIER
                    </h3>
                    <button onClick={() => setActiveTarget(null)} className="text-white/50 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-6">
                    {/* Target Header */}
                    <div className="space-y-1">
                        <div className="text-[9px] text-white/40 font-mono tracking-widest">TARGET_ID</div>
                        <div className="text-2xl font-mono text-electric-cyan font-bold break-words">{activeTarget.id}</div>
                        <div className="text-xs text-white/60">{activeTarget.loc}</div>
                    </div>

                    {/* Evidence Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-square bg-black/50 border border-white/10 rounded flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                            <span className="text-[9px] text-white/30 font-mono absolute top-1 left-1">OPTICAL_2025</span>
                        </div>
                        <div className="aspect-square bg-black/50 border border-white/10 rounded flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                            <span className="text-[9px] text-white/30 font-mono absolute top-1 left-1">SAR_FUSION_2026</span>
                            <div className="absolute inset-0 border-2 border-red-500/50 animate-pulse" />
                        </div>
                    </div>

                    {/* Neuro-Symbolic Analysis */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-matrix-green">
                            <Gavel className="w-3 h-3" /> LEGAL VIOLATION DETECTED
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-white/80 leading-relaxed font-mono">
                            <span className="text-red-400 font-bold">ACT:</span> {activeTarget.legal?.act as string}<br />
                            <span className="text-red-400 font-bold">SECTION:</span> {activeTarget.legal?.section as string}<br />
                            <span className="text-red-400 font-bold">SEVERITY:</span> {activeTarget.legal?.severity as string}
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleGenerateFIR}
                        disabled={isGenerating}
                        className="w-full py-3 bg-electric-cyan/10 hover:bg-electric-cyan/20 border border-electric-cyan/50 text-electric-cyan text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        {isGenerating ? "GENERATING..." : "Generate FIR (PDF)"}
                    </button>

                    <div className="text-[9px] text-white/30 text-center font-mono break-all">
                        Immutable Record ID: {activeTarget.txHash}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
