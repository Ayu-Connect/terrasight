"use client";

import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import { useEffect } from "react";
import { useMission } from "@/context/MissionContext";
import { supabase } from "@/lib/supabase/client";

interface Detection {
    id: number | string;
    blockchain_hash?: string;
    severity: "CRITICAL" | "WARNING" | "INFO" | "HIGH";
    coords: {
        lat: number;
        lng: number;
    };
    violation_type: string;
    section: string;
    penalty_type: string;
    [key: string]: unknown;
}

export default function useRealtimeAlerts() {
    const { addAlert, setActiveTarget, systemReady, activeState, addLog } = useMission();

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
                        id: detection.id?.toString() || detection.blockchain_hash?.slice(-8) || "UNKNOWN",
                        type: detection.severity,
                        loc: `${Number(detection.coords.lat).toFixed(4)}° N, ${Number(detection.coords.lng).toFixed(4)}° E`,
                        coordinates: [detection.coords.lng, detection.coords.lat] as [number, number],
                        msg: `${detection.violation_type} - VIOLATION DETECTED`,
                        time: "JUST NOW",
                        txHash: detection.blockchain_hash || "PENDING",
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

    // 2. LIVE SCANNER (Real-Time Triggers)
    useEffect(() => {
        if (!systemReady) return;

        const runLiveScan = async () => {
            // Only scan if we have a valid target focus
            if (!activeState) return;

            addLog(`[System] Initiating Sector Scan: ${activeState.name}`);

            // Real Coordinates from Active State (Focus Point)
            // We add a tiny jitter to simulate scanning *around* the center point, 
            // ensuring we hit slightly different pixels each request to test the API.
            const lat = activeState.coordinates[1] + (Math.random() * 0.002 - 0.001);
            const lng = activeState.coordinates[0] + (Math.random() * 0.002 - 0.001);

            addLog(`[Sat-Link] Acquired Target: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);



            try {
                // Call Server-Side Audit API
                const response = await fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng, stateCode: activeState.code })
                });

                if (!response.body) return;

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const payload = JSON.parse(line);
                            if (payload.type === 'log') addLog(payload.message);
                            if (payload.type === 'result' && payload.data.status === 'VERIFIED') {
                                // Add to alerts if verified
                                const newAlert: any = { // Using any cast temporarily to match context type flexibility if needed
                                    id: payload.data.id || `LIVE-${Date.now()}`,
                                    type: 'CRITICAL',
                                    loc: `${activeState.name} Sector`,
                                    coordinates: [lat, lng],
                                    msg: `UNAUTHORIZED STRUCTURE DETECTED`,
                                    time: 'JUST NOW',
                                    legal: payload.data.verdict
                                };
                                addAlert(newAlert);
                            }
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                }

            } catch (err) {
                console.error("Auto-Scan Failed", err);
                addLog(`[Error] Auto-Scan Failed`);
            }
        };

        // Scan every 15 seconds (Real API Rate Limit Friendly)
        const interval = setInterval(runLiveScan, 15000);

        // Run once immediately on state change
        if (activeState) runLiveScan();

        return () => clearInterval(interval);
    }, [systemReady, activeState, addLog]);
}

