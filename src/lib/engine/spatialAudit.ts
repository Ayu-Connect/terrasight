import intersect from '@turf/intersect';
import area from '@turf/area';
import { checkGeoCompliance } from '../governance/moat'; // Or moat_db if migrating
import cadastralData from '../../data/mock_cadastral_data.json';
import { polygon } from '@turf/helpers';

interface AuditResult {
    isEncroachment: boolean;
    area_sqm: number;
    overlap_percentage: number;
    law_violation: string;
    zone_name: string;
    section: string;
    severity: string;
}

/**
 * The "Kabja" Detector
 * Performs a precise spatial intersection Audit.
 * @param detectedPolyGeoJSON - The GeoJSON Polygon of the detected structure
 */
export const performSpatialAudit = async (detectedPolyGeoJSON: any): Promise<AuditResult> => {

    // Default Result
    let result: AuditResult = {
        isEncroachment: false,
        area_sqm: 0,
        overlap_percentage: 0,
        law_violation: "None",
        zone_name: "Unregulated",
        section: "N/A",
        severity: "INFO"
    };

    // Calculate area of the detected structure itself
    const structureArea = area(detectedPolyGeoJSON);

    // Iterate through protected zones
    // In a real DB scenario, we would use PostGIS ST_Intersects logic here 
    // or fetch relevant polygons first. For now, iterating mock data.
    for (const feature of cadastralData.features) {
        if (!feature.geometry || feature.geometry.type !== 'Polygon') continue;

        // Calculate Intersection
        // turf.intersect takes two Feature<Polygon> or Geometry objects
        const intersection = intersect(detectedPolyGeoJSON, feature as any);

        if (intersection) {
            // Overlap detected!
            const overlapArea = area(intersection);
            const percentage = (overlapArea / structureArea) * 100;

            if (overlapArea > 0) {
                const props = feature.properties;

                // Prioritize the most severe violation if multiple zones overlap (simplification)
                // or just return the first hit.
                result = {
                    isEncroachment: true,
                    area_sqm: overlapArea,
                    overlap_percentage: percentage,
                    law_violation: props.law,
                    zone_name: props.name,
                    section: props.section,
                    severity: props.severity
                };

                // Break on first violation for now
                break;
            }
        }
    }

    return result;
};
