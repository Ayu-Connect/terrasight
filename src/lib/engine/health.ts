
import { supabase } from '../supabase/client';
import { getAuthToken } from '../ai/sentinelHub';
import { ethers } from 'ethers';

export interface SystemHealth {
    database: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
    satellite: 'LINKED' | 'OFFLINE' | 'SEARCHING';
    blockchain: 'ACTIVE' | 'ERROR';
    latency: number; // ms
    lastChecked: string;
}

export const checkSystemHealth = async (): Promise<SystemHealth> => {
    const start = performance.now();
    let dbStatus: 'ONLINE' | 'OFFLINE' = 'OFFLINE';
    let satStatus: 'LINKED' | 'OFFLINE' = 'OFFLINE';
    let chainStatus: 'ACTIVE' | 'ERROR' = 'ERROR';

    // 1. Check Database (Supabase)
    try {
        const { error } = await supabase.from('detections').select('count', { count: 'exact', head: true });
        if (!error) dbStatus = 'ONLINE';
    } catch (e) {
        console.error("Health Check: DB Failed", e);
    }

    // 2. Check Satellite Link (Sentinel Hub Check)
    try {
        // We check if we can generate a valid auth token (simulating link)
        const token = await getAuthToken();
        if (token) satStatus = 'LINKED';
    } catch (e) {
        console.error("Health Check: Sat Failed", e);
    }

    // 3. Check Blockchain Crypto Engine (Local)
    try {
        const testHash = ethers.keccak256(ethers.toUtf8Bytes("HEALTH_CHECK"));
        if (testHash && testHash.length > 0) chainStatus = 'ACTIVE';
    } catch (e) {
        console.error("Health Check: Crypto Failed", e);
    }

    const latency = Math.round(performance.now() - start);

    return {
        database: dbStatus,
        satellite: satStatus,
        blockchain: chainStatus,
        latency,
        lastChecked: new Date().toISOString()
    };
};
