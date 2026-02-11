'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Protected, ModuleGuard } from "@components/Guards";
import { AreaBeatApi } from "@lib/apiClient";
import BeatTable from "../../city/areas/components/BeatTable";
import EditBeatModal from "../../city/areas/components/EditBeatModal";
import KMLDataViewer from "../../city/areas/components/KMLDataViewer";
import AssignBeatModal from "../../city/areas/components/AssignBeatModal";
import dynamic from "next/dynamic";
import { useAuth } from "@hooks/useAuth";
const BeatMapView = dynamic(() => import("../../city/areas/components/BeatMapView"), { ssr: false });
const GlobalBeatMapView = dynamic(() => import("../../city/areas/components/GlobalBeatMapView"), { ssr: false });

export default function SweepingModulePage() {
    const { user } = useAuth();
    const [beats, setBeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingBeat, setViewingBeat] = useState<any | null>(null);
    const [editingBeat, setEditingBeat] = useState<any | null>(null);
    const [inspectingBeat, setInspectingBeat] = useState<any | null>(null);
    const [assigningBeat, setAssigningBeat] = useState<any | null>(null);

    const [viewMode, setViewMode] = useState<"table" | "map">("table");

    const isQC = user?.roles?.includes("QC");

    const loadBeats = useCallback(async () => {
        try {
            setLoading(true);
            const res = isQC
                ? await AreaBeatApi.listMyBeats()
                : await AreaBeatApi.list();

            setBeats(res.beats || []);
        } catch (err) {
            console.error("Failed to load beats", err);
        } finally {
            setLoading(false);
        }
    }, [isQC]);

    useEffect(() => {
        loadBeats();
    }, [loadBeats]);

    return (
        <Protected>
            <ModuleGuard module="SWEEPING" roles={["QC", "CITY_ADMIN", "HMS_SUPER_ADMIN"]}>
                <div className="page" style={{ padding: "24px" }}>
                    <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                            <p className="eyebrow" style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                                Module · Sweeping & Sanitation
                            </p>
                            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                                {isQC ? "My Assigned Beats" : "Beat Management"}
                                <span style={{
                                    backgroundColor: "#eff6ff", color: "#2563eb",
                                    padding: "4px 12px", borderRadius: "20px",
                                    fontSize: "12px", fontWeight: 700, border: "1px solid #dbeafe"
                                }}>
                                    {beats.length} Total
                                </span>
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                                {isQC
                                    ? "View and monitor beats assigned specifically to you for quality control."
                                    : "Manage all street-level beats, assignments, and city-wide coverage."}
                            </p>
                        </div>

                        {!isQC && (
                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{
                                    backgroundColor: "white", padding: "12px 20px", borderRadius: "16px",
                                    border: "1px solid #e2e8f0", display: "flex", flexDirection: "row", gap: "12px",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                }}>
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.025em" }}>Unassigned</div>
                                        <div style={{ fontSize: "20px", fontWeight: 900, color: "#ef4444" }}>
                                            {beats.filter(b => !b.assignedToId).length}
                                        </div>
                                    </div>
                                    <div style={{ width: "1px", backgroundColor: "#f1f5f9" }} />
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.025em" }}>Field Team</div>
                                        <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>
                                            {new Set(beats.map(b => b.assignedToId).filter(Boolean)).size}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{
                            display: "flex",
                            backgroundColor: "#f1f5f9",
                            padding: "4px",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0"
                        }}>
                            <button
                                onClick={() => setViewMode("table")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    border: "none",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    backgroundColor: viewMode === "table" ? "white" : "transparent",
                                    color: viewMode === "table" ? "#2563eb" : "#64748b",
                                    boxShadow: viewMode === "table" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                Table View
                            </button>
                            <button
                                onClick={() => setViewMode("map")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    border: "none",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    backgroundColor: viewMode === "map" ? "white" : "transparent",
                                    color: viewMode === "map" ? "#2563eb" : "#64748b",
                                    boxShadow: viewMode === "map" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                Map View
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
                            <div className="animate-spin" style={{ width: "24px", height: "24px", border: "3px solid #f3f3f3", borderTop: "3px solid #2563eb", borderRadius: "50%", margin: "0 auto" }}></div>
                            <p style={{ marginTop: "16px", color: "#64748b", fontSize: "14px" }}>Fetching beat data...</p>
                        </div>
                    ) : (
                        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                            {viewMode === "table" ? (
                                <BeatTable
                                    beats={beats}
                                    onRefresh={loadBeats}
                                    onView={setViewingBeat}
                                    onEdit={setEditingBeat}
                                    onViewData={setInspectingBeat}
                                    onAssign={setAssigningBeat}
                                    isQC={isQC}
                                />
                            ) : (
                                <GlobalBeatMapView beats={beats} />
                            )}
                        </div>
                    )}

                    {/* Modals */}
                    {viewingBeat && (
                        <BeatMapView
                            beat={viewingBeat}
                            onClose={() => setViewingBeat(null)}
                        />
                    )}

                    {editingBeat && (
                        <EditBeatModal
                            beat={editingBeat}
                            onClose={() => setEditingBeat(null)}
                            onSuccess={loadBeats}
                        />
                    )}

                    {inspectingBeat && (
                        <KMLDataViewer
                            beat={inspectingBeat}
                            onClose={() => setInspectingBeat(null)}
                        />
                    )}

                    {assigningBeat && (
                        <AssignBeatModal
                            beat={assigningBeat}
                            onClose={() => setAssigningBeat(null)}
                            onSuccess={loadBeats}
                        />
                    )}

                    <style jsx>{`
                        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                        .animate-spin { animation: spin 1s linear infinite; }
                        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    `}</style>
                </div>
            </ModuleGuard>
        </Protected>
    );
}
