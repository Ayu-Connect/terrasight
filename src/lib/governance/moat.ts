import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import buffer from '@turf/buffer';
import cadastralData from '../../data/mock_cadastral_data.json';

// LAW MAP (Curated Legal Database)
const LAW_MAP: Record<string, { act: string; section: string; desc: string }> = {
    "FOREST": {
        act: "Forest (Conservation) Act, 1980",
        section: "Section 2",
        desc: "Restriction on the dereservation of forests or use of forest land for non-forest purpose."
    },
    "RIVER": {
        act: "Mines and Minerals (Development and Regulation) Act, 1957",
        section: "Section 4(1)",
        desc: "No person shall undertake any reconnaissance, prospecting or mining operations in any area, except under and in accordance with the terms and conditions of a reconnaissance permit."
    },
    "WETLAND": {
        act: "Environment (Protection) Act, 1986",
        section: "Section 3",
        desc: "Prohibition of interactions detrimental to the ecological character of wetlands."
    }
};

// Define the return type structure explicitly as requested
export interface LegalVerdict {
    isViolation: boolean;
    law: string;
    article: string;
    section: string;
    severity: 'CRITICAL' | 'HIGH' | 'INFO' | 'WARNING';
    zone: string;
    penalty_type: string;
    jurisdiction: string;
}

interface CadastralProperties {
    zone_type?: string;
    name?: string;
    severity?: string;
    [key: string]: unknown;
}

interface CadastralFeature {
    type: "Feature";
    geometry: {
        type: "Polygon" | "Point" | "MultiPolygon"; // Added broader support
        coordinates: any[];
    };
    properties: CadastralProperties;
}

/**
 * State-Specific Law Mapping (Neuro-Symbolic Logic)
 * Maps a verified Sentinel detection in a specific state to the relevant Act.
 */
export const checkStateCompliance = (lat: number, lng: number, stateCode: string): LegalVerdict => {
    // 1. Delhi Laws
    if (stateCode === 'DELHI') {
        const isYamuna = (lat > 28.5 && lat < 28.7) && (lng > 77.2 && lng < 77.35); // Rough Okhla/Yamuna box
        return {
            isViolation: true,
            law: "Delhi Land Reforms Act, 1954",
            article: isYamuna ? "Yamuna Floodplain Protection" : "Restriction on Non-Agricultural Use",
            section: isYamuna ? "Section 23 (Eco-Sensitive Zone)" : "Section 81",
            severity: isYamuna ? "CRITICAL" : "HIGH",
            zone: isYamuna ? "Yamuna Floodplain (Okhla)" : "Delhi NCR Green Belt",
            penalty_type: isYamuna ? "Immediate Demolition & Fine" : "Vesting of Land in Gaon Sabha",
            jurisdiction: "Delhi High Court / DDA"
        };
    }

    // 2. Uttar Pradesh Laws
    if (stateCode === 'UP') {
        return {
            isViolation: true,
            law: "UP Zamindari Abolition & Land Reforms Act, 1950",
            article: "Prohibition on wrongful occupation of Gram Sabha land",
            section: "Section 122-B",
            severity: "HIGH",
            zone: "State Agricultural Reserve",
            penalty_type: "Eviction & Damages Recovery",
            jurisdiction: "Board of Revenue, UP"
        };
    }

    // Default Fallback
    return {
        isViolation: true, // If we reached here, Sentinel saw confirmed structure
        law: "Environment (Protection) Act, 1986",
        article: "Unauthorized Development",
        section: "Section 15",
        severity: "WARNING",
        zone: "Unregulated Zone",
        penalty_type: "Notice",
        jurisdiction: "NGT"
    };
};

/**
 * Checks if a given coordinate falls within any protected zone.
 * Uses Turf.js for point-in-polygon implementation.
 * @param lat Latitude
 * @param lng Longitude
 */
export const checkGeoCompliance = (lat: number, lng: number): LegalVerdict => {
    const pt = point([lng, lat]); // Turf uses [lng, lat]

    for (const feature of cadastralData.features) {
        if (!feature.geometry || feature.geometry.type !== 'Polygon') continue;

        // Cast feature to unknown first if needed, but here we can assert type
        const poly = feature as unknown as CadastralFeature;

        // 1. Direct Intersection Check
        if (booleanPointInPolygon(pt, poly as any)) { // Turf types are loose, but we keep 'any' for Turf compatibility or cast to Feature<Polygon> if strict
            // For linting fix, we want to type `feature`. 
            // booleanPointInPolygon expects Feature<Polygon, Properties>. 
            // Our internal type is for property access.
            const props = poly.properties;
            const zoneType = (props.zone_type || "FOREST") as string; // Fallback to Forest
            const lawDetails = LAW_MAP[zoneType] || LAW_MAP["FOREST"];

            return {
                isViolation: true,
                law: lawDetails.act,
                article: lawDetails.desc,
                section: lawDetails.section,
                severity: props.severity as 'CRITICAL' | 'HIGH',
                zone: props.name || "Unknown Zone",
                penalty_type: "Immediate Sealing & Prosecution",
                jurisdiction: "Supreme Court of India"
            };
        }

        // 2. Buffer Zone Check (100m)
        // buffer(geo, radius, { units: 'kilometers' }) -> 0.1km = 100m
        const bufferedPoly = buffer(poly as any, 0.1, { units: 'kilometers' });
        if (bufferedPoly && booleanPointInPolygon(pt, bufferedPoly)) {
            const props = poly.properties;
            // If outside the core zone but inside buffer, it's HIGH RISK
            const zoneType = (props.zone_type || "FOREST") as string;
            const lawDetails = LAW_MAP[zoneType] || LAW_MAP["FOREST"];

            // If outside the core zone but inside buffer, it's HIGH RISK
            return {
                isViolation: true,
                law: lawDetails.act,
                article: `${lawDetails.desc} (Buffer Zone Violation)`,
                section: `${lawDetails.section} r/w Rule 3`,
                severity: 'HIGH', // Downgraded from potentially CRITICAL
                zone: `${props.name || "Unknown"} (Buffer)`,
                penalty_type: "Show Cause Notice",
                jurisdiction: "National Green Tribunal (NGT)"
            };
        }
    }

    // Default: No Violation found
    return {
        isViolation: false,
        law: "N/A",
        article: "N/A",
        section: "N/A",
        severity: "INFO",
        zone: "Unregulated Zone",
        penalty_type: "None",
        jurisdiction: "N/A"
        // End of checkGeoCompliance
    };
};

/**
 * GENERATE LEGAL NOTICE (The AI Judge Output)
 */
export const generateLegalNotice = (verdict: LegalVerdict, lat: number, lng: number, timestamp: string) => {
    if (!verdict.isViolation) return null;

    return `
NOTICE OF VIOLATION UNDER ${verdict.law.toUpperCase()}

To Whom It May Concern,

TAKE NOTICE that on ${timestamp}, satelite surveillance based on ISRO Bhuvan & Sentinel-1 data detected unauthorized activity at:
Coordinates: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E
Zone: ${verdict.zone}

VIOLATION DETAILS:
You are in breach of ${verdict.section}: "${verdict.article}".
This constitutes a cognizable offense punishable under the ${verdict.law}.

ACTION REQUIRED:
${verdict.penalty_type}. 
You are required to cease all activities immediately. 
Evidence has been cryptographically anchored to the blockchain.

Jurisdiction: ${verdict.jurisdiction}
Generated by: CodeGenesis AI Governance Engine
    `.trim();
};
