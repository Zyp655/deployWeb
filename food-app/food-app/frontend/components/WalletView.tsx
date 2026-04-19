'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { fetchMyWallet, updateBankAccount, requestWithdrawal, Wallet } from '@/lib/api/client';

export default function WalletView() {
  const { token } = useAuthStore();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  // Bank Form State
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (token) {
      loadWallet();
    }
  }, [token]);

  const loadWallet = async () => {
    try {
      const data = await fetchMyWallet(token!);
      setWallet(data);
      setBankName(data.bankName || '');
      setBankAccount(data.bankAccount || '');
      setBankAccountName(data.bankAccountName || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setIsUpdatingBank(true);
      const updated = await updateBankAccount({ bankName, bankAccount, bankAccountName }, token);
      setWallet(updated);
      alert('Cập nhật thông tin ngân hàng thành công!');
    } catch (err: any) {
      alert(err.message || 'Cập nhật thất bại!');
    } finally {
      setIsUpdatingBank(false);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !wallet) return;
    const amount = Number(withdrawAmount);
    if (amount <= 0 || amount > wallet.balance) {
      alert('Số tiền rút không hợp lệ!');
      return;
    }
    
    // Check if bank info is setup
    if (!wallet.bankName || !wallet.bankAccount || !wallet.bankAccountName) {
      alert('Vui lòng thiết lập thông tin ngân hàng trước khi rút tiền!');
      return;
    }

    try {
      setIsWithdrawing(true);
      await requestWithdrawal(amount, token);
      alert('Đã gửi yêu cầu rút tiền thành công!');
      setWithdrawAmount('');
      loadWallet(); // Reload to deduct balance
    } catch (err: any) {
      alert(err.message || 'Gửi yêu cầu rút tiền thất bại!');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-white rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">💳 Ví của tôi</h2>
        <p className="text-[#5b403d] mt-1 text-sm">Quản lý số dư, thông tin ngân hàng và rút tiền</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="lg:col-span-1 border-0 shadow-2xl bg-gradient-to-br from-[#1a1a2e] to-[#2d224f] rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full blur-xl -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <h3 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-2">Số dư khả dụng</h3>
            <p className="text-4xl font-black mb-6">
              {new Intl.NumberFormat('vi-VN').format(wallet?.balance || 0)}đ
            </p>

            <div className="bg-white/10 p-3 rounded-xl border border-white/5">
              <p className="text-white/60 text-xs font-semibold mb-1">Số dư đóng băng (Đang chờ rút)</p>
              <p className="text-lg font-bold text-amber-400">
                {new Intl.NumberFormat('vi-VN').format(wallet?.frozenBalance || 0)}đ
              </p>
            </div>
          </div>
        </div>

        {/* Bank & Withdraw */}
        <div className="lg:col-span-2 space-y-6">
          <div className="ds-card p-6">
            <h3 className="text-lg font-extrabold text-[#1a1a2e] mb-4 flex items-center gap-2">
              <span>🏦</span> Thông tin Ngân hàng
            </h3>
            <form onSubmit={handleUpdateBank} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-primary pl-4 bg-white">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#5b403d] mb-1">Ngân Hàng</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="ds-input bg-[#f8f6ff] w-full border border-[#efecff] text-[#1a1a2e]" 
                  required
                >
                  <option value="" disabled>Chọn ngân hàng</option>
                  <option value="Vietcombank">Vietcombank</option>
                  <option value="MBBank">MBBank</option>
                  <option value="Techcombank">Techcombank</option>
                  <option value="ACB">ACB</option>
                  <option value="VPBank">VPBank</option>
                  <option value="VIB">VIB</option>
                  <option value="Sacombank">Sacombank</option>
                  <option value="VietinBank">VietinBank</option>
                  <option value="TPBank">TPBank</option>
                  <option value="MSB">MSB</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5b403d] mb-1">Số Tài Khoản</label>
                <input 
                  type="text" 
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="ds-input bg-[#f8f6ff] w-full border border-[#efecff]" 
                  placeholder="Nhập số tài khoản"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5b403d] mb-1">Tên Chủ Tài Khoản</label>
                <input 
                  type="text" 
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="ds-input bg-[#f8f6ff] w-full border border-[#efecff]" 
                  placeholder="VD: NGUYEN VAN A"
                  required
                />
              </div>
              <div className="md:col-span-2 text-right mt-2">
                <button type="submit" disabled={isUpdatingBank} className="ds-btn-outline px-6 py-2 text-sm bg-primary/5">
                  {isUpdatingBank ? 'Đang cập nhật...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>

          <div className="ds-card p-6 border border-emerald-100 shadow-[0_4px_30px_rgba(16,185,129,0.1)]">
            <h3 className="text-lg font-extrabold text-[#1a1a2e] mb-4 flex items-center gap-2">
              <span>💸</span> Yêu cầu Rút Tiền
            </h3>
            <form onSubmit={handleWithdrawRequest} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#5b403d] mb-1">Số tiền muốn rút (VNĐ)</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="ds-input bg-[#f8f6ff] w-full text-lg font-bold" 
                  placeholder="VD: 500000"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isWithdrawing || !wallet?.balance || wallet.balance <= 0} 
                className="ds-btn px-6 bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                style={{ height: '52px' }}
              >
                {isWithdrawing ? 'Đang gửi...' : 'Rút Ngay'}
              </button>
            </form>
            <p className="text-xs text-[#906f6c] mt-2 italic">* Tiền sẽ được chuyển thẳng vào thẻ ngân hàng bạn đã thiết lập ở trên sau khi Admin duyệt.</p>
          </div>
        </div>
      </div>

      <div className="ds-card p-6">
        <h3 className="text-lg font-extrabold text-[#1a1a2e] mb-4">Lịch sử Biến động Số dư</h3>
        {(!wallet?.transactions || wallet.transactions.length === 0) ? (
          <div className="text-center py-10 bg-[#f8f6ff] rounded-xl border border-dashed border-[#d4cbd3]">
            <span className="text-3xl grayscale opacity-50">🧾</span>
            <p className="mt-2 text-[#906f6c] text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallet.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-[#f8f6ff] hover:bg-[#efecff] transition-colors border border-transparent">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-bold text-[#1a1a2e] text-sm">{tx.description}</p>
                    <p className="text-xs text-[#906f6c] mt-0.5">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className={`font-black tracking-tight ${tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(tx.amount)}đ
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
