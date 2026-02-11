"use client";

import React, { useState } from "react";
import { X, UserPlus, Check, Loader2, Search } from "lucide-react";

interface AssignBeatModalProps {
    beat: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AssignBeatModal({ beat, onClose, onSuccess }: AssignBeatModalProps) {
    const [loading, setLoading] = useState(false);
    const [assigned, setAssigned] = useState(false);
    const [search, setSearch] = useState("");

    // Mock users for assignment
    const mockUsers = [
        { id: "1", name: "Rahul Sharma", role: "Field Supervisor" },
        { id: "2", name: "Amit Patel", role: "QC Officer" },
        { id: "3", name: "Suresh Kumar", role: "Maintenance Lead" },
        { id: "4", name: "Priya Singh", role: "City Manager" },
    ].filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    const handleAssign = async (userId: string) => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoading(false);
        setAssigned(true);
        setTimeout(() => {
            onSuccess();
            onClose();
        }, 1000);
    };

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

                <div style={{ padding: "20px" }}>
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.875rem" }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                        {mockUsers.map(user => (
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
                                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{user.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{user.role}</div>
                                </div>
                                <button
                                    onClick={() => handleAssign(user.id)}
                                    disabled={loading || assigned}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: assigned ? "#16a34a" : "#2563eb",
                                        color: "white",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        cursor: (loading || assigned) ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : (assigned ? <Check size={14} /> : "Assign")}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
