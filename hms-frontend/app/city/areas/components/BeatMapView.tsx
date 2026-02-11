"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Plus, Minus, FileText, X, Navigation, UserPlus } from "lucide-react";
import AssignBeatModal from "./AssignBeatModal";

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

// Map Controller for panned navigation
function MapController({ targetFeature }: { targetFeature: any | null }) {
    const { useMap } = require("react-leaflet");
    const map = useMap();

    useEffect(() => {
        if (targetFeature && map) {
            const L = require("leaflet");
            const geoLayer = L.geoJSON(targetFeature);
            const bounds = geoLayer.getBounds();

            if (targetFeature.geometry.type === "Point") {
                map.setView(bounds.getCenter(), 18, { animate: true });
            } else {
                map.fitBounds(bounds, { padding: [100, 100], animate: true });
            }
        }
    }, [targetFeature, map]);

    return null;
}

// Map Zoom Handler
function ZoomHandler() {
    const { useMap } = require("react-leaflet");
    const map = useMap();

    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();

        window.addEventListener("map-zoom-in", handleZoomIn);
        window.addEventListener("map-zoom-out", handleZoomOut);

        return () => {
            window.removeEventListener("map-zoom-in", handleZoomIn);
            window.removeEventListener("map-zoom-out", handleZoomOut);
        };
    }, [map]);

    return null;
}

