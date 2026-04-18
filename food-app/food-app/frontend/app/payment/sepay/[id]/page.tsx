'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { fetchOrderById, createSepayPayment } from '@/lib/api/client';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function SepayPaymentPage({ params }: { params: { id: string } }) {
  const unwrappedParams = params;
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  const [order, setOrder] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

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

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || !qrUrl) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, qrUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user || loading) {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
       </div>
     );
  }

  if (error) {
     return (
       <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
         <div className="bg-white p-10 rounded-[2rem] shadow-[0_8px_24px_rgba(25,28,29,0.06)] text-center max-w-sm w-full">
            <h2 className="text-[#ba1a1a] font-bold text-2xl mb-3">Lỗi thanh toán</h2>
            <p className="text-[#5A4136] text-[15px] mb-8">{error}</p>
            <button 
              onClick={() => router.push(`/orders/${unwrappedParams.id}`)}
              className="bg-gradient-to-br from-[#FF6B00] to-[#A04100] text-white font-bold py-4 px-6 rounded-full w-full hover:shadow-lg active:scale-[0.98] transition-all"
            >
              Quay lại đơn hàng
            </button>
         </div>
       </div>
     );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] flex flex-col items-center py-12 px-4 font-sans">
       <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_8px_24px_rgba(25,28,29,0.06)] overflow-hidden">
          <div className="bg-gradient-to-br from-[#FF6B00] to-[#A04100] p-8 text-center text-white shadow-inner relative overflow-hidden">
             {/* Decorative element background */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
             
             <h1 className="text-[26px] font-extrabold tracking-tight mb-2 relative z-10">Thanh toán VietQR</h1>
             <p className="text-white/90 text-[15px] font-medium relative z-10">Hệ thống sẽ duyệt trong 10-30 giây</p>
          </div>
          
          <div className="p-8 pb-10">
             {qrUrl ? (
                timeLeft > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-[#FFDBCC] text-[#A04100] px-5 py-2.5 rounded-full text-sm font-bold mb-8 flex items-center gap-2 shadow-sm border border-[#FFB693]/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span>Hết hạn trong:</span>
                      <span className="font-mono text-base tracking-wider">{formatTime(timeLeft)}</span>
                    </div>

                    <div className="bg-white p-4 rounded-[2rem] shadow-[0_12px_36px_rgba(255,107,0,0.12)] mb-8 relative w-64 h-64 flex items-center justify-center overflow-hidden transition-all hover:scale-105 duration-300 ring-1 ring-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={qrUrl} 
                        alt="Mã VietQR" 
                        className="w-full h-full object-contain rounded-2xl"
                      />
                   </div>
                   
                   <p className="text-[15px] text-[#5A4136] mb-6 text-center leading-relaxed font-medium px-4">
                     Mở ứng dụng ngân hàng và <b>quét mã QR</b> hoặc chuyển khoản theo thông tin bên dưới:
                   </p>

                   {bankInfo && (
                     <div className="w-full bg-[#f3f4f5] rounded-[1.5rem] p-5 space-y-4 mb-8">
                        <div className="flex justify-between items-center text-[15px]">
                           <span className="text-[#5A4136]">Ngân hàng</span>
                           <span className="font-bold text-[#191C1D]">{bankInfo.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center text-[15px]">
                           <span className="text-[#5A4136]">Số tài khoản</span>
                           <span className="font-bold text-[#191C1D] flex items-center gap-2">
                             {bankInfo.accountNumber}
                             <button 
                               onClick={() => navigator.clipboard.writeText(bankInfo.accountNumber)}
                               className="text-[#FF6B00] hover:text-[#A04100] transition-colors p-1"
                               title="Sao chép"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                 <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                 <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                               </svg>
                             </button>
                           </span>
                        </div>
                        <div className="flex justify-between items-center text-[15px]">
                           <span className="text-[#5A4136]">Số tiền</span>
                           <span className="font-extrabold text-[#FF6B00] text-lg flex items-center gap-2">
                             {formatPrice(bankInfo.amount)}
                             <button 
                               onClick={() => navigator.clipboard.writeText(bankInfo.amount.toString())}
                               className="text-[#FF6B00] hover:text-[#A04100] transition-colors p-1"
                               title="Sao chép"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                 <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                 <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                               </svg>
                             </button>
                           </span>
                        </div>
                        
                        <div className="h-4"></div>

                        <div className="flex justify-between items-center text-[15px] bg-white p-3 px-4 rounded-xl shadow-sm">
                           <span className="text-[#5A4136] font-medium">Nội dung CK</span>
                           <span className="font-black text-[#191C1D] tracking-widest flex items-center gap-2">
                             {bankInfo.content}
                             <button 
                               onClick={() => navigator.clipboard.writeText(bankInfo.content)}
                               className="text-[#FF6B00] hover:text-[#A04100] transition-colors"
                               title="Sao chép"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                 <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                 <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                               </svg>
                             </button>
                           </span>
                        </div>
                     </div>
                   )}

                   <div className="flex items-center justify-center gap-3 w-full bg-[#FFB693]/20 py-4 rounded-[1rem] mt-2">
                      <div className="w-5 h-5 rounded-full border-[3px] border-[#FF6B00] border-t-transparent animate-spin" />
                      <span className="text-[#A04100] font-bold text-[15px] tracking-wide">Đang chờ thanh toán...</span>
                   </div>
                </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-6">
                    <div className="w-24 h-24 bg-[#f3f4f5] rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">
                      ⏱️
                    </div>
                    <h2 className="text-[#191C1D] font-bold text-2xl mb-3">Mã QR đã hết hạn</h2>
                    <p className="text-[#5A4136] text-[15px] mb-8 leading-relaxed">Xin lỗi, thời gian chờ đã kết thúc. Vui lòng quay lại thực đơn để đặt lại đơn hàng mới.</p>
                    <button 
                      onClick={() => router.push(`/menu`)}
                      className="bg-gradient-to-br from-[#FF6B00] to-[#A04100] text-white font-bold text-[15px] py-4 px-8 rounded-full w-full shadow-[0_8px_24px_rgba(255,107,0,0.25)] hover:shadow-[0_12px_28px_rgba(255,107,0,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
                      Quay lại thực đơn
                    </button>
                  </div>
                )
             ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-4 border-[#F3F4F5] border-t-[#FF6B00] animate-spin mb-6" />
                  <p className="text-[#5A4136] font-medium text-[15px]">Đang khởi tạo giao dịch...</p>
                </div>
             )}
          </div>
          
          <div className="p-6 bg-white flex justify-center pb-8 pt-2">
            <button 
              onClick={() => router.push(`/orders/${unwrappedParams.id}`)}
              className="text-[#A04100] font-bold text-[15px] hover:text-[#7A3000] hover:underline transition-all"
            >
              Trở về chi tiết đơn hàng
            </button>
          </div>
       </div>
    </main>
  );
}
