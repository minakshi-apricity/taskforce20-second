'use client';

import { useEffect, useState } from "react";
import { ApiError, CityApi } from "@lib/apiClient";
import { Edit2, X, Loader2 } from "lucide-react";

interface CityAdminInfo {
  name: string;
  email: string;
}

interface CityRow {
  id: string;
  name: string;
  code: string;
  ulbCode?: string;
  enabled: boolean;
  cityAdmin: CityAdminInfo | null;
}

export default function HmsDashboardPage() {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState<CityRow | null>(null);

  const [cityName, setCityName] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [cityUlbCode, setCityUlbCode] = useState("");
  const [cityStatus, setCityStatus] = useState("");

  const [adminCityId, setAdminCityId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const cityRes = await CityApi.list();
      setCities((cityRes as any).cities ?? cityRes);
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : "Failed to load data";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCityStatus("Creating...");
    try {
      await CityApi.create({ name: cityName, code: cityCode, ulbCode: cityUlbCode || cityCode });
      setCityStatus("City created.");
      setCityName("");
      setCityCode("");
      setCityUlbCode("");
      await refresh();
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : "Failed to create city.";
      setCityStatus(message);
    }
  };

  const handleToggleCity = async (cityId: string, enabled: boolean) => {
    try {
      await CityApi.setEnabled(cityId, enabled);
      setCities((prev) => prev.map((c) => (c.id === cityId ? { ...c, enabled } : c)));
    } catch (err) {
      alert("Failed to toggle city: " + (err instanceof ApiError ? err.message : ""));
    }
  };

  const handleUpdateCity = async (cityId: string, data: { name: string; code: string; ulbCode: string; adminName?: string; adminEmail?: string }) => {
    try {
      await CityApi.update(cityId, data);
      await refresh();
      setEditingCity(null);
    } catch (err: any) {
      alert(err instanceof ApiError ? err.message : "Failed to update city");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatus("Creating...");
    try {
      await CityApi.createCityAdmin(adminCityId, {
        email: adminEmail,
        password: adminPassword,
        name: adminName
      });
      setAdminStatus("City admin created.");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      await refresh();
    } catch (err: any) {
      const message = err instanceof ApiError ? err.message : "Failed to create city admin.";
      setAdminStatus(message);
    }
  };

  return (
    <div className="page" style={{ backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)', backgroundSize: '40px 40px', minHeight: '100vh', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="breadcrumb" style={{ marginBottom: 8 }}>
          <span>HMS</span>
          <span>/</span>
          <span>Dashboard</span>
        </div>

      </div>

      {error && <div className="alert error">Error: {error}</div>}
      {loading ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : (
        <>
          {/* City Overview Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>City Overview</h3>
              <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>Cities</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: '#f8fafc', color: '#64748b', textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>City</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>Code</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>ULB Code</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>City Admin</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ background: 'white' }}>
                  {cities.map((city) => (
                    <tr key={city.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: '#0f172a' }}>
                        {city.name}
                        {/* Hidden UUID for cleanliness */}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{city.code}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{city.ulbCode || "—"}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{city.cityAdmin?.name || "—"}</td>
                      <td style={{ padding: '16px 24px', color: '#475569' }}>{city.cityAdmin?.email || "—"}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={city.enabled}
                            onChange={(e) => handleToggleCity(city.id, e.target.checked)}
                            style={{ accentColor: '#2563eb', width: 14, height: 14 }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 600, color: city.enabled ? '#0f172a' : '#94a3b8' }}>{city.enabled ? "Active" : "Inactive"}</span>
                        </label>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button
                          onClick={() => setEditingCity(city)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#6366f1',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5f3ff';
                            e.currentTarget.style.borderColor = '#ddd6fe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                          title="Edit City"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cities.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No cities found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Creation Forms */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            {/* Create City */}
            <div className="card" style={{ background: '#fff9f5', border: '1px solid #ffedd5' }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Create City</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Register a new municipality in the system.</p>
              </div>
              <form onSubmit={handleCreateCity} className="form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Name</label>
                  <input className="input" style={{ background: 'white' }} value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder="e.g. Indore" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Code</label>
                  <input className="input" style={{ background: 'white' }} value={cityCode} onChange={(e) => setCityCode(e.target.value)} placeholder="e.g. indore" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>ULB Code</label>
                  <input
                    className="input"
                    style={{ background: 'white' }}
                    value={cityUlbCode}
                    onChange={(e) => setCityUlbCode(e.target.value)}
                    placeholder="Enter ULB code (e.g. idr01)"
                  />
                </div>

                <button className="btn btn-primary" style={{ marginTop: 12, width: '100%', background: '#1e3a8a' }} type="submit">
                  Create City
                </button>
                {cityStatus && <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>{cityStatus}</div>}
              </form>
            </div>

            {/* Create Admin */}
            <div className="card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Create City Admin</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Assign an administrator to a city.</p>
              </div>
              <form onSubmit={handleCreateAdmin} className="form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>City</label>
                  <select
                    className="input"
                    style={{ background: 'white' }}
                    value={adminCityId}
                    onChange={(e) => setAdminCityId(e.target.value)}
                    required
                  >
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Name</label>
                  <input
                    className="input"
                    style={{ background: 'white' }}
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Administrator Name"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Email</label>
                  <input
                    className="input"
                    style={{ background: 'white' }}
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@city.local"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Password</label>
                  <input
                    className="input"
                    style={{ background: 'white' }}
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button className="btn btn-primary" style={{ marginTop: 12, width: '100%', background: '#1e3a8a' }} type="submit">
                  Create Admin
                </button>
                {adminStatus && <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>{adminStatus}</div>}
              </form>
            </div>
          </div>
        </>
      )}
      {editingCity && (
        <EditCityModal
          city={editingCity}
          onClose={() => setEditingCity(null)}
          onSave={handleUpdateCity}
        />
      )}
    </div>
  );
}

function EditCityModal({ city, onClose, onSave }: { city: CityRow; onClose: () => void; onSave: (id: string, data: any) => Promise<void> }) {
  const [name, setName] = useState(city.name);
  const [code, setCode] = useState(city.code);
  const [ulbCode, setUlbCode] = useState(city.ulbCode || "");
  const [adminName, setAdminName] = useState(city.cityAdmin?.name || "");
  const [adminEmail, setAdminEmail] = useState(city.cityAdmin?.email || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(city.id, {
        name,
        code,
        ulbCode,
        adminName,
        adminEmail
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card" style={{
        width: '90%', maxWidth: '400px', padding: 0, overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Edit City Details</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 6 }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form" style={{ padding: 24, gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>City Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pune"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>City Code</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. pune"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>ULB Code</label>
            <input
              className="input"
              value={ulbCode}
              onChange={(e) => setUlbCode(e.target.value)}
              placeholder="e.g. pn01"
              required
            />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0', paddingTop: '16px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Details</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Admin Name</label>
            <input
              className="input"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Admin Email</label>
            <input
              className="input"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="e.g. admin@city.local"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, background: '#1e3a8a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
