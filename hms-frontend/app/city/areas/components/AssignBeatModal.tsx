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
    const [currentAssignedId, setCurrentAssignedId] = useState<string | null>(beat.assignedToId || null);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [assigned, setAssigned] = useState(false);

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

    const handleToggleAssign = async (userId: string) => {
        const isCurrent = userId === currentAssignedId;
        const targetId = isCurrent ? null : userId;

        setLoading(true);
        try {
            await AreaBeatApi.assign(beat.id, targetId as any);
            setCurrentAssignedId(targetId);
            setAssigned(true);
            onSuccess();

            // Revert "assigned" check mark after a delay if we want to stay in modal
            setTimeout(() => setAssigned(false), 2000);
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
                                <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: 500 }}>Fetching taskforce team...</span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center", backgroundColor: "#f9fafb", borderRadius: "12px", border: "1px dashed #e5e7eb" }}>
                                <AlertCircle size={32} style={{ color: "#9ca3af", marginBottom: "12px" }} />
                                <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>No taskforce members found</div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px" }}>
                                    Ensure users are assigned the Taskforce role in this city.
                                </div>
                            </div>
                        ) : (
                            filteredUsers.map((user: any) => {
                                const isAssigned = user.id === currentAssignedId;
                                return (
                                    <div key={user.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px",
                                        borderRadius: "14px",
                                        border: isAssigned ? "2px solid #3b82f6" : "1px solid #f1f5f9",
                                        backgroundColor: isAssigned ? "#f8fbff" : "#fff",
                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        marginBottom: "4px"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{
                                                width: "40px", height: "40px", borderRadius: "12px",
                                                backgroundColor: user.matchesContext ? "#eff6ff" : "#f1f5f9",
                                                color: user.matchesContext ? "#2563eb" : "#64748b",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontWeight: 700, fontSize: "14px", border: "1px solid #e2e8f0"
                                            }}>
                                                {(user.name || "U")[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {user.name}
                                                    {user.matchesContext && (
                                                        <span style={{
                                                            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                                                            color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "6px",
                                                            fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.025em"
                                                        }}>
                                                            On-Site
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>{user.email}</span>
                                                    <span style={{ color: "#e2e8f0" }}>•</span>
                                                    <span style={{
                                                        fontSize: "0.75rem",
                                                        color: user.currentBeatCount > 5 ? "#ef4444" : "#10b981",
                                                        fontWeight: 700
                                                    }}>
                                                        {user.currentBeatCount} active beats
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleAssign(user.id)}
                                            disabled={loading}
                                            style={{
                                                padding: "8px 16px",
                                                borderRadius: "10px",
                                                border: "none",
                                                backgroundColor: isAssigned ? "#fee2e2" : "#2563eb",
                                                color: isAssigned ? "#be123c" : "white",
                                                fontSize: "0.75rem",
                                                fontWeight: 800,
                                                cursor: loading ? "not-allowed" : "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                transition: "all 0.2s",
                                                boxShadow: isAssigned ? "none" : "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
                                            }}
                                        >
                                            {loading ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                assigned && isAssigned ? (
                                                    <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <Check size={14} /> Assigned!
                                                    </span>
                                                ) : (
                                                    isAssigned ? "Unassign" : "Assign"
                                                )
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
