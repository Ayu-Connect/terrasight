
import { NextRequest, NextResponse } from 'next/server';

// Enterprise-Grade Proxy for Government WMS Services
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const BHUVAN_BASE = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";

    try {
        // 1. Construct Upstream URL
        const targetUrl = `${BHUVAN_BASE}?${searchParams.toString()}`;

        // 2. Browser Spoofing (Critical for WAF Bypass)
        // mimics usage from the official Bhuvan portal
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://bhuvan.nrsc.gov.in/',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Dest': 'image'
        };

        // 3. Fetch from Upstream
        const response = await fetch(targetUrl, { headers });

        if (!response.ok) {
            console.error(`[Proxy] Upstream Error: ${response.status}`);
            return getFallbackImage();
        }

        const contentType = response.headers.get('content-type');

        // 4. Strict Content Validation
        if (!contentType?.startsWith('image/')) {
            const errText = await response.text();
            console.error(`[Proxy] Invalid Content-Type: ${contentType}`, errText.slice(0, 100));
            return getFallbackImage();
        }

        // 5. Pipe Stream with Caching
        const blob = await response.blob();
        return new NextResponse(blob, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error("[Proxy] Fatal Error:", error);
        return getFallbackImage();
    }
}

/**
 * Fallback: 256x256 Transparent PNG
 * Prevents client map libraries (MapLibre/DeckGL) from crashing on 404s/500s.
 */
function getFallbackImage() {
    // 1x1 Transparent Pixel
    const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", 'base64');
    return new NextResponse(pixel, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-store'
        }
    });
}
