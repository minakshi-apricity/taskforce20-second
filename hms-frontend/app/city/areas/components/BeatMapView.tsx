"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { X } from "lucide-react";

// Dynamic imports for Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

// Helper component to fit bounds
function FitBounds({ geometry }: { geometry: any }) {
    const { useMap } = require("react-leaflet");
    const map = useMap();
    useEffect(() => {
        if (geometry && map) {
            const L = require("leaflet");
            const geoLayer = L.geoJSON(geometry);
            map.fitBounds(geoLayer.getBounds(), { padding: [50, 50] });
        }
    }, [geometry, map]);
    return null;
}

interface BeatMapViewProps {
    beat: any;
    onClose: () => void;
}

const VIBRANT_COLORS = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#06b6d4", "#ec4899", "#6366f1", "#f97316", "#84cc16"
];

const getFeatureColor = (feature: any) => {
    const name = feature.properties?.name || "";
    let hash = 0;
    if (name) {
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
    } else {
        const coords = JSON.stringify(feature.geometry.coordinates);
        for (let i = 0; i < Math.min(coords.length, 50); i++) {
            hash = coords.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    return VIBRANT_COLORS[Math.abs(hash) % VIBRANT_COLORS.length];
};

export default function BeatMapView({ beat, onClose }: BeatMapViewProps) {
    const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

    if (!beat.geometry) {
        return (
            <div style={{
                position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
                display: "flex", justifyContent: "center", alignItems: "center"
            }}>
                <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", textAlign: "center" }}>
                    <p>This beat has no geometry data.</p>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    const features = beat.geometry?.features || [];

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.8)", zIndex: 1000,
            display: "flex", justifyContent: "center", alignItems: "center",
            backdropFilter: "blur(8px)"
        }}>
            <div style={{
                width: "95%", maxWidth: "1400px", height: "90vh",
                backgroundColor: "white", borderRadius: "24px", overflow: "hidden",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}>
                {/* Transparent Glassmorphism Header */}
                <div style={{
                    padding: "20px 32px",
                    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    zIndex: 10
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ backgroundColor: "#2563eb", width: "4px", height: "24px", borderRadius: "2px" }} />
                            <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                                {beat.beatName} <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "1rem", marginLeft: "8px" }}>Interactive Beat Map</span>
                            </h3>
                        </div>
                        <p style={{ margin: "4px 0 0 16px", fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>
                            {beat.zoneName} • {beat.wardName} • {beat.areaName}
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{
                            display: "flex",
                            backgroundColor: "#f1f5f9",
                            padding: "4px",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0"
                        }}>
                            <button
                                onClick={() => setMapType("streets")}
                                style={{
                                    padding: "6px 16px", borderRadius: "8px", border: "none", fontSize: "0.75rem", fontWeight: 600,
                                    backgroundColor: mapType === "streets" ? "white" : "transparent",
                                    color: mapType === "streets" ? "#2563eb" : "#64748b",
                                    boxShadow: mapType === "streets" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                Streets
                            </button>
                            <button
                                onClick={() => setMapType("satellite")}
                                style={{
                                    padding: "6px 16px", borderRadius: "8px", border: "none", fontSize: "0.75rem", fontWeight: 600,
                                    backgroundColor: mapType === "satellite" ? "white" : "transparent",
                                    color: mapType === "satellite" ? "#2563eb" : "#64748b",
                                    boxShadow: mapType === "satellite" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                Satellite
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                width: "40px", height: "40px", borderRadius: "12px", border: "none",
                                backgroundColor: "#f1f5f9", color: "#0f172a", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                    {/* Feature List Side Panel */}
                    <div style={{
                        width: "320px",
                        borderRight: "1px solid #f1f5f9",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#fff"
                    }}>
                        <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                            <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Components ({features.length})
                            </h4>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                            {features.map((f: any, i: number) => {
                                const featureId = f.properties?.name || `feat-${i}`;
                                const color = getFeatureColor(f);
                                const isHovered = hoveredFeature === featureId;

                                return (
                                    <div
                                        key={i}
                                        onMouseEnter={() => setHoveredFeature(featureId)}
                                        onMouseLeave={() => setHoveredFeature(null)}
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: "12px",
                                            marginBottom: "8px",
                                            cursor: "pointer",
                                            backgroundColor: isHovered ? "#eff6ff" : "white",
                                            border: "1px solid",
                                            borderColor: isHovered ? "#bfdbfe" : "transparent",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: color }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                                                    {f.properties?.name || `Feature #${i + 1}`}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                    {f.geometry?.type}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Map Section */}
                    <div style={{ flex: 1, position: "relative" }}>
                        <MapContainer
                            center={[20.5937, 78.9629]}
                            zoom={5}
                            zoomControl={false} // Custom zoom control position
                            style={{ height: "100%", width: "100%" }}
                        >
                            <div className="leaflet-top leaflet-right" style={{ marginTop: "16px", marginRight: "16px" }}>
                                <div className="leaflet-control leaflet-bar" style={{ border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                    <button onClick={() => { }} style={{ backgroundColor: "white", width: "36px", height: "36px", border: "none", borderBottom: "1px solid #f1f5f9", borderRadius: "8px 8px 0 0", fontSize: "20px", cursor: "pointer" }}>+</button>
                                    <button onClick={() => { }} style={{ backgroundColor: "white", width: "36px", height: "36px", border: "none", borderRadius: "0 0 8px 8px", fontSize: "24px", cursor: "pointer" }}>-</button>
                                </div>
                            </div>

                            {mapType === "streets" ? (
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />
                            ) : (
                                <TileLayer
                                    attribution='Map data &copy; <a href="https://www.google.com/intl/en-GB_ALL/help/terms_maps.html">Google</a>'
                                    url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                                />
                            )}

                            <GeoJSON
                                key={`${mapType}-${hoveredFeature}`} // Re-render triggers style update
                                data={beat.geometry}
                                style={(feature: any) => {
                                    const featureId = feature.properties?.name || "";
                                    const color = getFeatureColor(feature);
                                    const isHovered = hoveredFeature === featureId;

                                    return {
                                        color: color,
                                        weight: isHovered ? 6 : 3,
                                        fillOpacity: isHovered ? 0.5 : 0.25,
                                        fillColor: color,
                                        opacity: isHovered ? 1 : 0.8
                                    };
                                }}
                                onEachFeature={(feature, layer) => {
                                    const name = feature.properties?.name || "Unnamed Feature";
                                    const type = feature.geometry?.type || "Unknown";
                                    const color = getFeatureColor(feature);

                                    layer.on({
                                        mouseover: (e) => setHoveredFeature(name),
                                        mouseout: (e) => setHoveredFeature(null)
                                    });

                                    layer.bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 200px;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                         <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color};"></div>
                         <strong style="font-size: 15px; color: #0f172a;">${name}</strong>
                      </div>
                      <div style="background: #f8fafc; padding: 8px; border-radius: 8px; font-size: 12px; color: #64748b;">
                        <div style="margin-bottom: 4px;"><strong>Type:</strong> ${type}</div>
                        <div><strong>Parent Beat:</strong> ${beat.beatName}</div>
                      </div>
                    </div>
                  `, {
                                        className: 'modern-popup'
                                    });
                                }}
                            />
                            <FitBounds geometry={beat.geometry} />
                        </MapContainer>

                        {/* GIS Stats Overlay */}
                        <div style={{
                            position: "absolute",
                            bottom: "32px",
                            left: "32px",
                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                            color: "white",
                            padding: "16px 24px",
                            borderRadius: "16px",
                            zIndex: 1000,
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
                        }}>
                            <div style={{ display: "flex", gap: "32px" }}>
                                <div>
                                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Total Features</div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{features.length}</div>
                                </div>
                                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "32px" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Coordinate System</div>
                                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>EPSG:4326 (WGS84)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .leaflet-container {
          background-color: #f1f5f9;
        }
        .modern-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 4px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        .modern-popup .leaflet-popup-tip {
          box-shadow: none;
        }
      `}</style>
        </div>
    );
}
