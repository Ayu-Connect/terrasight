export const ingestData = async () => {
    // Simulate delay for "fetching"
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
        sentinel1: {
            id: "S1A_IW_GRDH_1SDV_20260204_SAR",
            timestamp: new Date().toISOString(),
            mode: "Interferometric Wide Swath",
            polarization: "VV+VH"
        },
        sentinel2: {
            id: "S2B_MSIL2A_20250204_OPTICAL",
            timestamp: "2025-02-04T10:00:00Z",
            cloudCover: 0.05
        },
        status: "CO_REGISTRATION_COMPLETE"
    };
};
