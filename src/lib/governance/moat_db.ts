import { supabase } from '../supabase/client';
import { LegalVerdict } from './moat';

/**
 * checkGeoComplianceDB - The "Ideal" Implementation
 * 
 * Why Ideal?
 * 1. Performance: The 'ST_Intersects' query runs in milliseconds on the DB server, 
 *    even if you have millions of polygons (thanks to R-Tree indexing).
 * 2. Security: The full map of protected assets isn't sent to the client.
 * 3. Freshness: Updates to laws/zones are live instantly without redeploying the app.
 */
export const checkGeoComplianceDB = async (lat: number, lng: number): Promise<LegalVerdict> => {

    const { data, error } = await supabase
        .rpc('check_geo_compliance', { lat, lng });

    if (error) {
        console.error("Governance RPC Error:", error);
        // Fallback or potentially THROW error depending on strictness
        return {
            isViolation: false,
            law: "Error",
            article: "N/A",
            section: "N/A",
            severity: "INFO",
            zone: "System Error",
            penalty_type: "None",
            jurisdiction: "N/A"
        };
    }

    // RPC returns an array (set of rows), take the first one
    const result = data && data[0] ? data[0] : null;

    if (result && result.is_violation) {
        return {
            isViolation: true,
            law: result.law,
            article: result.article || "N/A", // Ensure RPC returns this if needed
            section: result.section,
            severity: result.severity,
            zone: result.zone_name,
            penalty_type: "Immediate Action",
            jurisdiction: result.jurisdiction
        };
    }

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
