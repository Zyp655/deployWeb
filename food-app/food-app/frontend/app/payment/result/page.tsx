'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    // MoMo callback params
    const momoResultCode = searchParams.get('resultCode');
    const momoOrderId = searchParams.get('orderId');
    const momoMessage = searchParams.get('message');

    // VNPay callback params
    const vnpayResponseCode = searchParams.get('vnp_ResponseCode');
    const vnpayTxnRef = searchParams.get('vnp_TxnRef');

    if (momoResultCode !== null) {
      // MoMo payment
      setOrderId(momoOrderId || '');
      if (momoResultCode === '0') {
        setStatus('success');
        setMessage('Thanh toán MoMo thành công!');
      } else {
        setStatus('failed');
        setMessage(momoMessage || 'Thanh toán MoMo thất bại');
      }
    } else if (vnpayResponseCode !== null) {
      // VNPay payment
      setOrderId(vnpayTxnRef || '');
      if (vnpayResponseCode === '00') {
        setStatus('success');
        setMessage('Thanh toán VNPay thành công!');
      } else {
        setStatus('failed');
        setMessage('Thanh toán VNPay thất bại');
      }
    } else {
      setStatus('failed');
      setMessage('Không tìm thấy thông tin thanh toán');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-5xl animate-bounce inline-block">⏳</span>
          <p className="mt-3 text-sm text-gray-500">Đang xử lý...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-xl text-center">
          {status === 'success' ? (
            <>
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-10 h-10 text-green-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              {orderId && (
                <p className="text-sm text-gray-500 mb-6">
                  Mã đơn hàng: <span className="font-mono font-semibold">{orderId}</span>
                </p>
              )}
              <div className="flex flex-col gap-3">
                <Link
                  href={orderId ? `/orders/${orderId}` : '/menu'}
                  className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {orderId ? 'Xem đơn hàng' : 'Về trang chủ'}
                </Link>
                <Link
                  href="/menu"
                  className="rounded-full bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-10 h-10 text-red-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                Thanh toán thất bại
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.back()}
                  className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Thử lại
                </button>
                <Link
                  href="/menu"
                  className="rounded-full bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Về trang chủ
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
