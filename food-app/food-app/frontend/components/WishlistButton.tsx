"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { addToWishlist, removeFromWishlist, fetchWishlist } from "@/lib/api/client";

export default function WishlistButton({ productId, inCard = false }: { productId: string, inCard?: boolean }) {
  const { user, token, openAuthModal } = useAuthStore();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    // We could store wishlist globally, but for now fetch just to check
    fetchWishlist(token).then((items) => {
      setIsInWishlist(items.some((i) => i.id === productId));
    }).catch(() => {});
  }, [user, token, productId]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !token) {
      openAuthModal("login");
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(productId, token);
        setIsInWishlist(false);
      } else {
        await addToWishlist(productId, token);
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (inCard) {
    return (
      <button
        onClick={toggleWishlist}
        disabled={loading}
        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-sm backdrop-blur-sm z-10 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isInWishlist ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-5 h-5 ${isInWishlist ? "text-red-500" : "text-gray-400"}`}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition-all duration-200 border-2 ${
        isInWishlist 
          ? "border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-200" 
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isInWishlist ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-5 h-5 ${isInWishlist ? "text-red-500" : "text-gray-400"}`}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      {isInWishlist ? 'Đã yêu thích' : 'Yêu thích'}
    </button>
  );
}
