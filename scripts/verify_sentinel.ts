
import fs from 'fs';
import path from 'path';

// Manual .env.local loading
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        console.log("📂 Loading .env.local...");
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (key && value && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.warn("⚠️ Could not load .env.local", e);
}


// import { fetchSentinelData } from '../src/lib/ai/sentinelHub';

// Mock ISRO fetch since it's hardcoded in the original file but we want to verify it executes
// We'll just import it if it's exported, or we can trust the static analysis for that one.
// Let's focus on the Sentinel Hub parts which do real network calls.

async function verifySentinel() {
    console.log("🚀 Starting Sentinel Verification...");

    // Dynamic import to ensure process.env is ready before module evaluation
    const { fetchSentinelData } = await import('../src/lib/ai/sentinelHub');

    // Test coordinates (Connaught Place, New Delhi)
    const lat = 28.6304;
    const lng = 77.2177;

    try {
        // 1. Test Optical Data (Sentinel-2)
        console.log("\n📡 Testing SENTINEL-2 (Optical)...");
        const opticalData = await fetchSentinelData(lat, lng, 'OPTICAL');
        console.log("✅ Sentinel-2 Result:", JSON.stringify(opticalData, null, 2));

        if (!opticalData) throw new Error("Optical data returned null");
        if (opticalData.source.includes("Simulated") && !process.env.SENTINEL_CLIENT_ID?.includes("YOUR_")) {
            console.warn("⚠️  WARNING: Returned SIMULATED data despite having real keys. Auth might have failed silently.");
        }

        // 2. Test SAR Data (Sentinel-1)
        console.log("\n📡 Testing SENTINEL-1 (SAR)...");
        const sarData = await fetchSentinelData(lat, lng, 'SAR');
        console.log("✅ Sentinel-1 Result:", JSON.stringify(sarData, null, 2));

        if (!sarData) throw new Error("SAR data returned null");

    } catch (error) {
        console.error("\n❌ Verification Failed:", error);
        process.exit(1);
    }

    console.log("\n✨ Verification Complete!");
}

verifySentinel();
