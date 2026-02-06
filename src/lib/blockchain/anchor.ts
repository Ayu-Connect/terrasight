
import { ethers } from 'ethers';

/**
 * ANCHOR SERVICE (Blockchain Integrity)
 * Generates an immutable cryptographic hash of the evidence.
 * Simulates "Anchoring" by returning a hash that would be put on-chain.
 */

export interface AnchorRecord {
    hash: string;
    timestamp: number;
    metadata: string; // JSON string of the evidence
}

/**
 * Generates a Keccak-256 Hash of the critical evidence data.
 * This represents the "Fingerprint" of the crime scene that cannot be altered.
 * 
 * @param lat Latitude
 * @param lng Longitude
 * @param satelliteSource e.g. "SENTINEL-1"
 * @param violationType e.g. "FOREST_ACT_SECTION_2"
 * @param classificationConfidence e.g. 0.98
 */
export const anchorEvidence = async (
    lat: number,
    lng: number,
    satelliteSource: string,
    violationType: string,
    classificationConfidence: number
): Promise<AnchorRecord> => {

    // 1. Construct the Evidence Payload
    const evidence = {
        location: { lat, lng },
        source: satelliteSource,
        violation: violationType,
        confidence: classificationConfidence,
        timestamp: Date.now(),
        // Add a "salt" or random nonce if needed, but timestamp acts as uniqueifier usually
        nonce: Math.random().toString(36).substring(7)
    };

    const metadata = JSON.stringify(evidence);

    // 2. Cryptographic Hashing (The "Seal")
    // Using Ethers.js keccak256
    // We confirm the data integrity
    const hash = ethers.keccak256(ethers.toUtf8Bytes(metadata));

    console.log(`[Blockchain] Evidence Anchored: ${hash}`);

    // 3. Return the Record (To be stored in Supabase 'detections' table)
    return {
        hash,
        timestamp: evidence.timestamp,
        metadata
    };
};
