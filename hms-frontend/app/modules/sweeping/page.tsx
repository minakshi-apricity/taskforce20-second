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

export default function SweepingModulePage() {
    const { user } = useAuth();
    const [beats, setBeats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingBeat, setViewingBeat] = useState<any | null>(null);
    const [editingBeat, setEditingBeat] = useState<any | null>(null);
    const [inspectingBeat, setInspectingBeat] = useState<any | null>(null);
    const [assigningBeat, setAssigningBeat] = useState<any | null>(null);

    const isQC = user?.roles?.includes("QC");

    const loadBeats = useCallback(async () => {
        try {
            setLoading(true);
            // If QC, we might want to filter for their beats specifically
            // but the user said "same data which was passed by assigned beat"
            // which usually means the full management table.
            // However, the my-beats endpoint is better for QC.
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
                    <div style={{ marginBottom: "32px" }}>
                        <p className="eyebrow" style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                            Module · Sweeping & Sanitation
                        </p>
                        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            {isQC ? "My Assigned Beats" : "Beat Management"}
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                            {isQC
                                ? "View and monitor beats assigned specifically to you for quality control."
                                : "Manage all street-level beats, assignments, and city-wide coverage."}
                        </p>
                    </div>

                    {loading ? (
                        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
                            <div className="animate-spin" style={{ width: "24px", height: "24px", border: "3px solid #f3f3f3", borderTop: "3px solid #2563eb", borderRadius: "50%", margin: "0 auto" }}></div>
                            <p style={{ marginTop: "16px", color: "#64748b", fontSize: "14px" }}>Fetching beat data...</p>
                        </div>
                    ) : (
                        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                            <BeatTable
                                beats={beats}
                                onRefresh={loadBeats}
                                onView={setViewingBeat}
                                onEdit={setEditingBeat}
                                onViewData={setInspectingBeat}
                                onAssign={setAssigningBeat}
                            />
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
