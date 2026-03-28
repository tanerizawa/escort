'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  severity: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    resource: '',
    userId: '',
  });

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (filters.action) params.set('action', filters.action);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.resource) params.set('resource', filters.resource);
      if (filters.userId) params.set('userId', filters.userId);

      const res = await api.get(`/admin/audit-logs?${params}`);
      const payload = res.data?.data || res.data;
      const list = payload?.data || payload;
      setLogs(Array.isArray(list) ? list : []);
      setTotalPages(payload?.pagination?.totalPages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const severityColors: Record<string, string> = {
    INFO: 'bg-sky-400/10 text-sky-400 border border-sky-400/30',
    WARN: 'bg-amber-400/10 text-amber-400 border border-amber-400/30',
    CRITICAL: 'bg-red-400/10 text-red-400 border border-red-400/30',
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Audit Logs</h1>
        <p className="mt-1 text-sm text-dark-400">Log aktivitas sistem dan keamanan</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.severity}
          onChange={(e) => { setFilters({ ...filters, severity: e.target.value }); setPage(1); }}
          className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
        >
          <option value="">Semua Severity</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <select
          value={filters.action}
          onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
          className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
        >
          <option value="">Semua Action</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGIN_2FA">LOGIN_2FA</option>
          <option value="2FA_ENABLED">2FA_ENABLED</option>
          <option value="2FA_DISABLED">2FA_DISABLED</option>
          <option value="2FA_FAILED">2FA_FAILED</option>
          <option value="SOS_TRIGGER">SOS_TRIGGER</option>
          <option value="GEOFENCE_BREACH">GEOFENCE_BREACH</option>
          <option value="LOCATION_VIEW">LOCATION_VIEW</option>
          <option value="LATE_CHECKIN_ALERT">LATE_CHECKIN_ALERT</option>
          <option value="OVERTIME_ALERT">OVERTIME_ALERT</option>
        </select>
        <input
          type="text"
          placeholder="User ID..."
          value={filters.userId}
          onChange={(e) => { setFilters({ ...filters, userId: e.target.value }); setPage(1); }}
          className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 w-72"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
          Tidak ada audit log
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dark-700/50">
          <table className="w-full text-sm">
            <thead className="bg-dark-800/50">
              <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-800/30">
                  <td className="px-4 py-3 text-xs text-dark-300 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      severityColors[log.severity] || 'bg-dark-700/30 text-dark-400'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-dark-200">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-dark-300">
                    {log.resource}
                    {log.resourceId && (
                      <span className="text-dark-500">:{log.resourceId.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-dark-300">
                    {log.userId ? log.userId.slice(0, 8) + '...' : 'system'}
                  </td>
                  <td className="px-4 py-3 text-xs text-dark-400 max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-dark-500">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-dark-400">
            Hal {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
