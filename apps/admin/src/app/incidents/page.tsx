'use client';

import { useState, useEffect, useCallback } from 'react';

interface Incident {
  id: string;
  type: string;
  severity: string;
  description: string;
  resolutionStatus: string;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter: { firstName: string; lastName: string; email: string };
  booking: {
    id: string;
    serviceType: string;
    client: { firstName: string; lastName: string };
    escort: { firstName: string; lastName: string };
  } | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-500/10 text-red-400 border-red-500/20',
  INVESTIGATING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DISMISSED: 'bg-dark-600/50 text-dark-400 border-dark-600/30',
};

const TYPE_LABELS: Record<string, string> = {
  SOS: 'SOS Emergency',
  HARASSMENT: 'Pelecehan',
  FRAUD: 'Penipuan',
  SAFETY: 'Keamanan',
  SERVICE: 'Layanan',
  PAYMENT: 'Pembayaran',
  OTHER: 'Lainnya',
};

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('OPEN');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        ...(activeTab !== 'ALL' ? { status: activeTab } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/incidents?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIncidents(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch {
      /* handle silently */
    } finally {
      setLoading(false);
    }
  }, [activeTab, typeFilter, pagination.page]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleResolve = async (incidentId: string) => {
    if (!adminNotes.trim()) return;
    setResolving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/disputes/${incidentId}/resolve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
          },
          body: JSON.stringify({ adminNotes }),
        },
      );

      if (res.ok) {
        setSelectedIncident(null);
        setAdminNotes('');
        fetchIncidents();
      }
    } catch {
      /* handle silently */
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusTabs = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED', 'ALL'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">Incident Management</h1>
          <p className="mt-1 text-sm text-dark-400">
            Monitor dan tangani laporan insiden, SOS, dan keluhan keamanan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-red-400">
              {incidents.filter((i) => i.resolutionStatus === 'OPEN' && i.severity === 'CRITICAL').length} Critical
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open', count: incidents.filter((i) => i.resolutionStatus === 'OPEN').length, color: 'text-red-400' },
          { label: 'Investigating', count: incidents.filter((i) => i.resolutionStatus === 'INVESTIGATING').length, color: 'text-yellow-400' },
          { label: 'Resolved', count: incidents.filter((i) => i.resolutionStatus === 'RESOLVED').length, color: 'text-emerald-400' },
          { label: 'Total', count: pagination.total, color: 'text-dark-200' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-dark-700/30 bg-dark-800/30 p-4">
            <p className="text-sm text-dark-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Status Tabs */}
        <div className="flex gap-1 rounded-lg bg-dark-800/50 p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-dark-700 text-dark-100'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab === 'ALL' ? 'Semua' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-1.5 text-sm text-dark-200"
        >
          <option value="">Semua Tipe</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-dark-800/30" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-dark-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="mt-3 text-dark-400">Tidak ada insiden ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => {
                setSelectedIncident(incident);
                setAdminNotes(incident.adminNotes || '');
              }}
              className="cursor-pointer rounded-xl border border-dark-700/30 bg-dark-800/20 p-5 transition-colors hover:border-dark-600/50 hover:bg-dark-800/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {/* Type Badge */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      incident.type === 'SOS' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-dark-600/30 bg-dark-700/50 text-dark-300'
                    }`}>
                      {incident.type === 'SOS' && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      )}
                      {TYPE_LABELS[incident.type] || incident.type}
                    </span>

                    {/* Severity Badge */}
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.LOW}`}>
                      {incident.severity}
                    </span>

                    {/* Status Badge */}
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[incident.resolutionStatus] || STATUS_COLORS.OPEN}`}>
                      {incident.resolutionStatus}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-dark-200 line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-dark-400">
                    <span>
                      Pelapor: <span className="text-dark-300">{incident.reporter.firstName} {incident.reporter.lastName}</span>
                    </span>
                    {incident.booking && (
                      <span>
                        Booking: <span className="text-dark-300">{incident.booking.client.firstName} ↔ {incident.booking.escort.firstName}</span>
                      </span>
                    )}
                    <span>{formatDate(incident.createdAt)}</span>
                  </div>
                </div>

                <svg className="h-5 w-5 flex-shrink-0 text-dark-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="rounded-lg border border-dark-700/30 px-3 py-1.5 text-sm text-dark-300 transition-colors hover:bg-dark-800/50 disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-sm text-dark-400">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="rounded-lg border border-dark-700/30 px-3 py-1.5 text-sm text-dark-300 transition-colors hover:bg-dark-800/50 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-2xl border border-dark-700/30 bg-dark-900 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-dark-100">Detail Insiden</h2>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[selectedIncident.severity]}`}>
                    {selectedIncident.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-dark-500">ID: {selectedIncident.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info */}
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                  <p className="text-xs text-dark-500">Tipe</p>
                  <p className="mt-0.5 text-sm text-dark-200">{TYPE_LABELS[selectedIncident.type] || selectedIncident.type}</p>
                </div>
                <div className="rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                  <p className="text-xs text-dark-500">Status</p>
                  <p className="mt-0.5 text-sm text-dark-200">{selectedIncident.resolutionStatus}</p>
                </div>
                <div className="rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                  <p className="text-xs text-dark-500">Pelapor</p>
                  <p className="mt-0.5 text-sm text-dark-200">{selectedIncident.reporter.firstName} {selectedIncident.reporter.lastName}</p>
                  <p className="text-xs text-dark-500">{selectedIncident.reporter.email}</p>
                </div>
                <div className="rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                  <p className="text-xs text-dark-500">Waktu Laporan</p>
                  <p className="mt-0.5 text-sm text-dark-200">{formatDate(selectedIncident.createdAt)}</p>
                </div>
              </div>

              {selectedIncident.booking && (
                <div className="rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                  <p className="text-xs text-dark-500">Terkait Booking</p>
                  <p className="mt-0.5 text-sm text-dark-200">
                    {selectedIncident.booking.client.firstName} {selectedIncident.booking.client.lastName} ↔{' '}
                    {selectedIncident.booking.escort.firstName} {selectedIncident.booking.escort.lastName}
                  </p>
                  <p className="text-xs text-dark-500">{selectedIncident.booking.serviceType} • {selectedIncident.booking.id.slice(0, 8)}</p>
                </div>
              )}

              <div className="rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                <p className="text-xs text-dark-500">Deskripsi</p>
                <p className="mt-1 text-sm leading-relaxed text-dark-200">{selectedIncident.description}</p>
              </div>

              {selectedIncident.resolvedAt && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs text-emerald-500">Resolved pada {formatDate(selectedIncident.resolvedAt)}</p>
                  {selectedIncident.adminNotes && (
                    <p className="mt-1 text-sm text-dark-300">{selectedIncident.adminNotes}</p>
                  )}
                </div>
              )}

              {/* Resolution Form */}
              {selectedIncident.resolutionStatus !== 'RESOLVED' && selectedIncident.resolutionStatus !== 'DISMISSED' && (
                <div className="space-y-3 border-t border-dark-700/30 pt-4">
                  <p className="text-sm font-medium text-dark-200">Resolve Insiden</p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Catatan admin: tindakan yang diambil, hasil investigasi..."
                    rows={4}
                    className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedIncident(null)}
                      className="rounded-lg border border-dark-700/30 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-800"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => handleResolve(selectedIncident.id)}
                      disabled={resolving || !adminNotes.trim()}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {resolving ? 'Memproses...' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
