'use client';

import { useState, useEffect } from 'react';
import { fetchMyPartnerRequests, createPartnerRequest } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function PartnerRegisterPage() {
  const token = useAuthStore(s => s.token);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [partnerType, setPartnerType] = useState<'SELLER' | 'DRIVER'>('SELLER');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('MOTORBIKE');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (token) {
      fetchMyRequests();
    }
  }, [user, token]);

  const fetchMyRequests = async () => {
    try {
      const data = await fetchMyPartnerRequests(token as string);
      const pending = data.find((req: any) => req.status === 'PENDING');
      if (pending) {
        setPendingRequest(pending);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload: any = { type: partnerType };
      if (partnerType === 'SELLER') {
        payload.storeName = storeName;
        payload.storeAddress = storeAddress;
      } else {
        payload.vehicleType = vehicleType;
        payload.vehiclePlate = vehiclePlate;
        payload.idCardNumber = idCardNumber;
      }

      await createPartnerRequest(payload, token as string);
      alert('Gửi đơn đăng ký thành công! Vui lòng chờ Admin phê duyệt.');
      fetchMyRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đang chờ phê duyệt</h2>
          <p className="text-gray-500 mb-6">
            Yêu cầu trở thành {pendingRequest.type === 'SELLER' ? 'Nhà Hàng' : 'Tài Xế'} của bạn đang được Admin xem xét. Cảm ơn bạn đã kiên nhẫn!
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-primary text-white py-2 rounded-xl font-medium"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-400 to-rose-500 py-8 px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-2">Hợp tác cùng HOANG FOOD</h2>
          <p className="text-white/90">Trở thành đối tác kinh doanh hoặc giao hàng</p>
        </div>

        <div className="p-8">
          <div className="flex rounded-full bg-gray-100 p-1 mb-8">
            <button
              onClick={() => setPartnerType('SELLER')}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                partnerType === 'SELLER' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Cửa hàng
            </button>
            <button
              onClick={() => setPartnerType('DRIVER')}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                partnerType === 'DRIVER' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tài xế
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

            {partnerType === 'SELLER' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
                  <input
                    required
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="VD: Cơm Tấm Đêm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cửa hàng</label>
                  <input
                    required
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="VD: 123 Nguyễn Văn Cừ"
                  />
                </div>
              </>
            )}

            {partnerType === 'DRIVER' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại phương tiện</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  >
                    <option value="MOTORBIKE">Xe máy</option>
                    <option value="BICYCLE">Xe đạp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
                  <input
                    required
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="VD: 29H1-123.45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số CMND / CCCD</label>
                  <input
                    required
                    type="text"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="VD: 001000111222"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white rounded-xl py-3.5 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 mt-6"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
