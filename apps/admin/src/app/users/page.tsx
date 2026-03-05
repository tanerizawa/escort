'use client';

import { useState } from 'react';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  status: string;
}

export default function AdminUsersPage() {
  const [users] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">User Management</h1>
          <p className="mt-1 text-sm text-dark-400">Kelola semua user terdaftar di platform</p>
        </div>
        <span className="rounded-full bg-dark-700/50 px-3 py-1 text-xs text-dark-300">
          Total: {users.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
        >
          <option value="ALL">Semua Role</option>
          <option value="CLIENT">Client</option>
          <option value="ESCORT">Escort</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-dark-700/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-dark-700/50 bg-dark-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-dark-300">Nama</th>
              <th className="px-4 py-3 font-medium text-dark-300">Email</th>
              <th className="px-4 py-3 font-medium text-dark-300">Role</th>
              <th className="px-4 py-3 font-medium text-dark-300">Status</th>
              <th className="px-4 py-3 font-medium text-dark-300">Terdaftar</th>
              <th className="px-4 py-3 font-medium text-dark-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-dark-500">
                  Belum ada data user. Data akan muncul setelah backend terhubung.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-dark-700/30 hover:bg-dark-800/30">
                  <td className="px-4 py-3 text-dark-200">{user.fullName}</td>
                  <td className="px-4 py-3 text-dark-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' :
                      user.role === 'ESCORT' ? 'bg-brand-400/10 text-brand-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`h-2 w-2 rounded-full ${user.isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </td>
                  <td className="px-4 py-3 text-dark-400">{user.createdAt}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-400 hover:text-brand-300">Detail</button>
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
