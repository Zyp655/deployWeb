'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/partner-requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách đơn đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt đơn này?')) return;
    try {
      await api.patch(`/admin/partner-requests/${id}/approve`);
      alert('Phê duyệt thành công!');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Nhập lý do từ chối (bỏ trống nếu không có):');
    if (reason === null) return;
    try {
      await api.patch(`/admin/partner-requests/${id}/reject`, { reason });
      alert('Đã từ chối đơn!');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải biểu mẫu...</div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pastRequests = requests.filter(r => r.status !== 'PENDING');

  const renderTable = (data: any[], isPending: boolean) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-4 font-semibold text-gray-600 text-sm">Người dùng</th>
            <th className="p-4 font-semibold text-gray-600 text-sm">Loại</th>
            <th className="p-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
            <th className="p-4 font-semibold text-gray-600 text-sm">Chi tiết đăng ký</th>
            {isPending && <th className="p-4 font-semibold text-gray-600 text-sm text-right">Thao tác</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-gray-500">Không có dữ liệu</td>
            </tr>
          ) : (
            data.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-gray-900">{req.user.name}</div>
                  <div className="text-sm text-gray-500">{req.user.email}</div>
                  <div className="text-sm text-gray-500">{req.user.phone || 'Chưa cập nhật SĐT'}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                    req.type === 'SELLER' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {req.type === 'SELLER' ? 'QUÁN ĂN' : 'TÀI XẾ'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                    req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.status}
                  </span>
                  {req.status === 'REJECTED' && req.notes && (
                    <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={req.notes}>
                      Lý do: {req.notes}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    {req.type === 'SELLER' ? (
                      <>
                        <div><span className="text-gray-500 block">Tên quán:</span> <span className="font-medium">{req.storeName}</span></div>
                        <div className="mt-1"><span className="text-gray-500 block">Địa chỉ:</span> <span className="font-medium">{req.storeAddress}</span></div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-gray-500">Loại xe:</span> <span className="font-medium">{req.vehicleType}</span></div>
                        <div className="mt-1"><span className="text-gray-500">Biển số:</span> <span className="font-medium">{req.vehiclePlate}</span></div>
                        <div className="mt-1"><span className="text-gray-500">CCCD:</span> <span className="font-medium">{req.idCardNumber}</span></div>
                      </>
                    )}
                  </div>
                </td>
                {isPending && (
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-3 py-1.5 flex-inline items-center bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium text-sm transition-colors"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-3 py-1.5 flex-inline items-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors"
                    >
                      Từ chối
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn đăng ký Đối tác</h1>
        <p className="text-gray-500 mt-1">Phê duyệt hoặc từ chối các yêu cầu trở thành đối tác kinh doanh và tài xế.</p>
      </div>

      <h2 className="text-lg font-bold text-yellow-600 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        Đơn chờ duyệt ({pendingRequests.length})
      </h2>
      {renderTable(pendingRequests, true)}

      <h2 className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
        Lịch sử đơn từ (Đã duyệt & Đã từ chối)
      </h2>
      {renderTable(pastRequests, false)}
    </div>
  );
}
