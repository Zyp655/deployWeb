'use client';

import { useAuthStore } from '@/store/auth';
import { fetchAdminUsers, updateUserRole, toggleBlockUser, AdminUser } from '@/lib/api/client';
import { useEffect, useState } from 'react';

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700' },
  RESTAURANT: { label: 'Restaurant', color: 'bg-purple-100 text-purple-700' },
  CUSTOMER: { label: 'Customer', color: 'bg-blue-100 text-blue-700' },
};

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    if (token) {
      fetchAdminUsers(token, roleFilter || undefined)
        .then(setUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token, roleFilter]);

  const handleRoleUpdate = async () => {
    if (!token || !editingUser) return;
    try {
      await updateUserRole(editingUser.id, editRole, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, role: editRole } : u)),
      );
      setEditingUser(null);
    } catch (err) { console.error(err); }
  };

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    if (!token) return;
    try {
      await toggleBlockUser(userId, !currentBlocked, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: !currentBlocked } : u)),
      );
    } catch (err) { console.error(err); }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-extrabold text-gray-900">👥 Quản lý Người dùng</h2>
        <p className="text-gray-500 mt-1">Xem, phân quyền và quản lý tài khoản người dùng</p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setLoading(true); }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:border-primary focus:outline-none"
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="RESTAURANT">Restaurant</option>
          <option value="CUSTOMER">Customer</option>
        </select>
        <span className="text-sm text-gray-500">
          {filtered.length}/{users.length} người dùng
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Người dùng</th>
                <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Vai trò</th>
                <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Đơn hàng</th>
                <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const role = ROLE_BADGES[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700' };
                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${role.color}`}>{role.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className={`text-xs font-semibold ${user.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                          {user.isBlocked ? 'Bị khoá' : 'Hoạt động'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-700">{user._count.orders}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingUser(user); setEditRole(user.role); }}
                          className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa vai trò"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                          className={`rounded-lg p-2 transition-colors ${
                            user.isBlocked
                              ? 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                              : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                          }`}
                          title={user.isBlocked ? 'Mở khoá' : 'Khoá tài khoản'}
                        >
                          {user.isBlocked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl p-6 shadow-2xl animate-in">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Chỉnh sửa vai trò</h3>
            <p className="text-sm text-gray-500 mb-4">{editingUser.name} ({editingUser.email})</p>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none mb-4"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="ADMIN">Admin</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setEditingUser(null)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Huỷ
              </button>
              <button onClick={handleRoleUpdate} className="flex-1 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all active:scale-[0.98]">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
