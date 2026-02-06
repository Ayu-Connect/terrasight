"use client";

import { useState, useEffect } from "react";
import Map, { NavigationControl, useControl, Source, Layer } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";
import type { MapboxOverlay as MapboxOverlayType } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMission, Alert } from "@/context/MissionContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeckGLOverlay(props: any) {
    const overlay = useControl<MapboxOverlayType>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
}

interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number;
}

export default function SpatialMap() {
    const { alerts, activeTarget, activeState } = useMission();
    const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

    const [viewState, setViewState] = useState<ViewState>({
        longitude: 77.2090,
        latitude: 28.6139,
        zoom: 13,
        pitch: 60, // 3D View
        bearing: -20,
    });

    useEffect(() => {
        if (activeTarget) {
            setViewState(prev => ({
                ...prev,
                longitude: activeTarget.coordinates[0],
                latitude: activeTarget.coordinates[1],
                zoom: 16,
                pitch: 60,
                transitionDuration: 2000,
            }));
        } else if (activeState) {
            if (activeState.bbox) {
                // Use fitBounds for state
                // We need access to the map instance. `useControl` isn't quite right for just accessing the map instance in this library usually.
                // React Map GL exposes `current` on a ref passed to <Map>, or we can just set ViewState closely.
                // For simplicity in this controlled component, let's just calculate center/zoom or use the predefined ones.
                // But fitBounds is better. 
                // Since this is a "Controlled" map (viewState prop), we can't easily use map.fitBounds() without updating viewState manually.
                // We will rely on the `coordinates` and `zoom` from constants which are now well-defined.
                setViewState(prev => ({
                    ...prev,
                    longitude: activeState.coordinates[0], // Note: Fixed to [lng, lat] in constants
                    latitude: activeState.coordinates[1],
                    zoom: activeState.zoom,
                    pitch: 60,
                    transitionDuration: 2000,
                }));
            } else {
                setViewState(prev => ({
                    ...prev,
                    longitude: activeState.coordinates[0],
                    latitude: activeState.coordinates[1],
                    zoom: activeState.zoom,
                    pitch: 60,
                    transitionDuration: 3000,
                }));
            }
        }
    }, [activeTarget, activeState]);

    const layers = [
        new ScatterplotLayer({
            id: 'pulse-layer',
            data: alerts,
            getPosition: (d: Alert) => d.coordinates,
            getRadius: 30, // Smaller radius for 3D scale
            getFillColor: [0, 242, 255, 120],
            getLineColor: [0, 242, 255],
            stroked: true,
            filled: true,
            radiusScale: 2,
            lineWidthMinPixels: 2,
            parameters: { depthTest: false }
        }),
        // ... (Keep ArcLayer if needed, or remove for cleaner sat view)
    ];

    return (
        <div className="w-full h-full relative">
            <Map
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle={`https://api.maptiler.com/maps/hybrid/style.json?key=${mapTilerKey}`}
                terrain={{ source: 'maptiler-terrain', exaggeration: 1.5 }}
            >
                {/* 3D Terrain Source */}
                <Source
                    id="maptiler-terrain"
                    type="raster-dem"
                    url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${mapTilerKey}`}
                    encoding="mapbox"
                    maxzoom={12}
                />

                {/* 3D Buildings Layer */}
                <Source id="openmaptiles" type="vector" url={`https://api.maptiler.com/tiles/v3/tiles.json?key=${mapTilerKey}`}>
                    <Layer
                        id="3d-buildings"
                        source="openmaptiles"
                        source-layer="building"
                        type="fill-extrusion"
                        minzoom={15}
                        paint={{
                            'fill-extrusion-color': '#222', // Dark buildings
                            'fill-extrusion-height': ['get', 'render_height'],
                            'fill-extrusion-base': ['get', 'render_min_height'],
                            'fill-extrusion-opacity': 0.8
                        }}
                    />
                </Source>

                {/* ISRO Bhuvan WMS (The Legal Fence) */}
                <Source
                    id="isro-bhuvan"
                    type="raster"
                    tiles={[
                        // Proxy through our own server to avoid CORS errors. Layers: Cadastral + LULC (Forest)
                        // Added &_v=1 to bust browser cache of previous 502/XML responses
                        "/api/proxy/bhuvan?service=WMS&request=GetMap&layers=basemap:DL_LULC&styles=&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}&_v=1"
                    ]}
                    tileSize={256}
                >
                    <Layer
                        id="isro-layer"
                        type="raster"
                        paint={{
                            "raster-opacity": 0.5, // 0.5 Opacity as requested
                            "raster-hue-rotate": 0
                        }}
                        beforeId="3d-buildings" // Render below buildings
                    />
                </Source>

                {/* Violation Outline Layer (Neon Red) */}
                <Source
                    id="violation-source"
                    type="geojson"
                    data={{
                        type: "FeatureCollection",
                        features: alerts.filter(a => a.legal && a.coordinates).map(a => ({
                            type: "Feature",
                            geometry: {
                                type: "Polygon",
                                coordinates: [[
                                    [a.coordinates[0] - 0.001, a.coordinates[1] - 0.001],
                                    [a.coordinates[0] + 0.001, a.coordinates[1] - 0.001],
                                    [a.coordinates[0] + 0.001, a.coordinates[1] + 0.001],
                                    [a.coordinates[0] - 0.001, a.coordinates[1] + 0.001],
                                    [a.coordinates[0] - 0.001, a.coordinates[1] - 0.001]
                                ]] // Mock 100m box around alert
                            },
                            properties: { ...a }
                        }))
                    }}
                >
                    <Layer
                        id="violation-outline"
                        type="line"
                        paint={{
                            "line-color": "#FF0000",
                            "line-width": 4,
                            "line-blur": 2
                        }}
                    />
                </Source>

                <DeckGLOverlay layers={layers} />
                <NavigationControl position="bottom-right" showCompass={true} showZoom={true} />
            </Map>
        </div>
    );
}
