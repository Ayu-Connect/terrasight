"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SystemHealth, checkSystemHealth } from "@/lib/engine/health";

export interface Alert {
    id: string;
    type: "CRITICAL" | "WARNING" | "INFO" | "HIGH";
    loc: string;
    coordinates: [number, number];
    msg: string;
    time: string;
    txHash?: string;
    legal?: Record<string, unknown>;
}

import { STATE_BOUNDS } from "@/lib/constants";

export type StateConfig = {
    name: string;
    code: string;
    coordinates: [number, number]; // [lng, lat] for center
    bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
    zoom: number;
};

export const AVAILABLE_STATES: StateConfig[] = [
    {
        name: STATE_BOUNDS.DELHI.name,
        code: STATE_BOUNDS.DELHI.code,
        coordinates: STATE_BOUNDS.DELHI.center,
        bbox: STATE_BOUNDS.DELHI.bbox,
        zoom: 11
    },
    {
        name: STATE_BOUNDS.UP.name,
        code: STATE_BOUNDS.UP.code,
        coordinates: STATE_BOUNDS.UP.center,
        bbox: STATE_BOUNDS.UP.bbox,
        zoom: 7
    },
    { name: "Specific Zone", code: "ZONE_A", coordinates: [77.3, 28.6], zoom: 13 }
];

interface MissionContextType {
    alerts: Alert[];
    addAlert: (alert: Alert) => void;
    activeTarget: Alert | null;
    setActiveTarget: (alert: Alert | null) => void;
    systemReady: boolean;
    activeState: StateConfig | null;
    setActiveState: (state: StateConfig) => void;
    systemLogs: string[];
    addLog: (log: string) => void;
    health: SystemHealth;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export function MissionProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [activeTarget, setActiveTarget] = useState<Alert | null>(null);
    const [systemReady, setSystemReady] = useState(false);
    const [activeState, setActiveState] = useState<StateConfig | null>(null);
    const [systemLogs, setSystemLogs] = useState<string[]>([]);
    const [health, setHealth] = useState<SystemHealth>({
        database: 'CONNECTING',
        satellite: 'SEARCHING',
        blockchain: 'ACTIVE', // Trusted local
        latency: 0,
        lastChecked: new Date().toISOString()
    });

    const addLog = useCallback((log: string) => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + "." + Math.floor(Math.random() * 999).toString().padStart(3, '0');
        setSystemLogs(prev => [`[${timestamp}] ${log}`, ...prev].slice(0, 50));
    }, []);

    // Health Check Polling
    useEffect(() => {
        const runHealthCheck = async () => {
            const status = await checkSystemHealth();
            setHealth(status);
        };

        runHealthCheck(); // Run immediately
        const interval = setInterval(runHealthCheck, 30000); // Every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Simulate system boot sequence
        // We wait for user input now, so systemReady might depend on state selection?
        // Or systemReady means "Assets loaded". Let's keep it as boot time.
        setTimeout(() => setSystemReady(true), 2000);
    }, []);

    const addAlert = useCallback((alert: Alert) => {
        setAlerts((prev) => {
            if (prev.some(a => a.id === alert.id)) return prev;
            return [alert, ...prev];
        });
    }, []);

    return (
        <MissionContext.Provider value={{
            alerts, addAlert,
            activeTarget, setActiveTarget,
            systemReady,
            activeState, setActiveState,
            systemLogs, addLog,
            health
        }}>
            {children}
        </MissionContext.Provider>
    );
}

export function useMission() {
    const context = useContext(MissionContext);
    if (!context) {
        throw new Error("useMission must be used within a MissionProvider");
    }
    return context;
}
