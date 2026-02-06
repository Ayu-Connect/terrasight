
import { NextRequest, NextResponse } from 'next/server';
import { fetchMultiSourceData } from '@/lib/engine/fusion';
import { processFusedScene } from '@/lib/engine/orchestrator';

export const maxDuration = 60; // Allow 1 minute for complex analysis
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { lat, lng, stateCode } = await req.json();

        // 🎯 Targeted Surveillance: Override random user coords with official "High Risk" Zones
        // This ensures the demo hits areas with actual features (Riverbeds, Mines) for valid detection
        const HOTSPOTS: Record<string, { lat: number, lng: number, name: string }> = {
            'DELHI': { lat: 28.545, lng: 77.300, name: "Yamuna Floodplain (Okhla)" }, // Riverbed encroachment
            'UP': { lat: 24.150, lng: 82.900, name: "Sonbhadra Stone Mines" } // Illegal Mining zone
        };

        let targetLat = lat;
        let targetLng = lng;
        let locationName = "Target Sector";

        if (stateCode && HOTSPOTS[stateCode]) {
            // Only update name, keep the jittered coordinates passed from the frontend "Live Scan"
            locationName = HOTSPOTS[stateCode].name;

            // Optional: If request didn't provide lat/lng (e.g. manual curl), fallback to hotspot center
            if (!lat && !lng) {
                targetLat = HOTSPOTS[stateCode].lat;
                targetLng = HOTSPOTS[stateCode].lng;
            }
        }

        if (!targetLat || !targetLng) {
            return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        // Set up SSE-style streaming response (but using simple text chunks for now for compatibility)
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendLog = (msg: string) => {
                    try {
                        const data = JSON.stringify({ type: 'log', message: msg }) + '\n';
                        controller.enqueue(encoder.encode(data));
                    } catch (e) {
                        // Client likely disconnected or stream closed. Ignore to prevent terminal noise.
                    }
                };

                try {
                    sendLog(`[System] Initializing Server-Side Audit for ${locationName} (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)})...`);

                    // 1. Fetch Data (Server-Side, has access to process.env)
                    const fusedScene = await fetchMultiSourceData(targetLat, targetLng, stateCode);

                    // 2. Process Logic
                    const result = await processFusedScene(fusedScene, sendLog);

                    // 3. Send Final Result
                    const finalData = JSON.stringify({ type: 'result', data: result }) + '\n';
                    controller.enqueue(encoder.encode(finalData));
                } catch (error: any) {
                    console.error("Audit Error:", error);
                    const errData = JSON.stringify({ type: 'error', message: error.message || 'Internal Server Error' }) + '\n';
                    controller.enqueue(encoder.encode(errData));
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain', // Using simple text stream for robust handling
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
