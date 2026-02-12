"use client";

import React, { useState, useEffect, useCallback } from "react";
import BeatForm from "./components/BeatForm";
import AreaForm from "./components/AreaForm";
import BeatTable from "./components/BeatTable";
import EditBeatModal from "./components/EditBeatModal";
import KMLDataViewer from "./components/KMLDataViewer";
import AssignBeatModal from "./components/AssignBeatModal";
import { AreaBeatApi } from "@lib/apiClient";
import { MapPin, Info } from "lucide-react";
import dynamic from "next/dynamic";

const BeatMapView = dynamic(() => import("./components/BeatMapView"), { ssr: false });

export default function AreasPage() {
  const [beats, setBeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingBeat, setViewingBeat] = useState<any | null>(null);
  const [editingBeat, setEditingBeat] = useState<any | null>(null);
  const [inspectingBeat, setInspectingBeat] = useState<any | null>(null);
  const [assigningBeat, setAssigningBeat] = useState<any | null>(null);
  const [geoVersion, setGeoVersion] = useState(0);

  const loadBeats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AreaBeatApi.list();
      setBeats(res.beats || []);
    } catch (err) {
      console.error("Failed to load beats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeats();
  }, [loadBeats]);

  return (
    <div className="page" style={{ padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="breadcrumb" style={{ fontSize: "0.875rem", color: "#64748b", display: "flex", gap: "8px", marginBottom: "8px" }}>
              <span>City Admin</span>
              <span>/</span>
              <span style={{ color: "#1e293b", fontWeight: 500 }}>Area & Beat Management</span>
            </div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Area & Beat Management
            </h1>
            <p style={{ marginTop: "8px", color: "#64748b", fontSize: "1rem" }}>
              Upload KML files and manage street-level beats across city zones.
            </p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "8px 16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}>
            <div style={{ backgroundColor: "#eff6ff", padding: "8px", borderRadius: "8px" }}>
              <MapPin size={20} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>Total Beats</div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1e293b" }}>{beats.length}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
          {/* Top Section: Forms */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", alignItems: "start" }}>
            <AreaForm onSuccess={() => setGeoVersion(v => v + 1)} />
            <BeatForm onSuccess={loadBeats} geoVersion={geoVersion} />
          </section>

          {/* Bottom Section: Table */}
          <section>
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Info size={16} color="#64748b" />
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>
                All parsed geometry data is stored in the PostGIS-enabled database.
              </span>
            </div>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: "12px" }}>
                <div className="animate-spin" style={{ width: "32px", height: "32px", border: "4px solid #f3f3f3", borderTop: "4px solid #2563eb", borderRadius: "50%", margin: "0 auto" }}></div>
                <p style={{ marginTop: "16px", color: "#64748b" }}>Loading beats...</p>
              </div>
            ) : (
              <BeatTable
                beats={beats}
                onRefresh={loadBeats}
                onView={setViewingBeat}
                onEdit={setEditingBeat}
                onViewData={setInspectingBeat}
                onAssign={setAssigningBeat}
              />
            )}
          </section>
        </div>
      </div>

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
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
