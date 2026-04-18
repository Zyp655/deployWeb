'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { fetchOrderById, createSepayPayment } from '@/lib/api/client';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function SepayPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  const [order, setOrder] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial info
  useEffect(() => {
    if (!token) {
      // Allow auth store to initialize
      return;
    }

    const initPayment = async () => {
      try {
        const orderData = await fetchOrderById(unwrappedParams.id, token);
        setOrder(orderData);
        
        if (orderData.status !== 'PENDING') {
           router.push(`/orders/${orderData.id}`);
           return;
        }

        const paymentInfo = await createSepayPayment(orderData.id, orderData.total, token);
        if (paymentInfo.success) {
          setQrUrl(paymentInfo.qrUrl);
          setBankInfo({
            bankName: paymentInfo.bankName,
            accountNumber: paymentInfo.accountNumber,
            content: paymentInfo.content,
            amount: orderData.total,
          });
        } else {
          setError('Không thể tạo mã thanh toán QR');
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    
    initPayment();
  }, [token, unwrappedParams.id, router]);

  // Polling mechanism
  useEffect(() => {
    if (!token || !order || order.status !== 'PENDING') return;

    const interval = setInterval(async () => {
       try {
         const updatedOrder = await fetchOrderById(unwrappedParams.id, token);
         if (updatedOrder.status !== 'PENDING') {
            clearInterval(interval);
            router.push(`/orders/${updatedOrder.id}`);
         }
       } catch (err) {
         console.warn('Lỗi khi kiểm tra trạng thái đơn hàng', err);
       }
    }, 4000); // Check every 4 seconds

    return () => clearInterval(interval);
  }, [token, order, unwrappedParams.id, router]);

  if (!user || loading) {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
       </div>
     );
  }

  if (error) {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
         <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
            <h2 className="text-red-500 font-bold text-xl mb-2">Lỗi thanh toán</h2>
            <p className="text-gray-600 text-sm mb-6">{error}</p>
            <button 
              onClick={() => router.push(`/orders/${unwrappedParams.id}`)}
              className="bg-primary text-white font-bold py-3 px-6 rounded-xl w-full hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Quay lại đơn hàng
            </button>
         </div>
       </div>
     );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
       <div className="max-w-md mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-accent p-6 text-center text-white">
             <h1 className="text-2xl font-extrabold mb-1">Thanh toán VietQR</h1>
             <p className="text-white/90 text-sm font-medium">Đơn hàng tự động duyệt từ 10-30 giây</p>
          </div>
          
          <div className="p-8 pb-10">
             {qrUrl ? (
                <div className="flex flex-col items-center">
                   <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 mb-6 relative w-64 h-64 flex items-center justify-center overflow-hidden">
                      {/* Bỏ next/image thay bằng thẻ img để load QR external dễ hơn */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={qrUrl} 
                        alt="Mã VietQR" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                   </div>
                   
                   <p className="text-sm text-gray-500 mb-4 text-center leading-relaxed">
                     Mở ứng dụng ngân hàng trên điện thoại để quét mã QR hoặc chuyển khoản thủ công.
                   </p>

                   {bankInfo && (
                     <div className="w-full bg-gray-50/50 rounded-xl p-4 space-y-3 mb-6 border border-gray-100/50">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-500">Ngân hàng</span>
                           <span className="font-bold text-gray-900">{bankInfo.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-500">Số tài khoản</span>
                           <span className="font-bold text-gray-900 flex items-center gap-2">
                             {bankInfo.accountNumber}
                             <button 
                               onClick={() => navigator.clipboard.writeText(bankInfo.accountNumber)}
                               className="text-primary hover:text-accent transition-colors"
                               title="Sao chép"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                 <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                 <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                               </svg>
                             </button>
                           </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-500">Số tiền</span>
                           <span className="font-extrabold text-primary text-base flex items-center gap-2">
                             {formatPrice(bankInfo.amount)}
                             <button 
                               onClick={() => navigator.clipboard.writeText(bankInfo.amount.toString())}
                               className="text-primary hover:text-accent transition-colors"
                               title="Sao chép"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                 <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                 <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                               </svg>
                             </button>
                           </span>
                        </div>
                        <div className="border-t border-gray-200/60 pt-3 mt-1 flex justify-between items-center text-sm">
                           <span className="text-gray-500 font-medium">Nội dung CK</span>
                           <span className="font-black text-gray-900 bg-yellow-100/80 px-2 py-1 rounded tracking-widest border border-yellow-200/50 flex items-center gap-2">
                             {bankInfo.content}
                             <button 
                               onClick={() => navigator.clipboard.writeText(bankInfo.content)}
                               className="text-yellow-600 hover:text-yellow-700 transition-colors"
                               title="Sao chép"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                 <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                 <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                               </svg>
                             </button>
                           </span>
                        </div>
                     </div>
                   )}

                   <div className="flex items-center justify-center gap-3 w-full bg-blue-50/50 py-3 rounded-xl border border-blue-100 mt-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-primary font-bold text-sm tracking-wide">Đang chờ thanh toán...</span>
                   </div>
                </div>
             ) : (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-primary animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 font-medium text-sm">Đang khởi tạo giao dịch...</p>
                </div>
             )}
          </div>
          
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 text-center">
            <button 
              onClick={() => router.push(`/orders/${unwrappedParams.id}`)}
              className="text-gray-500 font-semibold text-sm hover:text-gray-800 transition"
            >
              Tôi đã thanh toán, xem đơn hàng ngay
            </button>
          </div>
       </div>
    </main>
  );
}
