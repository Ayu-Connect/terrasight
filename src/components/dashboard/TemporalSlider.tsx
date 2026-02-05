"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

export default function TemporalSlider() {
    const [value, setValue] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-auto">
            {/* Label Bubbles */}
            <div className="flex justify-between w-96 text-[10px] font-mono font-bold tracking-widest">
                <span className={`${value < 50 ? 'text-electric-cyan' : 'text-white/30'}`}>2025 OPTICAL</span>
                <span className={`${value > 50 ? 'text-electric-cyan' : 'text-white/30'}`}>2026 SAR FUSION</span>
            </div>

            {/* Slider Container */}
            <div className="glass-panel rounded-full p-2 flex items-center gap-4 w-[28rem] backdrop-blur-xl border border-white/20">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-electric-cyan transition-colors"
                >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>

                <div className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
                    {/* Progress Fill */}
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-electric-cyan"
                        style={{ width: `${value}%` }}
                    />

                    {/* Slider Input */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setValue(parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                    />

                    {/* Decor */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                <div className="text-[10px] font-mono text-electric-cyan w-8 text-right">
                    {value}%
                </div>
            </div>
        </div>
    );
}
