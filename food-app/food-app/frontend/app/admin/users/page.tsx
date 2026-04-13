'use client';

import { useAuthStore } from '@/store/auth';
import { fetchAdminUsers, updateUserRole, toggleBlockUser, AdminUser } from '@/lib/api/client';
import { useEffect, useState } from 'react';

const ROLE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  ADMIN: { label: 'Admin', bg: 'bg-primary/10', text: 'text-primary' },
  RESTAURANT: { label: 'Seller', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  CUSTOMER: { label: 'Customer', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  DRIVER: { label: 'Driver', bg: 'bg-amber-500/10', text: 'text-amber-600' },
};

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'RESTAURANT', label: 'Nhà hàng' },
  { value: 'DRIVER', label: 'Tài xế' },
  { value: 'ADMIN', label: 'Admin' },
];

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
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, role: editRole } : u)));
      setEditingUser(null);
    } catch (err) { console.error(err); }
  };

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    if (!token) return;
    try {
      await toggleBlockUser(userId, !currentBlocked, token);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBlocked: !currentBlocked } : u)));
    } catch (err) { console.error(err); }
  };

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">👥 Quản lý Người dùng</h2>
        <p className="text-[#5b403d] mt-1 text-sm">Xem, phân quyền và quản lý tài khoản</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-[#efecff] p-1 rounded-xl">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setRoleFilter(f.value); setLoading(true); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                roleFilter === f.value ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#5b403d] hover:text-[#1a1a2e]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[240px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#906f6c]">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="ds-input pl-10"
          />
        </div>
        <span className="ds-label">{filtered.length}/{users.length}</span>
      </div>

      <div className="ds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="ds-table-head text-left px-5 py-4">Người dùng</th>
                <th className="ds-table-head text-left px-5 py-4">Vai trò</th>
                <th className="ds-table-head text-left px-5 py-4">Trạng thái</th>
                <th className="ds-table-head text-left px-5 py-4">Đơn hàng</th>
                <th className="ds-table-head text-left px-5 py-4">Ngày tạo</th>
                <th className="ds-table-head text-right px-5 py-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const role = ROLE_BADGES[user.role] || { label: user.role, bg: 'bg-gray-100', text: 'text-gray-700' };
                return (
                  <tr key={user.id} className="ds-table-row border-b border-[#efecff]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#1a1a2e]">{user.name}</p>
                          <p className="text-xs text-[#906f6c]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`ds-badge ${role.bg} ${role.text}`}>{role.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.isBlocked ? 'bg-primary' : 'bg-emerald-500'}`} />
                        <span className={`text-xs font-semibold ${user.isBlocked ? 'text-primary' : 'text-emerald-600'}`}>
                          {user.isBlocked ? 'Bị khoá' : 'Hoạt động'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-[#1a1a2e]">{user._count.orders}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-[#906f6c]">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingUser(user); setEditRole(user.role); }}
                          className="rounded-lg p-2 text-[#906f6c] hover:bg-[#efecff] hover:text-[#1a1a2e] transition-colors"
                          title="Chỉnh sửa vai trò"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                          className={`rounded-lg p-2 transition-colors ${user.isBlocked ? 'text-[#906f6c] hover:bg-emerald-50 hover:text-emerald-600' : 'text-[#906f6c] hover:bg-primary/5 hover:text-primary'}`}
                          title={user.isBlocked ? 'Mở khoá' : 'Khoá'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                          </svg>
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

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative z-10 w-full max-w-sm mx-4 ds-card p-6 animate-in">
            <h3 className="ds-heading text-lg font-bold text-[#1a1a2e] mb-1">Chỉnh sửa vai trò</h3>
            <p className="text-sm text-[#5b403d] mb-4">{editingUser.name} ({editingUser.email})</p>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="ds-input mb-4"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="DRIVER">Driver</option>
              <option value="ADMIN">Admin</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setEditingUser(null)} className="flex-1 rounded-xl bg-[#efecff] py-3 text-sm font-bold text-[#5b403d] hover:bg-[#e8e5ff] transition-colors">
                Huỷ
              </button>
              <button onClick={handleRoleUpdate} className="flex-1 ds-gradient-cta py-3 text-sm">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
