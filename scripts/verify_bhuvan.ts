
/**
 * scripts/verify_bhuvan.ts
 * 
 * CI/CD Verification Script for ISRO Bhuvan Proxy.
 * Tests if the upstream WMS server accepts our headers and returns a valid image.
 */



const BHUVAN_WMS = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";

// Trusted Headers to spoof a browser
const PROXY_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://bhuvan.nrsc.gov.in/',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Dest': 'image'
};

const TEST_PARAMS = new URLSearchParams({
    service: 'WMS',
    request: 'GetMap',
    layers: 'basemap:DL_LULC',
    styles: '',
    format: 'image/png',
    transparent: 'true',
    version: '1.1.1',
    width: '256',
    height: '256',
    srs: 'EPSG:3857',
    bbox: '8687799.4243,2661231.5767,8726939.1171,2700371.2695' // Somewhere in India
});

async function verifyBhuvan() {
    console.log("🛰️ INITIALIZING SATELLITE LINK [ISRO BHUVAN]...");
    console.log(`🔗 Target: ${BHUVAN_WMS}`);

    try {
        const url = `${BHUVAN_WMS}?${TEST_PARAMS.toString()}`;
        console.log("🔄 Sending Request...");

        const startTime = Date.now();
        const res = await fetch(url, { headers: PROXY_HEADERS });
        const latency = Date.now() - startTime;

        console.log(`⏱️ Latency: ${latency}ms`);
        console.log(`📡 Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            throw new Error(`Upstream Rejected: ${res.status}`);
        }

        const type = res.headers.get('content-type');
        console.log(`📦 Content-Type: ${type}`);

        if (!type?.startsWith('image/')) {
            const txt = await res.text();
            console.error("❌ FAILED: Received non-image payload.");
            console.error("Context:", txt.slice(0, 500));
            process.exit(1);
        }

        console.log("✅ SUCCESS: Valid Image Stream Received.");
        process.exit(0);

    } catch (e: any) {
        console.error("❌ CONNECTION FAILURE:", e.message);
        process.exit(1);
    }
}

verifyBhuvan();
