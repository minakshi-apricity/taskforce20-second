"use client";

import React, { useState } from "react";
import { AreaBeatApi } from "@lib/apiClient";
import { Eye, Edit2, Trash2, Loader2, FileText, UserPlus } from "lucide-react";

interface BeatTableProps {
    beats: any[];
    onRefresh: () => void;
    onView: (beat: any) => void;
    onEdit: (beat: any) => void;
    onViewData: (beat: any) => void;
    onAssign: (beat: any) => void;
}

export default function BeatTable({ beats, onRefresh, onView, onEdit, onViewData, onAssign }: BeatTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this beat?")) return;

        setDeletingId(id);
        try {
            await AreaBeatApi.remove(id);
            onRefresh();
        } catch (err) {
            alert("Failed to delete beat");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="card" style={{ padding: "0", overflow: "hidden", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1f2937" }}>
                    Registered Beats
                </h3>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ backgroundColor: "#f9fafb" }}>
                        <tr>
                            <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Zone</th>
                            <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Ward</th>
                            <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Area</th>
                            <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Beat Name</th>
                            <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Type</th>
                            <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Created At</th>
                            <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody style={{ backgroundColor: "white" }}>
                        {beats.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: "40px 24px", textAlign: "center", color: "#9ca3af" }}>
                                    No beats found. Upload a KML to get started.
                                </td>
                            </tr>
                        ) : (
                            beats.map((beat) => (
                                <tr key={beat.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fcfcfd"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "#374151" }}>{beat.zoneName}</td>
                                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "#374151" }}>{beat.wardName}</td>
                                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "#374151" }}>{beat.areaName}</td>
                                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>{beat.beatName}</td>
                                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "#374151" }}>
                                        <span style={{
                                            padding: "2px 8px",
                                            borderRadius: "9999px",
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            backgroundColor: beat.geometry?.type === "FeatureCollection" ? "#fef3c7" : "#eff6ff",
                                            color: beat.geometry?.type === "FeatureCollection" ? "#92400e" : "#1e40af"
                                        }}>
                                            {beat.geometry?.type === "FeatureCollection" ? "Collection" : (beat.geometry?.type || "N/A")}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px 24px", fontSize: "0.875rem", color: "#6b7280" }}>
                                        {new Date(beat.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                            <button
                                                onClick={() => onView(beat)}
                                                style={{ padding: "6px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#4b5563", cursor: "pointer" }}
                                                title="View on Map"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => onViewData(beat)}
                                                style={{ padding: "6px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#4b5563", cursor: "pointer" }}
                                                title="View KML Data"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                onClick={() => onAssign(beat)}
                                                style={{ padding: "6px", borderRadius: "6px", border: "1px solid #eff6ff", backgroundColor: "#eff6ff", color: "#2563eb", cursor: "pointer" }}
                                                title="Assign Beat"
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(beat)}
                                                style={{ padding: "6px", borderRadius: "6px", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#4b5563", cursor: "pointer" }}
                                                title="Edit Beat"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(beat.id)}
                                                disabled={deletingId === beat.id}
                                                style={{ padding: "6px", borderRadius: "6px", border: "1px solid #fee2e2", backgroundColor: "#fef2f2", color: "#dc2626", cursor: deletingId === beat.id ? "not-allowed" : "pointer" }}
                                                title="Delete Beat"
                                            >
                                                {deletingId === beat.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
