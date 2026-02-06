"use client";


import { Activity, Wifi, Cpu, Layers } from "lucide-react";

import { useMission } from "@/context/MissionContext";

export default function SystemPulse() {
    const { health } = useMission();
    return (
        <div className="fixed top-0 left-0 w-full h-12 z-50 flex items-center justify-between px-6 glass-panel border-b border-white/10">
            {/* Left: Branding */}
            <div className="flex items-center space-x-4">
                <div className="text-electric-cyan font-bold tracking-[0.2em] text-lg">
                    CODE<span className="text-white">GENESIS</span>
                </div>
                <div className="h-4 w-[1px] bg-white/20" />
                <div className="flex items-center space-x-2 text-xs text-matrix-green">
                    <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health.database === 'ONLINE' ? 'bg-matrix-green' : 'bg-red-500'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${health.database === 'ONLINE' ? 'bg-matrix-green' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="tracking-wider">{health.database === 'ONLINE' ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
                </div>
            </div>

            {/* Center: System Stats Ticker */}
            <div className="hidden md:flex items-center space-x-8 text-xs font-mono text-white/70">
                <div className="flex items-center space-x-2">
                    <Wifi className={`w-3 h-3 ${health.satellite === 'LINKED' ? 'text-electric-cyan' : 'text-red-500'}`} />
                    <span>SAT-LINK: <span className={`${health.satellite === 'LINKED' ? 'text-electric-cyan' : 'text-red-500'}`}>{health.satellite}</span></span>
                </div>
                <div className="flex items-center space-x-2">
                    <Cpu className="w-3 h-3 text-warning-amber" />
                    <span>MODELS: <span className="text-warning-amber">SWIN-TRANSFORMER</span></span>
                </div>
                <div className="flex items-center space-x-2">
                    <Activity className="w-3 h-3 text-matrix-green" />
                    <span>LATENCY: <span className="text-matrix-green">{health.latency}ms</span></span>
                </div>
                <div className="flex items-center space-x-2">
                    <Layers className="w-3 h-3 text-purple-400" />
                    <span>BLOCKCHAIN: <span className="text-purple-400">POLYGON AMOY</span></span>
                </div>
            </div>

            {/* Right: Time/User */}
            <div className="text-xs font-mono text-white/50">
                GOV_ID: <span className="text-white">ALPHA-01</span>
            </div>
        </div>
    );
}
