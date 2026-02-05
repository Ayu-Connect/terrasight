"use client";

import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import { useEffect } from "react";
import { useMission } from "@/context/MissionContext";
import { fetchMultiSourceData } from "@/lib/engine/fusion";
import { processFusedScene } from "@/lib/engine/orchestrator";
import { supabase } from "@/lib/supabase/client";

interface Detection {
    id: number | string;
    transaction_hash?: string;
    severity: "CRITICAL" | "WARNING" | "INFO" | "HIGH";
    lat: number;
    lng: number;
    violation_type: string;
    section: string;
    penalty_type: string;
    [key: string]: any;
}

export default function useRealtimeAlerts() {
    const { addAlert, setActiveTarget, systemReady, activeState } = useMission();

    // 1. Listen for Verified Detections (The Receiver)
    useEffect(() => {
        if (!systemReady) return;

        const channel = supabase
            .channel('realtime-detections')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'detections', filter: "status=eq.VERIFIED" },
                (payload: RealtimePostgresInsertPayload<Detection>) => {
                    const detection = payload.new;
                    console.log("[Realtime] Received verified detection:", detection);

                    const newAlert = {
                        id: detection.id?.toString() || detection.transaction_hash?.slice(-8) || "UNKNOWN",
                        type: detection.severity,
                        loc: `${Number(detection.lat).toFixed(4)}° N, ${Number(detection.lng).toFixed(4)}° E`,
                        coordinates: [detection.lng, detection.lat] as [number, number],
                        msg: `${detection.violation_type} - VIOLATION DETECTED`,
                        time: "JUST NOW",
                        txHash: detection.transaction_hash || "PENDING",
                        legal: {
                            act: detection.violation_type, // or 'law' column if exists? using type as law name for now
                            section: detection.section,
                            penalty: detection.penalty_type,
                            severity: detection.severity
                        }
                    };

                    addAlert(newAlert);

                    if (detection.severity === "CRITICAL") {
                        setActiveTarget(newAlert);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [systemReady, addAlert, setActiveTarget]);

    // 2. Run Simulation (The Generator)
    useEffect(() => {
        if (!systemReady) return;

        const runSimulation = async () => {
            // 1. Ingest Data
            // 1. Ingest Data (Merged into Fusion Engine)

            // 2. Vision Inference
            // Determine simulation lat/lng based on active state or random fallback
            let simLat = 28.58 + (Math.random() * 0.1);
            let simLng = 77.24 + (Math.random() * 0.1);

            if (activeState && activeState.coordinates) { // Ensure activeState and coordinates exist
                // Simulate near the center of the active state
                simLat = activeState.coordinates[1]; // Assuming lat is index 1
                simLng = activeState.coordinates[0]; // Assuming lng is index 0
            }

            // 1. Fusion Engine Ingestion
            const fusedScene = await fetchMultiSourceData(simLat, simLng);

            // 2. Orchestration (Analysis & Decision)
            // Note: processFusedScene handles DB insertion if verified
            await processFusedScene(fusedScene);
        };

        // Trigger simulation every 10 seconds
        const interval = setInterval(runSimulation, 10000);

        // Run once immediately
        runSimulation();

        return () => clearInterval(interval);
    }, [systemReady, activeState]);
}

