'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth';

export default function SellerReviewsPage() {
  const { token } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async () => {
    try {
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
  }, [token]);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return alert('Vui lòng nhập nội dung trả lời');
    try {
      if (!token) return;
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
    return <div className="text-[#906f6c] text-center py-12">Đang tải đánh giá...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">⭐ Quản lý Đánh giá</h2>
        <p className="text-[#5b403d] mt-1 text-sm">Lắng nghe phản hồi từ khách hàng cho các món ăn của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map(review => (
          <div key={review.id} className="ds-card p-6 flex flex-col h-full transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_50px_rgba(26,26,46,0.1)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-lg bg-[#efecff] flex items-center justify-center text-2xl">
                   🍔
                 </div>
                 <div>
                    <h3 className="font-bold text-[#1a1a2e]">{review.product?.name}</h3>
                    <p className="text-xs text-[#906f6c]">{review.user?.name} · {new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                 </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                <span className="font-bold text-amber-600 text-sm">{review.rating}</span>
                <span className="text-amber-400">★</span>
              </div>
            </div>

            <p className="text-[#5b403d] italic border-l-4 border-[#e4beb9] pl-3 mb-4 flex-1 text-sm">
              "{review.comment}"
            </p>

            {review.sellerReply ? (
              <div className="mt-auto bg-primary/5 rounded-xl p-4 border border-primary/10">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-bold text-primary text-sm flex items-center gap-1">
                     ↩️ Quán trả lời:
                   </h4>
                   <span className="text-xs text-[#e4beb9]">{review.replyAt ? new Date(review.replyAt).toLocaleDateString('vi-VN') : ''}</span>
                </div>
                <p className="text-sm text-[#5b403d]">{review.sellerReply}</p>
                <div className="mt-3 flex justify-end">
                   <button
                     onClick={() => { setReplyingId(review.id); setReplyText(review.sellerReply); }}
                     className="text-xs text-primary font-semibold hover:underline"
                   >
                     Sửa câu trả lời
                   </button>
                </div>
              </div>
            ) : (
              <div className="mt-auto pt-4 border-t border-[#efecff]">
                {replyingId === review.id ? (
                  <div className="space-y-3">
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập nội dung trả lời khách hàng..."
                      className="ds-input min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setReplyingId(null); setReplyText(''); }}
                        className="text-[#5b403d] font-semibold px-3 py-1.5 text-sm hover:bg-[#efecff] rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleReply(review.id)}
                        className="ds-gradient-cta px-4 py-1.5 text-sm"
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
                    ↩️ Trả lời khách hàng
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="col-span-1 md:col-span-2 ds-card p-12 text-center">
            <span className="text-6xl">⭐</span>
            <h3 className="ds-heading text-xl font-bold text-[#1a1a2e] mt-4">Chưa có đánh giá nào</h3>
            <p className="text-[#906f6c] mt-1">Các đánh giá của khách hàng về món ăn sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
