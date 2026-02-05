import { supabase } from "@/lib/supabase/client";
import cadastralData from "@/data/mock_cadastral_data.json";
import bbox from "@turf/bbox";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

// Helper to get random number in range
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const detectChange = async (t0_image_id: string, t1_image_id: string) => {
    // Simulate GPU inference time
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return await simulateDetection();
};

const simulateDetection = async () => {
    // 1. Pick a random zone from 'Protected Zones'
    const zone = cadastralData.features[Math.floor(Math.random() * cadastralData.features.length)];

    // 2. Generate point within zone
    // Using simple bbox rejection sampling for now
    const zoneBbox = bbox(zone as any); // [minX, minY, maxX, maxY]
    let p;
    let attempts = 0;

    // Try to find a point inside the polygon (max 10 attempts to avoid infinite loop)
    do {
        const lng = randomInRange(zoneBbox[0], zoneBbox[2]);
        const lat = randomInRange(zoneBbox[1], zoneBbox[3]);
        p = point([lng, lat]);
        attempts++;
    } while (!booleanPointInPolygon(p, zone as any) && attempts < 10);

    const [lng, lat] = p.geometry.coordinates;

    const detectionData = {
        hasChange: true,
        confidence: 0.94 + Math.random() * 0.05, // 94% - 99%
        changeType: Math.random() > 0.5 ? "Man-made Structure" : "Vegetation Loss",
        bbox: [lng - 0.0005, lat - 0.0005, lng + 0.0005, lat + 0.0005], // Tiny bbox around point
        model: "ChangeFormer-V3 (Sentinel-Fused)",
        images: {
            t0: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=200&auto=format&fit=crop", // 2025 Optical Baseline (Nature)
            t1: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=200&auto=format&fit=crop"  // 2026 Construction/Change
        }
    };

    // 3. Trigger Supabase Insert
    // DEPRECATED: State management is now handled by the Orchestration Engine (lib/engine/orchestrator.ts)
    /*
    try {
        await supabase.from('detections').insert({
            coords: { lat, lng },
            violation_type: detectionData.changeType,
            status: 'PENDING',
            severity: 'HIGH',
            law_section: "Analysing...",
            blockchain_hash: "PENDING"
        });
    } catch (e) {
        console.error("Supabase Insert Failed:", e);
    }
    */

    return detectionData;
};

