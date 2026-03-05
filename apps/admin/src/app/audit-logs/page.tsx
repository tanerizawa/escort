'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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
      setLogs(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const severityColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-700',
    WARN: 'bg-yellow-100 text-yellow-700',
    CRITICAL: 'bg-red-100 text-red-700',
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.severity}
          onChange={(e) => { setFilters({ ...filters, severity: e.target.value }); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Semua Severity</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <select
          value={filters.action}
          onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm"
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
          className="rounded-lg border px-3 py-2 text-sm w-72"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
          Tidak ada audit log
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      severityColors[log.severity] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 text-xs">
                    {log.resource}
                    {log.resourceId && (
                      <span className="text-gray-400">:{log.resourceId.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">
                    {log.userId ? log.userId.slice(0, 8) + '...' : 'system'}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress || '—'}</td>
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
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Hal {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
