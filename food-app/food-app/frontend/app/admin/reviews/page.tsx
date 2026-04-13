'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth';

export default function AdminReviewsPage() {
  const { token } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${api.baseUrl}/reviews/admin`, {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa đánh giá này khỏi hệ thống? (Hành động này không thể hoàn tác)')) return;
    try {
      if (!token) return;
      const res = await fetch(`${api.baseUrl}/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Xóa thất bại');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  if (loading) {
    return <div className="text-[#906f6c] py-10">Đang tải danh sách đánh giá...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="ds-heading text-3xl font-extrabold text-[#1a1a2e]">⭐ Quản lý Đánh giá (Admin)</h2>
        <p className="text-[#5b403d] mt-1 text-sm">Giám sát toàn bộ đánh giá sản phẩm trên hệ thống</p>
      </div>

      <div className="ds-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="ds-table-head px-6 py-4">Sản phẩm / Khách hàng</th>
              <th className="ds-table-head px-6 py-4">Đánh giá</th>
              <th className="ds-table-head px-6 py-4">Ngày đăng</th>
              <th className="ds-table-head px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.id} className="ds-table-row border-b border-[#efecff]">
                <td className="px-6 py-4">
                  <div className="font-bold text-[#1a1a2e]">{review.product?.name || 'Sản phẩm đã bị xóa'}</div>
                  <div className="text-sm text-[#906f6c]">Khách: {review.user?.name || 'Ẩn danh'}</div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-lg ${i < review.rating ? 'text-amber-400' : 'text-[#e4beb9]'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-[#5b403d] text-sm line-clamp-2">{review.comment}</p>
                  {review.sellerReply && (
                     <div className="mt-2 bg-primary/5 border-l-2 border-primary p-2 text-xs rounded text-[#5b403d]">
                        <span className="font-bold">Chủ quán trả lời:</span> {review.sellerReply}
                     </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-[#906f6c]">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-primary bg-primary/5 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-[#906f6c]">
                  Chưa có đánh giá nào trên hệ thống.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
