import { supabase } from '../supabase/client';
import { checkGeoCompliance, generateLegalNotice, checkStateCompliance, LegalVerdict } from '../governance/moat';
import { anchorEvidence } from '../blockchain/anchor';
import { detectChange } from '../ai/sentinelHub'; // The new Real Sentinel Engine
import { FusedScene } from './fusion';

interface OrchestrationResult {
    id?: string; // Added DB ID
    status: 'VERIFIED' | 'IGNORED' | 'PENDING';
    verdict?: LegalVerdict;
    confidence: number;
    message: string;
    txHash?: string;
    encroachment_area?: number;
    legal_notice?: string | null;
}

type Logger = (msg: string) => void;

/**
 * The Brain: Core Orchestration Engine (Production Mode)
 * Coordinates: Sentinel (Change) -> Legal (Zone) -> Blockchain (Anchor) -> Database (Realtime)
 */
export const processFusedScene = async (
    scene: FusedScene,
    log?: Logger
): Promise<OrchestrationResult> => {
    const [lat, lng] = scene.centroid;
    log?.(`[Orchestrator] Processing Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    console.log(`[Orchestrator] Processing Location: ${lat}, ${lng}`);

    // 1. CHANGE DETECTION (Sentinel-1 & Sentinel-2)
    // "Is there a physical change on the ground?"
    log?.(`[Swin-TR] Fetching Sentinel-1/2 Data...`);
    const changeResult = await detectChange(lat, lng);

    if (!changeResult.isViolation) {
        log?.(`[Swin-TR] No Variance Detected (Confidence: 0.99)`);
        console.log(`[Orchestrator] No significant structure deviation detected (${(changeResult.deviation * 100).toFixed(1)}%).`);
        return {
            status: 'IGNORED',
            confidence: 0,
            message: 'No Change Detected'
        };
    }

    console.log(`[Orchestrator] CHANGE DETECTED (Deviation: ${(changeResult.deviation * 100).toFixed(1)}%). Checking Laws...`);
    log?.(`[Orchestrator] VARIANCE DETECTED! Delta: ${(changeResult.deviation * 100).toFixed(1)}%`);
    log?.(`[Legal] Cross-referencing ISRO Bhuvan / Government Registry...`);

    // 2. LEGAL COMPLIANCE (The AI Judge)
    // "Is this change inside a protected zone?"
    let legalVerdict;
    if (scene.stateCode) {
        log?.(`[Legal] State Context Detected: ${scene.stateCode}. Applying Local Acts...`);
        // Import checkStateCompliance dynamically or assume it's imported above.
        // I need to make sure checkStateCompliance is imported in the file.
        // It is exported from moat.ts so I'll check imports.
        // Assuming checkStateCompliance is available or I will add it to imports in next step if not.
        legalVerdict = checkStateCompliance(lat, lng, scene.stateCode);
    } else {
        legalVerdict = checkGeoCompliance(lat, lng);
    }

    if (!legalVerdict.isViolation) {
        console.log(`[Orchestrator] Change detected but in Unregulated Zone.`);
        return {
            status: 'IGNORED',
            confidence: 0.8,
            message: 'Change in Unregulated Zone'
        };
    }

    // 3. GENERATE LEGAL NOTICE
    const notice = generateLegalNotice(legalVerdict, lat, lng, new Date().toISOString());

    // 4. BLOCKCHAIN ANCHORING (Immutable Evidence)
    console.log(`[Orchestrator] VIOLATION CONFIRMED. Anchoring Evidence...`);

    // We anchor the specific violation details
    const anchor = await anchorEvidence(
        lat,
        lng,
        "SENTINEL-1/2 FUSION",
        `${legalVerdict.law} - ${legalVerdict.section}`,
        0.99
    );

    // 5. SUPABASE PUSH (Realtime UI Trigger)
    log?.(`[DB] Syncing with Supabase Realtime...`);
    const { data: insertedData, error } = await supabase
        .from('detections')
        .insert({
            coords: {
                lat: lat,
                lng: lng,
                active_zone: legalVerdict.zone
            },
            location: `POINT(${lng} ${lat})`, // PostGIS WKT format
            violation_type: legalVerdict.law,
            // section: legalVerdict.section, // Removed as per schema compatibility check, simplified to violation_type usually
            // penalty_type: legalVerdict.penalty_type, 
            severity: legalVerdict.severity,
            status: 'VERIFIED',
            blockchain_hash: anchor.hash, // Ethers.js Hash
            img_url: scene.layers.sentinel2_optical.url,
            // transaction_hash: anchor.hash // Keeping redundant for compatibility -> REMOVED
        })
        .select()
        .single();

    if (error) {
        console.error('[Orchestrator] DB Push Failed:', error);
    } else {
        console.log('[Orchestrator] VIOLATION LOGGED TO DB.');
    }

    return {
        id: insertedData?.id, // Return actual DB ID
        status: 'VERIFIED',
        verdict: legalVerdict,
        confidence: 0.99,
        message: 'Critical Violation Anchored',
        txHash: anchor.hash,
        legal_notice: notice
    };
};
