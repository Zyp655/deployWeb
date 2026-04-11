'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${api.baseUrl}/reviews/seller`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return alert('Vui lòng nhập nội dung trả lời');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${api.baseUrl}/reviews/${id}/reply`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reply: replyText })
      });
      
      if (res.ok) {
        alert('Đã gửi phản hồi thành công');
        setReplyingId(null);
        setReplyText('');
        fetchReviews();
      } else {
        const err = await res.json();
        alert(`Lỗi: ${err.message}`);
      }
    } catch (error) {
      console.error('Error replying:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-12">Đang tải đánh giá...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Quản lý Đánh giá (⭐)</h2>
        <p className="text-gray-500 mt-1">Lắng nghe phản hồi từ khách hàng cho các món ăn của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map(review => (
          <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <img src={review.product?.image || '/placeholder-food.jpg'} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                 <div>
                    <h3 className="font-bold text-gray-900">{review.product?.name}</h3>
                    <p className="text-xs text-gray-500">{review.user?.name} - {new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                 </div>
              </div>
              <div className="flex gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <span className="font-bold text-yellow-600">{review.rating}</span>
                <span className="text-yellow-400">★</span>
              </div>
            </div>
            
            <p className="text-gray-700 italic border-l-4 border-gray-200 pl-3 mb-4 flex-1">
              "{review.comment}"
            </p>

            {/* Seller Reply Section */}
            {review.sellerReply ? (
              <div className="mt-auto bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-bold text-primary text-sm flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                     Quán trả lời:
                   </h4>
                   <span className="text-xs text-gray-400">{review.replyAt ? new Date(review.replyAt).toLocaleDateString('vi-VN') : ''}</span>
                </div>
                <p className="text-sm text-gray-700">{review.sellerReply}</p>
                <div className="mt-3 flex justify-end">
                   <button 
                     onClick={() => {
                        setReplyingId(review.id);
                        setReplyText(review.sellerReply);
                     }}
                     className="text-xs text-primary font-semibold hover:underline"
                   >
                     Sửa câu trả lời
                   </button>
                </div>
              </div>
            ) : (
              <div className="mt-auto pt-4 border-t border-gray-100">
                {replyingId === review.id ? (
                  <div className="space-y-3">
                    <textarea 
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập nội dung trả lời khách hàng..."
                      className="w-full text-sm rounded-xl border border-gray-200 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                        className="text-gray-500 font-semibold px-3 py-1.5 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={() => handleReply(review.id)}
                        className="bg-primary text-white font-semibold px-4 py-1.5 text-sm rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingId(review.id)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-primary font-semibold bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 outline-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    Trả lời khách hàng
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <span className="text-6xl">⭐</span>
            <h3 className="text-xl font-bold text-gray-900 mt-4">Chưa có đánh giá nào</h3>
            <p className="text-gray-500 mt-1">Các đánh giá của khách hàng về món ăn sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
