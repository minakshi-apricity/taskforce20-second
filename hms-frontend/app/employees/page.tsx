'use client';

import { useEffect, useMemo, useState } from "react";
import { EmployeesApi } from "@lib/apiClient";
import { FilterTabs, RecordsTable, TableColumn } from "../modules/qc-shared";

type Employee = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  modules: { key: string; name: string }[];
  zones: string[];
  wards: string[];
  createdAt?: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string>('ALL');
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await EmployeesApi.list();
      const mapped = (data.employees || []).map((e: any) => ({
        ...e,
        modules: (e.modules || []).map((m: any) => ({ key: m.key, name: m.name || m.key }))
      }));
      setEmployees(mapped);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  };

  const moduleTabs = useMemo(() => {
    const all = new Set<string>();
    employees.forEach(e => e.modules.forEach(m => all.add(m.key)));
    const tabs = Array.from(all).map(key => ({
      id: key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }));
    // Sort tabs alphabetically
    tabs.sort((a, b) => a.label.localeCompare(b.label));

    return [
      { id: 'ALL', label: 'All Modules' },
      ...tabs
    ];
  }, [employees]);

  const filtered = useMemo(() => {
    let result = employees;
    if (activeModule !== 'ALL') {
      result = result.filter(e => e.modules.some(m => m.key === activeModule));
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(lower) ||
        e.email.toLowerCase().includes(lower) ||
        (e.phone && e.phone.includes(lower))
      );
    }
    return result;
  }, [employees, activeModule, search]);

  const columns: TableColumn<Employee>[] = [
    {
      key: 'name',
      label: 'Employee',
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-neutral-focus text-neutral-content rounded-full w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 font-bold">
              <span className="text-xs">{e.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div>
            <div className="font-bold">{e.name}</div>
            <div className="text-xs muted">{e.role}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (e) => (
        <div className="text-sm">{e.email}</div>
      )
    },
    {
      key: 'phone',
      label: 'Mobile No',
      render: (e) => (
        <div className="text-sm">{e.phone || <span className="muted">-</span>}</div>
      )
    },
    {
      key: 'modules',
      label: 'Modules',
      render: (e) => (
        <div className="flex flex-wrap gap-1">
          {e.modules.map(m => (
            <span key={m.key} className="badge badge-sm badge-ghost">{m.name || m.key}</span>
          ))}
        </div>
      )
    },
    {
      key: 'location',
      label: 'Zone / Ward',
      render: (e) => (
        <div className="text-xs max-w-xs break-words">
          {[...e.zones, ...e.wards].length ? [...e.zones, ...e.wards].join(", ") : <span className="muted">-</span>}
        </div>
      )
    }
  ];

  return (
    <div className="content">
      <section className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Employees</h1>
            <p className="muted text-sm">Manage access and assignments across modules.</p>
          </div>
          <div className="badge badge-neutral">{employees.length} Total</div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Controls Row */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              className="input input-bordered w-full md:w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FilterTabs
              tabs={moduleTabs}
              activeTab={activeModule}
              onChange={(id) => setActiveModule(id)}
            />
          </div>
        </div>
      </section>

      <section className="card">
        <RecordsTable<Employee>
          rows={filtered}
          columns={columns}
          loading={loading}
          emptyMessage="No employees found matching criteria."
        />
      </section>
    </div>
  );
}
