'use client';
import { useAuthStore } from '@/store/auth';
import { fetchDriverMyOrders, completeOrder, DriverOrder } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import LiveChatWidget from '@/components/LiveChatWidget';

export default function DriverMyOrders() {
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeChatOrder, setActiveChatOrder] = useState<DriverOrder | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchDriverMyOrders(token).then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, [token]);

  const handleComplete = async (orderId: string) => {
    if (!token) return;
    if (!confirm('Bạn xác nhận đã giao đơn hàng này thành công tới khách hàng?')) return;
    try {
      await completeOrder(orderId, token);
      alert('Tuyệt vời, chúc mừng bạn đã hoàn thành chuyến xe!');
      // Refresh
      const data = await fetchDriverMyOrders(token);
      setOrders(data);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hoàn thành đơn');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  const deliveringOrders = orders.filter((o) => o.status === 'DELIVERING');
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-inter text-gray-800">Quản Lý Đơn Hàng Của Mình</h1>
      
      <section>
        <h2 className="text-lg font-bold font-inter text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse"></span>
            Đơn Đang Giao ({deliveringOrders.length})
        </h2>
        
        {deliveringOrders.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Tuyệt vời, bạn không có đơn đang chờ giao.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deliveringOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden flex flex-col relative pb-4">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 to-primary"></div>
                <div className="p-4 border-b bg-orange-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
                      Đang Giao
                    </span>
                    <span className="text-sm text-gray-500 font-medium">#{order.id.slice(0,8).toUpperCase()}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{order.store?.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    <span className="font-semibold text-gray-600">Lấy tại:</span> {order.store?.address}
                  </p>
                </div>
                
                <div className="p-4 flex-1">
                  <p className="text-sm text-gray-600 mb-2 mt-1">
                    <span className="font-semibold text-gray-800">Giao đến:</span> {order.deliveryAddress}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-gray-800">SĐT Khách:</span> <a href={`tel:${order.deliveryPhone}`} className="text-blue-600 font-medium hover:underline">{order.deliveryPhone || '---'}</a>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">Cửa hàng:</span> <a href={`tel:${order.store?.phone}`} className="text-blue-600 font-medium hover:underline">{order.store?.phone || '---'}</a>
                  </p>
                  <div className="my-4 border-t border-dashed border-gray-200"></div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                     <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Thu Khách</p>
                        <p className="text-gray-900 font-bold">{order.total.toLocaleString()}đ</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Phí Ship</p>
                        <p className="text-primary font-bold">+{order.shippingFee.toLocaleString()}đ</p>
                     </div>
                  </div>
                </div>

                  <button
                    onClick={() => handleComplete(order.id)}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 hover:shadow-lg transition-all focus:ring-4 focus:ring-green-200"
                  >
                    Hoàn Thành Đơn
                  </button>
                  <button
                    onClick={() => setActiveChatOrder(order)}
                    className="w-full py-3 mt-2 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary-50 transition-colors"
                  >
                    Chat với Khách
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold font-inter text-gray-700 mb-4">Lịch Sử Giao Hàng</h2>
        
        {completedOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có lịch sử.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b text-gray-600 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="p-4">Mã Đơn</th>
                  <th className="p-4">Thời Gian</th>
                  <th className="p-4">Cửa Hàng</th>
                  <th className="p-4">Phí Giao</th>
                  <th className="p-4 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {completedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono font-medium text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-4 font-medium min-w-[200px] max-w-[300px] truncate">{order.store?.name}</td>
                    <td className="p-4 text-green-600 font-bold">+{order.shippingFee.toLocaleString()}đ</td>
                    <td className="p-4 text-right">
                       <span className="inline-block px-2.5 py-1 text-[11px] font-bold bg-green-100 text-green-700 rounded-md">
                         HOÀN THÀNH
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Live Chat with Customer */}
      {activeChatOrder && activeChatOrder.user && user && (
        <LiveChatWidget 
          orderId={activeChatOrder.id}
          receiverId={activeChatOrder.user.id}
          receiverName={activeChatOrder.user.name}
          receiverRole="CUSTOMER"
          currentUserId={user.id}
        />
      )}
    </div>
  );
}
