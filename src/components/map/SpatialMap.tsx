"use client";

import { useState, useEffect } from "react";
import Map, { NavigationControl, useControl, Source, Layer } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, ArcLayer } from "@deck.gl/layers";
import type { MapboxOverlay as MapboxOverlayType } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMission } from "@/context/MissionContext";

// No Token Needed for MapLibre + Carto
// const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN; 

function DeckGLOverlay(props: any) {
    const overlay = useControl<MapboxOverlayType>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
}

export default function SpatialMap() {
    const { alerts, activeTarget, activeState } = useMission();
    const [viewState, setViewState] = useState({
        longitude: 77.2090,
        latitude: 28.6139,
        zoom: 13,
        pitch: 60,
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
            } as any));
        } else if (activeState) {
            // Fly to State Center
            setViewState(prev => ({
                ...prev,
                longitude: activeState.coordinates[1],
                latitude: activeState.coordinates[0],
                zoom: activeState.zoom,
                pitch: 45,
                transitionDuration: 3000,
            } as any));
        }
    }, [activeTarget, activeState]);

    const layers = [
        new ScatterplotLayer({
            id: 'pulse-layer',
            data: alerts,
            getPosition: (d: any) => d.coordinates,
            getRadius: 200,
            getFillColor: [0, 242, 255],
            getLineColor: [0, 242, 255],
            stroked: true,
            filled: false,
            radiusScale: 6,
            lineWidthMinPixels: 2,
            parameters: {
                depthTest: false
            }
        }),
        new ArcLayer({
            id: 'sat-link',
            data: [{ source: [77.2090, 28.6139], target: [77.2200, 28.6200] }],
            getSourcePosition: (d: any) => [d.source[0], d.source[1], 0],
            getTargetPosition: (d: any) => [d.source[0], d.source[1], 5000],
            getSourceColor: [0, 242, 255, 120],
            getTargetColor: [0, 255, 65, 200],
            getWidth: 2
        })
    ];

    return (
        <div className="w-full h-full relative">
            <Map
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                terrain={{ source: 'terrain-source', exaggeration: 1.5 }}
            >
                <Source
                    id="terrain-source"
                    type="raster-dem"
                    tiles={['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']}
                    encoding="terrarium"
                    tileSize={256}
                    maxzoom={15}
                />

                <DeckGLOverlay layers={layers} />

                <NavigationControl position="bottom-right" showCompass={true} showZoom={true} />
            </Map>
        </div>
    );
}
