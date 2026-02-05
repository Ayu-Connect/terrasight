"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface Alert {
    id: string;
    type: "CRITICAL" | "WARNING" | "INFO" | "HIGH";
    loc: string;
    coordinates: [number, number];
    msg: string;
    time: string;
    txHash?: string;
    legal?: any;
}

export type StateConfig = {
    name: string;
    code: string;
    coordinates: [number, number]; // [lat, lng] for flyTo
    zoom: number;
};

export const AVAILABLE_STATES: StateConfig[] = [
    { name: "NCT of Delhi", code: "DELHI", coordinates: [28.6139, 77.2090], zoom: 11 },
    { name: "Uttar Pradesh", code: "UP", coordinates: [26.8467, 80.9462], zoom: 7 }, // Luckow center
    { name: "Specific Zone", code: "ZONE_A", coordinates: [28.6, 77.3], zoom: 13 }
];

interface MissionContextType {
    alerts: Alert[];
    addAlert: (alert: Alert) => void;
    activeTarget: Alert | null;
    setActiveTarget: (alert: Alert | null) => void;
    systemReady: boolean;
    activeState: StateConfig | null;
    setActiveState: (state: StateConfig) => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export function MissionProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [activeTarget, setActiveTarget] = useState<Alert | null>(null);
    const [systemReady, setSystemReady] = useState(false);
    const [activeState, setActiveState] = useState<StateConfig | null>(null);

    useEffect(() => {
        // Simulate system boot sequence
        // We wait for user input now, so systemReady might depend on state selection?
        // Or systemReady means "Assets loaded". Let's keep it as boot time.
        setTimeout(() => setSystemReady(true), 2000);
    }, []);

    const addAlert = (alert: Alert) => {
        setAlerts((prev) => [alert, ...prev]);
    };

    return (
        <MissionContext.Provider value={{
            alerts, addAlert,
            activeTarget, setActiveTarget,
            systemReady,
            activeState, setActiveState
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
