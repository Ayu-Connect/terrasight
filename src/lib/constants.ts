export const STATE_BOUNDS = {
    DELHI: {
        name: "NCT of Delhi",
        code: "DELHI",
        // [West, South, East, North]
        bbox: [76.8425, 28.4045, 77.3477, 28.8837] as [number, number, number, number],
        center: [77.2090, 28.6139] as [number, number]
    },
    UP: {
        name: "Uttar Pradesh",
        code: "UP",
        // Approximate BBox for visual flyTo (focusing on central/major region to avoid too wide zoom)
        // Full UP is huge, let's focus on a significant portion or the whole state.
        bbox: [77.086, 23.869, 84.628, 31.470] as [number, number, number, number],
        center: [80.9462, 26.8467] as [number, number]
    }
};

// MapLibre compatible color for violations
export const VIOLATION_COLOR = "#FF0000"; // Neon Red
