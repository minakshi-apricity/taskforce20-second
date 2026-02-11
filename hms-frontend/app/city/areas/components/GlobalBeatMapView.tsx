'use client';

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, Map as MapIcon, Layers, Info } from "lucide-react";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });

const COLORS = [
    "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444",
    "#06b6d4", "#ec4899", "#6366f1", "#f97316", "#84cc16"
];

function FitAllBounds({ beats }: { beats: any[] }) {
    const { useMap } = require("react-leaflet");
    const map = useMap();

    useEffect(() => {
        if (beats.length > 0 && map) {
            const L = require("leaflet");
            const group = new L.FeatureGroup();

            beats.forEach(beat => {
                if (beat.geometry) {
                    try {
                        const layer = L.geoJSON(beat.geometry);
                        group.addLayer(layer);
                    } catch (e) {
                        console.error("Invalid geometry for beat", beat.id);
                    }
                }
            });

            if (group.getLayers().length > 0) {
                map.fitBounds(group.getBounds(), { padding: [50, 50] });
            }
        }
    }, [beats, map]);

    return null;
}

export default function GlobalBeatMapView({ beats }: { beats: any[] }) {
    const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
    const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);

    const beatsWithGeom = useMemo(() => beats.filter(b => b.geometry), [beats]);

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden", height: "600px", position: "relative", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            {/* Overlay Header */}
            <div style={{
                position: "absolute", top: "20px", left: "20px", zIndex: 1000,
                display: "flex", flexDirection: "column", gap: "10px"
            }}>
                <div style={{
                    backgroundColor: "white", padding: "12px 16px", borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px"
                }}>
                    <div style={{ backgroundColor: "#eff6ff", padding: "8px", borderRadius: "8px" }}>
                        <MapIcon size={18} color="#2563eb" />
                    </div>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>Beat Fleet View</div>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Monitoring {beatsWithGeom.length} active routes</div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: "white", padding: "4px", borderRadius: "10px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    border: "1px solid #f1f5f9", display: "flex"
                }}>
                    {(["streets", "satellite"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setMapType(t)}
                            style={{
                                padding: "6px 12px", borderRadius: "7px", border: "none",
                                fontSize: "11px", fontWeight: 700, textTransform: "capitalize",
                                backgroundColor: mapType === t ? "#f1f5f9" : "transparent",
                                color: mapType === t ? "#2563eb" : "#64748b",
                                cursor: "pointer", transition: "all 0.2s"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: "100%", width: "100%", background: "#f8fafc" }}
            >
                {mapType === "streets" ? (
                    <TileLayer
                        attribution='&copy; CARTO'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                ) : (
                    <TileLayer
                        attribution='Google'
                        url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    />
                )}

                {beatsWithGeom.map((beat, idx) => {
                    const color = COLORS[idx % COLORS.length];
                    const isSelected = selectedBeatId === beat.id;

                    return (
                        <GeoJSON
                            key={beat.id}
                            data={beat.geometry}
                            style={{
                                color: isSelected ? "#000" : color,
                                weight: isSelected ? 6 : 4,
                                opacity: 0.8,
                                fillOpacity: 0.2
                            }}
                            onEachFeature={(feature, layer) => {
                                layer.on('click', () => setSelectedBeatId(beat.id));
                                layer.bindPopup(`
                                    <div style="font-family: 'Inter', sans-serif; padding: 4px;">
                                        <div style="font-weight: 800; color: #1e293b; font-size: 14px;">${beat.beatName}</div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                                            ${beat.zoneName} • ${beat.wardName}
                                        </div>
                                        <div style="margin-top: 8px; font-weight: 600; color: #2563eb; font-size: 12px;">
                                            ${beat.assignedToName || 'Unassigned'}
                                        </div>
                                    </div>
                                `);
                            }}
                        />
                    );
                })}

                <FitAllBounds beats={beatsWithGeom} />
            </MapContainer>

            {/* Bottom Info Bar */}
            <div style={{
                position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)",
                zIndex: 1000, backgroundColor: "white", padding: "10px 20px", borderRadius: "100px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #f1f5f9",
                display: "flex", gap: "20px", alignItems: "center"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Info size={14} color="#3b82f6" />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Click a route to view details</span>
                </div>
            </div>
        </div>
    );
}
