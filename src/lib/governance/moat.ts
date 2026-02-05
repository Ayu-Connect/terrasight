import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import buffer from '@turf/buffer';
import cadastralData from '../../data/mock_cadastral_data.json';

// Define the return type structure explicitly as requested
export interface LegalVerdict {
    isViolation: boolean;
    law: string;
    article: string;
    section: string;
    severity: 'CRITICAL' | 'HIGH' | 'INFO';
    zone: string;
    penalty_type: string;
    jurisdiction: string;
}

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

        // Cast feature to any to bypass strict GeoJSON type mismatches
        const poly = feature as any;

        // 1. Direct Intersection Check
        if (booleanPointInPolygon(pt, poly)) {
            const props = feature.properties;
            return {
                isViolation: true,
                law: props.law,
                article: props.article || "N/A",
                section: props.section,
                severity: props.severity as 'CRITICAL' | 'HIGH',
                zone: props.name,
                penalty_type: "Immediate Sealing",
                jurisdiction: "Supreme Court of India"
            };
        }

        // 2. Buffer Zone Check (100m)
        // buffer(geo, radius, { units: 'kilometers' }) -> 0.1km = 100m
        const bufferedPoly = buffer(poly, 0.1, { units: 'kilometers' });
        if (bufferedPoly && booleanPointInPolygon(pt, bufferedPoly)) {
            const props = feature.properties;
            // If outside the core zone but inside buffer, it's HIGH RISK
            return {
                isViolation: true,
                law: props.law,
                article: `${props.article} (Buffer Zone)`,
                section: `${props.section} - 100m Buffer`,
                severity: 'HIGH', // Downgraded from potentially CRITICAL
                zone: `${props.name} (Buffer)`,
                penalty_type: "Notice & Fine",
                jurisdiction: "Local Magistrate"
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
    };
};
