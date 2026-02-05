import { supabase } from '../supabase/client';
import { checkGeoCompliance, LegalVerdict } from '../governance/moat';
import { generateCanonicalHash, pushToBlockchain } from '../blockchain/chain';
import { performSpatialAudit } from './spatialAudit';
import { analyzeTerrainVulnerability, FusedScene } from './fusion'; // Fusion Engine Integration
import bbox from '@turf/bbox';
import { polygon } from '@turf/helpers';

interface OrchestrationResult {
    status: 'VERIFIED' | 'IGNORED' | 'PENDING';
    verdict?: any;
    confidence: number;
    message: string;
    txHash?: string;
    encroachment_area?: number;
    source_breakdown?: any;
}

/**
 * The Brain: Core Orchestration Engine (Fusion Enabled)
 * Decides when to trigger AI and when to apply legal rules.
 */
export const processFusedScene = async (
    scene: FusedScene
): Promise<OrchestrationResult> => {
    console.log(`[Orchestrator] Processing Fused Scene ${scene.id} at ${scene.centroid[0]}, ${scene.centroid[1]}`);

    // 1. DRDO-Inspired Terrain Analysis
    const analysis = analyzeTerrainVulnerability(scene);

    // 2. Threshold Check
    if (!analysis.isManMade || analysis.ai_confidence < 0.98) {
        console.log(`[Orchestrator] Confidence too low (${analysis.ai_confidence}) or Natural Terrain (${analysis.material}). Ignoring.`);
        return {
            status: 'IGNORED',
            confidence: analysis.ai_confidence,
            message: `Ignored: ${analysis.material} (${(analysis.ai_confidence * 100).toFixed(1)}%)`
        };
    }

    // 3. Spatial Audit (Kabja Detector)
    // Create a small box around the centroid for the audit (Simulating extent of change)
    const [lat, lng] = scene.centroid;
    const d = 0.0005; // ~50m box
    const detectedPoly = polygon([[
        [lng - d, lat - d],
        [lng - d, lat + d],
        [lng + d, lat + d],
        [lng + d, lat - d],
        [lng - d, lat - d]
    ]]);

    const auditResult = await performSpatialAudit(detectedPoly);

    // 4. Neuro-Symbolic Intersection Logic
    if (auditResult.isEncroachment) {
        console.log(`[Orchestrator] CRITICAL ENCROACHMENT! ${auditResult.area_sqm.toFixed(2)}sqm in ${auditResult.zone_name}`);

        // EVIDENCE LOCKING
        const evidenceHash = generateCanonicalHash({
            lat: lat,
            lng: lng,
            timestamp: scene.timestamp,
            law_section: auditResult.section,
            ai_confidence: analysis.ai_confidence
        });

        const txResult = await pushToBlockchain(evidenceHash);

        // 5. State Management
        const { error } = await supabase
            .from('detections')
            .insert({
                lat: lat,
                lng: lng,
                detected_at: scene.timestamp,
                confidence: analysis.ai_confidence,
                status: 'VERIFIED',
                zone_name: auditResult.zone_name,
                violation_type: `Illegal ${analysis.material} Construction`,
                article: `Detected via Fusion (SAR ${analysis.sar_backscatter}dB + Optical)`,
                section: auditResult.section,
                severity: "CRITICAL", // Fusion confirmed means high certainty
                image_url: scene.layers.sentinel2_optical.url, // Prefer optical for visual
                penalty_type: "Immediate Action (DRDO Verified)",
                jurisdiction: "Supreme Court / NGT",
                transaction_hash: txResult.txHash,
                evidence_hash: evidenceHash
            });

        if (error) console.error('[Orchestrator] Failed to save to Supabase:', error);

        return {
            status: 'VERIFIED',
            verdict: auditResult,
            confidence: analysis.ai_confidence,
            message: `Encroachment detected: ${analysis.material}`,
            txHash: txResult.txHash,
            encroachment_area: auditResult.area_sqm,
            source_breakdown: {
                sar: scene.layers.sentinel1_sar.metadata,
                optical: scene.layers.sentinel2_optical.metadata
            }
        };
    } else {
        return {
            status: 'IGNORED',
            confidence: analysis.ai_confidence,
            message: 'Man-made structure detected but compliant (No Encroachment)'
        };
    }
};

/**
 * Legacy Adapter for backward compatibility if needed, 
 * but we should move to processFusedScene.
 */
export const processSatelliteScene = async (t0: any, t1: any) => {
    // Deprecated wrapper
    return { status: 'IGNORED', message: 'Use processFusedScene' };
};
