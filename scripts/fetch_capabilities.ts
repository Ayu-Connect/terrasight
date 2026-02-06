
import https from 'https';

const URL = "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms?service=WMS&request=GetCapabilities";

https.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log("Response Length:", data.length);
        // Regex to find all layer names
        const allLayers = [...data.matchAll(/<Name>([^<]+)<\/Name>/g)].map(m => m[1]);

        console.log(`\nTotal Layers Found: ${allLayers.length}`);

        // Filter for specific keywords relevant to our use case
        const usefulLayers = allLayers.filter(name =>
            name.includes("LULC") ||
            name.includes("Cadastral") ||
            name.includes("DISTRICT") ||
            name.includes("STATE")
        );

        if (usefulLayers.length > 0) {
            console.log("\n✅ RELEVANT LAYERS FOUND:");
            console.log(usefulLayers.slice(0, 20).join('\n'));
        } else {
            console.log("\n⚠️ No exact LULC/Cadastral match. Listing first 10 generic layers:");
            console.log(allLayers.slice(0, 10).join('\n'));
        }
    });
}).on('error', (e) => {
    console.error("Error:", e.message);
});
