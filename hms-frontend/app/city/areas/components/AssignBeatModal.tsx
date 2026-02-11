"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Check, Loader2, Search, AlertCircle } from "lucide-react";
import { AreaBeatApi } from "@lib/apiClient";

interface AssignBeatModalProps {
    beat: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AssignBeatModal({ beat, onClose, onSuccess }: AssignBeatModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [assigned, setAssigned] = useState(false);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [beat.id]);

    const fetchUsers = async () => {
        setFetching(true);
        setError("");
        try {
            const data = await AreaBeatApi.listPotentialAssignees(beat.id);
            setUsers(data);
        } catch (err: any) {
            console.error("Failed to fetch users", err);
            setError(err.message || "Failed to fetch potential assignees");
        } finally {
            setFetching(false);
        }
    };

    const handleAssign = async (userId: string) => {
        setLoading(true);
        try {
            await AreaBeatApi.assign(beat.id, userId);

            setAssigned(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1001,
            display: "flex", justifyContent: "center", alignItems: "center",
            backdropFilter: "blur(2px)"
        }}>
            <div style={{
                width: "90%", maxWidth: "450px",
                backgroundColor: "white", borderRadius: "16px", overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Assign Beat</h3>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>{beat.beatName}</p>
                    </div>
                    <button onClick={onClose} style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <div style={{ padding: "0 24px 24px" }}>
                    {error && (
                        <div style={{
                            padding: "10px 16px",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fee2e2",
                            borderRadius: "8px",
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div style={{ position: "relative", marginBottom: "20px" }}>
                        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.875rem" }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "10px", maxHeight: "300px", overflowY: "auto", minHeight: "100px" }}>
                        {fetching ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px" }}>
                                <Loader2 size={32} className="animate-spin" style={{ color: "#2563eb" }} />
                                <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: 500 }}>Fetching sanitation team...</span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center", backgroundColor: "#f9fafb", borderRadius: "12px", border: "1px dashed #e5e7eb" }}>
                                <AlertCircle size={32} style={{ color: "#9ca3af", marginBottom: "12px" }} />
                                <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>No QC users found</div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px" }}>
                                    Ensure users are assigned the QC role in this city.
                                </div>
                            </div>
                        ) : (
                            filteredUsers.map((user: any) => (
                                <div key={user.id} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: "1px solid #f3f4f6",
                                    backgroundColor: "#fcfcfd"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                                            {user.name}
                                            {user.matchesContext && (
                                                <span style={{
                                                    backgroundColor: "#dcfce7", color: "#166534",
                                                    fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px",
                                                    fontWeight: 700, textTransform: "uppercase"
                                                }}>
                                                    Local Match
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>QC Officer • {user.email}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAssign(user.id)}
                                        disabled={loading || assigned}
                                        style={{
                                            padding: "6px 16px",
                                            borderRadius: "6px",
                                            border: "none",
                                            backgroundColor: assigned ? "#16a34a" : "#2563eb",
                                            color: "white",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            cursor: (loading || assigned) ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : (assigned ? <Check size={14} /> : "Assign")}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
