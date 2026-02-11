'use client';

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, Map as MapIcon, Layers, Info, Search, Navigation2, ChevronRight, User } from "lucide-react";

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";

const COLORS = [
    "#FF3D00", "#FFD600", "#00E676", "#00B0FF", "#651FFF", "#D500F9",
    "#F50057", "#1DE9B6", "#C6FF00", "#FF9100", "#FF1744", "#3D5AFE"
];

function FitAllBounds({ beats, selectedBeatId }: { beats: any[], selectedBeatId?: string | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedBeatId) {
            const beat = beats.find(b => b.id === selectedBeatId);
            if (beat?.geometry) {
                const layer = L.geoJSON(beat.geometry);
                map.flyToBounds(layer.getBounds(), { padding: [100, 100], duration: 1.5 });
            }
            return;
        }

        if (beats.length > 0 && map) {
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
    }, [beats, map, selectedBeatId]);

    return null;
}

export default function GlobalBeatMapView({ beats }: { beats: any[] }) {
    const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
    const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const beatsWithGeom = useMemo(() => beats.filter(b => b.geometry), [beats]);

    const filteredBeats = useMemo(() => {
        if (!searchQuery) return beatsWithGeom;
        const q = searchQuery.toLowerCase();
        return beatsWithGeom.filter(b =>
            b.beatName.toLowerCase().includes(q) ||
            (b.assignedToName || "").toLowerCase().includes(q) ||
            (b.zoneName || "").toLowerCase().includes(q) ||
            (b.wardName || "").toLowerCase().includes(q)
        );
    }, [beatsWithGeom, searchQuery]);

    const stats = useMemo(() => {
        const total = beats.length;
        const assigned = beats.filter(b => b.assignedToId).length;
        return {
            total,
            assigned,
            unassigned: total - assigned,
            coverage: total ? Math.round((assigned / total) * 100) : 0
        };
    }, [beats]);

    const selectedBeat = useMemo(() =>
        beats.find(b => b.id === selectedBeatId),
        [beats, selectedBeatId]);

    return (
        <div className="card" style={{ padding: 0, overflow: "hidden", height: "750px", position: "relative", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", display: "flex" }}>

            {/* Fleet Sidebar */}
            {isSidebarOpen && (
                <div style={{
                    width: "340px", height: "100%", backgroundColor: "#fcfdfe",
                    borderRight: "1px solid #eef2f6", display: "flex", flexDirection: "column",
                    zIndex: 1001, flexShrink: 0
                }}>
                    <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ backgroundColor: "#2563eb", padding: "8px", borderRadius: "10px" }}>
                                    <Navigation2 size={18} color="white" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.01em" }}>Route Intel</h3>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                style={{ border: "none", background: "none", color: "#94a3b8", cursor: "pointer" }}
                            >
                                <Minimize2 size={18} />
                            </button>
                        </div>

                        <div style={{ position: "relative" }}>
                            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={16} />
                            <input
                                type="text"
                                placeholder="Search deployment..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%", padding: "10px 12px 10px 38px", borderRadius: "12px",
                                    border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: 600,
                                    outline: "none", backgroundColor: "#fff"
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", padding: "0 12px 10px 12px", letterSpacing: "0.05em" }}>
                            Active Deployment ({filteredBeats.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {filteredBeats.map((beat, idx) => {
                                const isSelected = selectedBeatId === beat.id;
                                const isUnassigned = !beat.assignedToId;
                                const color = COLORS[idx % COLORS.length];

                                return (
                                    <div
                                        key={beat.id}
                                        onClick={() => setSelectedBeatId(beat.id)}
                                        style={{
                                            padding: "14px", borderRadius: "14px", cursor: "pointer",
                                            backgroundColor: isSelected ? "#eff6ff" : "transparent",
                                            border: isSelected ? "1px solid #dbeafe" : "1px solid transparent",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                            <div style={{
                                                width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px",
                                                backgroundColor: isUnassigned ? "#ef4444" : color,
                                                boxShadow: isSelected ? `0 0 10px ${color}` : "none",
                                                flexShrink: 0
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: "14px", color: isSelected ? "#2563eb" : "#334155", marginBottom: "2px" }}>
                                                    {beat.beatName}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                                                    {beat.zoneName} <ChevronRight size={10} /> {beat.wardName}
                                                </div>
                                                {beat.assignedToName && (
                                                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800 }}>
                                                            {beat.assignedToName[0]}
                                                        </div>
                                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>{beat.assignedToName}</span>
                                                    </div>
                                                )}
                                                {!beat.assignedToName && (
                                                    <div style={{ marginTop: "8px", fontSize: "10px", fontWeight: 800, color: "#ef4444", textTransform: "uppercase" }}>
                                                        Unassigned
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Map Area */}
            <div style={{ flex: 1, position: "relative" }}>
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{
                            position: "absolute", top: "20px", left: "20px", zIndex: 1002,
                            backgroundColor: "white", border: "1px solid #e2e8f0", padding: "10px",
                            borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", cursor: "pointer"
                        }}
                    >
                        <Maximize2 size={18} color="#2563eb" />
                    </button>
                )}

                {/* Floating Top Stats */}
                <div style={{
                    position: "absolute", top: "20px", right: "20px", zIndex: 1000,
                    display: "flex", gap: "12px", pointerEvents: "none"
                }}>
                    <div style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)", padding: "12px 24px", borderRadius: "18px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08)", backdropFilter: "blur(12px)",
                        display: "flex", gap: "32px", border: "1px solid rgba(255,255,255,0.5)",
                        pointerEvents: "auto"
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "20px", fontWeight: 900, color: "#10b981", lineHeight: 1 }}>{stats.assigned}</div>
                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginTop: "4px" }}>Assigned</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "20px", fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>{stats.unassigned}</div>
                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginTop: "4px" }}>Unassigned</div>
                        </div>
                        <div style={{ textAlign: "center", borderLeft: "1px solid #f1f5f9", paddingLeft: "32px" }}>
                            <div style={{ fontSize: "20px", fontWeight: 900, color: "#2563eb", lineHeight: 1 }}>{stats.coverage}%</div>
                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginTop: "4px" }}>Live Fleet</div>
                        </div>
                    </div>
                </div>

                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    zoomControl={false}
                    style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
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

                    {filteredBeats.map((beat, bIdx) => {
                        const isSelected = selectedBeatId === beat.id;
                        const isUnassigned = !beat.assignedToId;

                        // Transform geometry to FeatureCollection of segments for individual coloring
                        const explodedGeoJSON = useMemo(() => {
                            if (!beat.geometry) return null;
                            try {
                                const geom = beat.geometry;
                                if (geom.type === "LineString") {
                                    return {
                                        type: "FeatureCollection",
                                        features: [{ type: "Feature", geometry: geom, properties: { index: 0 } }]
                                    };
                                } else if (geom.type === "MultiLineString") {
                                    return {
                                        type: "FeatureCollection",
                                        features: geom.coordinates.map((coords: any, i: number) => ({
                                            type: "Feature",
                                            geometry: { type: "LineString", coordinates: coords },
                                            properties: { index: i }
                                        }))
                                    };
                                } else if (geom.type === "GeometryCollection") {
                                    const features: any[] = [];
                                    geom.geometries.forEach((g: any, i: number) => {
                                        if (g.type === "LineString") {
                                            features.push({ type: "Feature", geometry: g, properties: { index: features.length } });
                                        } else if (g.type === "MultiLineString") {
                                            g.coordinates.forEach((coords: any) => {
                                                features.push({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: { index: features.length } });
                                            });
                                        }
                                    });
                                    return { type: "FeatureCollection", features };
                                }
                                return { type: "FeatureCollection", features: [{ type: "Feature", geometry: geom, properties: { index: 0 } }] };
                            } catch (e) {
                                return null;
                            }
                        }, [beat.geometry]);

                        if (!explodedGeoJSON) return null;

                        return (
                            <GeoJSON
                                key={beat.id}
                                data={explodedGeoJSON as any}
                                style={(feature) => {
                                    const segmentIdx = feature?.properties?.index || 0;
                                    const segmentColor = isUnassigned ? "#94a3b8" : COLORS[(bIdx + segmentIdx) % COLORS.length];

                                    return {
                                        color: isSelected ? "#2563eb" : segmentColor,
                                        weight: isSelected ? 6 : (isUnassigned ? 2 : 4),
                                        opacity: isUnassigned ? 0.3 : (isSelected ? 1 : 0.9),
                                        fillOpacity: isSelected ? 0.35 : 0.1,
                                        dashArray: isUnassigned ? "5, 8" : "none"
                                    };
                                }}
                                onEachFeature={(feature, layer) => {
                                    layer.on('click', () => setSelectedBeatId(beat.id));
                                    layer.bindPopup(`
                                        <div style="font-family: 'Inter', sans-serif; padding: 16px; min-width: 240px;">
                                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${isUnassigned ? '#ef4444' : '#10b981'}; box-shadow: 0 0 12px ${isUnassigned ? '#fee2e2' : '#dcfce7'}"></div>
                                                <div style="font-weight: 900; color: #1e293b; font-size: 18px; letter-spacing: -0.02em;">${beat.beatName}</div>
                                            </div>
                                            <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 6px;">
                                                ${beat.zoneName} <span style="color: #cbd5e1">•</span> ${beat.wardName}
                                            </div>
                                            <div style="background: #fcfdfe; padding: 14px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02)">
                                                <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800; margin-bottom: 8px; letter-spacing: 0.05em;">Duty Officer</div>
                                                <div style="font-weight: 700; color: #334155; font-size: 15px; display: flex; align-items: center; gap: 10px;">
                                                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justifyContent: center; font-size: 11px; font-weight: 800;">
                                                        ${(beat.assignedToName || 'X')[0]}
                                                    </div>
                                                    <div>
                                                        <div style="line-height: 1.2;">${beat.assignedToName || 'Unassigned'}</div>
                                                        <div style="font-size: 10px; color: ${isUnassigned ? '#ef4444' : '#10b981'}; margin-top: 2px;">
                                                            ${isUnassigned ? "Awaiting Deployment" : "Active on Route"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `, {
                                        className: 'premium-popup'
                                    });
                                }}
                            />
                        );
                    })}

                    <FitAllBounds beats={filteredBeats} selectedBeatId={selectedBeatId} />

                    {/* Map Interaction Controls */}
                    <div style={{ position: "absolute", bottom: "30px", right: "20px", zIndex: 1000 }}>
                        <div style={{
                            backgroundColor: "white", padding: "6px", borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", border: "1px solid #f1f5f9",
                            display: "flex", flexDirection: "column", gap: "6px"
                        }}>
                            {(["streets", "satellite"] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setMapType(t)}
                                    style={{
                                        width: "44px", height: "44px", borderRadius: "12px", border: "none",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        backgroundColor: mapType === t ? "#eff6ff" : "transparent",
                                        color: mapType === t ? "#2563eb" : "#94a3b8",
                                        cursor: "pointer", transition: "all 0.2s"
                                    }}
                                >
                                    {t === "streets" ? <MapIcon size={22} /> : <Layers size={22} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </MapContainer>
            </div>

            <style jsx global>{`
                .premium-popup .leaflet-popup-content-wrapper {
                    border-radius: 20px;
                    padding: 0;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    border: 1px solid rgba(255,255,255,0.8);
                }
                .premium-popup .leaflet-popup-content {
                    margin: 0;
                }
                .premium-popup .leaflet-popup-tip-container {
                    display: none;
                }
                .leaflet-container {
                    cursor: crosshair !important;
                }
            `}</style>
        </div>
    );
}