export default function BeatMapView({ beat, onClose }: BeatMapViewProps) {
    const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
    const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
    const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);

    if (!beat.geometry) return null;

    const features = beat.geometry?.features || [];
    const filteredFeatures = features.filter((f: any) =>
        (f.properties?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleZoomIn = () => window.dispatchEvent(new CustomEvent("map-zoom-in"));
    const handleZoomOut = () => window.dispatchEvent(new CustomEvent("map-zoom-out"));

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.85)", zIndex: 1000,
            display: "flex", justifyContent: "center", alignItems: "center",
            backdropFilter: "blur(12px)"
        }}>
            <div style={{
                width: "98%", maxWidth: "1600px", height: "94vh",
                backgroundColor: "white", borderRadius: "28px", overflow: "hidden",
                position: "relative", display: "flex", flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255,255,255,0.1)"
            }}>
                {/* Pro Header */}
                <div style={{
                    padding: "16px 32px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    backgroundColor: "#fff",
                    zIndex: 10
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                <MapPin size={24} color="#2563eb" fill="#dbeafe" />
                                {beat.beatName}
                            </h3>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                                {beat.zoneName} • {beat.wardName} • {beat.areaName}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                            {(["streets", "satellite"] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setMapType(type)}
                                    style={{
                                        padding: "6px 16px", borderRadius: "10px", border: "none", fontSize: "0.75rem", fontWeight: 700,
                                        backgroundColor: mapType === type ? "white" : "transparent",
                                        color: mapType === type ? "#2563eb" : "#64748b",
                                        boxShadow: mapType === type ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                        cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize"
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                width: "44px", height: "44px", borderRadius: "14px", border: "none",
                                backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, display: "flex", overflow: "hidden", backgroundColor: "#f8fafc" }}>
                    {/* Side Explorer */}
                    <div style={{
                        width: "360px",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#fff",
                        boxShadow: "10px 0 15px -10px rgba(0,0,0,0.05)",
                        zIndex: 5
                    }}>
                        <div style={{ padding: "24px 20px" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input
                                    type="text"
                                    placeholder="Search placemarks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 12px 12px 42px", borderRadius: "16px",
                                        border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: "0.875rem",
                                        transition: "border-color 0.2s"
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px" }}>
                            <button
                                onClick={() => setShowAssignModal(true)}
                                style={{
                                    width: "100%", padding: "14px", borderRadius: "16px",
                                    border: "none", backgroundColor: "#2563eb", color: "white",
                                    fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.25)",
                                    marginBottom: "12px"
                                }}
                            >
                                <UserPlus size={18} />
                                Manage Assignment
                            </button>

                            <div style={{ padding: "0 8px 12px", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                                Found {filteredFeatures.length} Results
                            </div>
                            {filteredFeatures.map((f: any, i: number) => {
                                const featureId = f.properties?.name || `feat-${i}`;
                                const color = getFeatureColor(f);
                                const isActive = selectedFeature?.properties?.name === featureId;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedFeature(f)}
                                        onMouseEnter={() => setHoveredFeature(featureId)}
                                        onMouseLeave={() => setHoveredFeature(null)}
                                        style={{
                                            padding: "16px",
                                            borderRadius: "18px",
                                            marginBottom: "10px",
                                            cursor: "pointer",
                                            backgroundColor: isActive ? "#eff6ff" : (hoveredFeature === featureId ? "#f8fafc" : "transparent"),
                                            border: "2px solid",
                                            borderColor: isActive ? "#3b82f6" : "transparent",
                                            transition: "all 0.2s",
                                            boxShadow: isActive ? "0 4px 12px rgba(59, 130, 246, 0.15)" : "none"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                                            <div style={{
                                                width: "40px", height: "40px", borderRadius: "12px",
                                                backgroundColor: `${color}15`, color: color,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0
                                            }}>
                                                {f.geometry?.type === "Point" ? <MapPin size={20} /> : <FileText size={20} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: "0.935rem", fontWeight: 700, color: "#0f172a" }}>
                                                    {f.properties?.name || `Feature #${i + 1}`}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span style={{ padding: "2px 6px", backgroundColor: "#f1f5f9", borderRadius: "4px" }}>{f.geometry?.type}</span>
                                                    • <span>{f.geometry?.type === "Point" ? "Marker" : "Path"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Premium Map Canvas */}
                    <div style={{ flex: 1, position: "relative" }}>
                        <MapContainer
                            center={[20.5937, 78.9629]}
                            zoom={5}
                            zoomControl={false}
                            style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
                        >
                            <div className="leaflet-top leaflet-right" style={{ marginTop: "20px", marginRight: "20px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", backgroundColor: "white", borderRadius: "14px", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                                        <button onClick={handleZoomIn} style={{ padding: "12px", border: "none", backgroundColor: "white", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}><Plus size={18} /></button>
                                        <button onClick={handleZoomOut} style={{ padding: "12px", border: "none", backgroundColor: "white", cursor: "pointer" }}><Minus size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            {mapType === "streets" ? (
                                <TileLayer
                                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />
                            ) : (
                                <TileLayer
                                    attribution='Google'
                                    url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                />
                            )}

                            <GeoJSON
                                key={`${mapType}-${hoveredFeature}-${searchQuery}`}
                                data={beat.geometry}
                                style={(feature: any) => {
                                    const featureId = feature.properties?.name || "";
                                    const color = getFeatureColor(feature);
                                    const isHovered = hoveredFeature === featureId;
                                    const isSelected = selectedFeature?.properties?.name === featureId;

                                    return {
                                        color: color,
                                        weight: (isHovered || isSelected) ? 5 : 3,
                                        fillOpacity: (isHovered || isSelected) ? 0.45 : 0.25,
                                        fillColor: color,
                                        opacity: 1,
                                        dashArray: isHovered ? "5, 5" : ""
                                    };
                                }}
                                pointToLayer={(feature: any, latlng: any) => {
                                    const L = require("leaflet");
                                    const color = getFeatureColor(feature);
                                    const icon = L.divIcon({
                                        html: `
                         <div style="
                            position: relative;
                            width: 32px; height: 32px;
                            background: white;
                            border: 3px solid ${color};
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            box-shadow: 0 4px 6px rgba(0,0,0,0.2)
                         ">
                            <div style="
                               position: absolute; width: 10px; height: 10px;
                               background: ${color}; border-radius: 50%;
                               top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);
                            "></div>
                         </div>
                      `,
                                        className: "",
                                        iconSize: [32, 32],
                                        iconAnchor: [16, 32]
                                    });
                                    return L.marker(latlng, { icon });
                                }}
                                onEachFeature={(feature, layer) => {
                                    const name = feature.properties?.name || "Unnamed";
                                    const color = getFeatureColor(feature);

                                    if (layer && typeof layer.on === "function") {
                                        layer.on({
                                            mouseover: () => setHoveredFeature(name),
                                            mouseout: () => setHoveredFeature(null),
                                            click: () => setSelectedFeature(feature)
                                        });
                                    }

                                    if (layer && typeof layer.bindPopup === "function") {
                                        layer.bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; padding: 10px; min-width: 220px;">
                      <div style="color: ${color}; font-weight: 800; font-size: 16px; margin-bottom: 6px;">${name}</div>
                      <div style="height: 1px; background: #f1f5f9; margin: 8px 0;"></div>
                      <div style="display: grid; gap: 4px; font-size: 13px; color: #475569;">
                        <div><strong>Geometry:</strong> ${feature.geometry.type}</div>
                        <div><strong>Beat:</strong> ${beat.beatName}</div>
                      </div>
                      <div style="margin-top: 12px; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">GIS Metadata Connected</div>
                    </div>
                  `, { className: 'modern-popup' });
                                    }
                                }}
                            />
                            <MapController targetFeature={selectedFeature} />
                            <FitBounds geometry={beat.geometry} />
                            <ZoomHandler />
                        </MapContainer>

                        {/* Float HUD */}
                        <div style={{
                            position: "absolute", bottom: "40px", right: "40px",
                            backgroundColor: "white", padding: "12px 24px", borderRadius: "20px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                            display: "flex", gap: "24px", alignItems: "center",
                            zIndex: 1000, border: "1px solid #f1f5f9"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981", animation: "pulse 2s infinite" }} />
                                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>Real-time GIS Sync</span>
                            </div>
                            <div style={{ width: "1px", height: "24px", backgroundColor: "#f1f5f9" }} />
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Projection:</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#3b82f6" }}>EPSG 4326</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAssignModal && (
                <AssignBeatModal
                    beat={beat}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={() => {
                        setShowAssignModal(false);
                        // Optional: refresh data
                    }}
                />
            )}

            <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .leaflet-container { background: #f8fafc !important; }
        .modern-popup .leaflet-popup-content-wrapper { border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); }
        .modern-popup .leaflet-popup-tip-container { display: none; }
      `}</style>
        </div>
    );
}
