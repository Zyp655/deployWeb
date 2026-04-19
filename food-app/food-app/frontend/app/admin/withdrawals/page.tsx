'use client';

import { useAuthStore } from '@/store/auth';
import { fetchAdminWithdrawals, approveWithdrawal, WithdrawalRequest } from '@/lib/api/client';
import { useEffect, useState } from 'react';

export default function AdminWithdrawalsPage() {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    if (token) loadRequests();
  }, [token]);

  const loadRequests = async () => {
    try {
      const data = await fetchAdminWithdrawals(token!);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, amount: number, bankInfo: string) => {
    if (!window.confirm(`Bạn ĐÃ chuyển khoản ${new Intl.NumberFormat('vi-VN').format(amount)}đ tới [${bankInfo}] chưa?\nChỉ Bấm OK nếu tiền đã rời khỏi tài khoản Admin!`)) return;

    try {
      await approveWithdrawal(id, token!);
      alert('Đã phê duyệt thành công!');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Phê duyệt thất bại!');
    }
  };

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  if (loading) return <div className="h-64 bg-white rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">💸 Rút tiền & Thanh toán</h2>
          <p className="text-[#5b403d] mt-1 text-sm">Quản lý duyệt lệnh rút tiền của Seller và Driver</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 max-w-sm">
          <p className="text-amber-800 text-xs font-bold mb-1">⚠️ Quy trình xử lý:</p>
          <ul className="text-amber-700 text-xs space-y-1 list-disc pl-4">
            <li>Admin mở ứng dụng ngân hàng thật.</li>
            <li>Chuyển tiền theo thông tin trong bảng.</li>
            <li>Nhấn "Phê duyệt" để trừ tiền trong hệ thống.</li>
          </ul>
        </div>
      </header>

      <div className="flex gap-1.5 bg-[#efecff] p-1 rounded-xl w-fit">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === st ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#5b403d] hover:text-[#1a1a2e]'
            }`}
          >
            {st === 'ALL' ? 'Tất cả' : st === 'PENDING' ? 'Chờ duyệt' : st === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
            {st !== 'ALL' && ` (${requests.filter(r => r.status === st).length})`}
          </button>
        ))}
      </div>

      <div className="ds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-medium text-sm whitespace-nowrap">
            <thead>
              <tr>
                <th className="ds-table-head px-6 py-4">Mã GD</th>
                <th className="ds-table-head px-6 py-4">Đối tác</th>
                <th className="ds-table-head px-6 py-4">Số tiền</th>
                <th className="ds-table-head px-6 py-4">Thông tin Bank</th>
                <th className="ds-table-head px-6 py-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#906f6c]">Không có yêu cầu nào</td>
                </tr>
              ) : filtered.map((req) => {
                const isPending = req.status === 'PENDING';
                const user = req.wallet?.user;
                const bankInfo = `${req.wallet?.bankName} - ${req.wallet?.bankAccount} - ${req.wallet?.bankAccountName}`;
                return (
                  <tr key={req.id} className="ds-table-row border-b border-[#efecff]">
                    <td className="px-6 py-4 font-mono text-[#1a1a2e] text-xs">#{req.id.slice(0,6)}<br/><span className="text-[#906f6c] text-[10px]">{new Date(req.createdAt).toLocaleString('vi-VN')}</span></td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1a1a2e]">{user?.name || 'Unknown'}</p>
                      <p className="text-xs text-[#906f6c]">{user?.role === 'RESTAURANT' ? '🏪 Quán ăn (Seller)' : '🏍️ Tài xế (Driver)'}</p>
                    </td>
                    <td className="px-6 py-4 text-primary font-black text-lg">{new Intl.NumberFormat('vi-VN').format(req.amount)}đ</td>
                    <td className="px-6 py-4">
                      {req.wallet?.bankName ? (
                        <div className="bg-[#f8f6ff] p-2 rounded-lg border border-[#e4beb9] inline-block">
                          <p className="text-xs font-bold text-[#1a1a2e] whitespace-pre-wrap">{bankInfo.split(' - ').join('\n')}</p>
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs">Thiếu thông tin</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isPending ? (
                        <button 
                          onClick={() => handleApprove(req.id, req.amount, bankInfo)}
                          className="ds-btn px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 text-xs"
                        >
                          ✅ Phê duyệt (Đã CK)
                        </button>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {req.status === 'APPROVED' ? '✅ Đã duyệt' : '❌ Đã từ chối'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
