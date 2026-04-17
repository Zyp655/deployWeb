'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlashSaleProduct } from '@/lib/api/client';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function FlashSaleBanner({ products }: { products: FlashSaleProduct[] }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isOver: boolean } | null>(null);

  useEffect(() => {
    if (products.length === 0) return;

    // Find the nearest end time
    const nearestEndTime = Math.min(...products.map(p => new Date(p.flashSaleEnd).getTime()));

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = nearestEndTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isOver: false
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [products]);

  if (products.length === 0) return null;
  if (timeLeft?.isOver) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-6 mb-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-orange-500 to-red-500 shadow-xl shadow-red-500/20">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl md:text-5xl animate-pulse drop-shadow-md">⚡</span>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-sm flex items-center gap-2">
                  Flash Sale
                  <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-bold text-red-600 shadow-sm">Hot</span>
                </h2>
                <p className="text-red-100 font-medium text-sm mt-1">Nhanh tay kẻo lỡ deal cực sốc!</p>
              </div>
            </div>

            {/* Countdown Timer */}
            {timeLeft && (
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-red-100 font-semibold text-sm mr-1">Kết thúc trong</span>
                <div className="flex gap-1.5 text-center">
                  <div className="bg-white/90 text-red-600 rounded-lg w-10 h-10 flex flex-col justify-center items-center shadow-sm">
                    <span className="text-lg font-black leading-none">{timeLeft.hours.toString().padStart(2, '0')}</span>
                  </div>
                  <span className="text-white font-black text-lg self-center animate-pulse">:</span>
                  <div className="bg-white/90 text-red-600 rounded-lg w-10 h-10 flex flex-col justify-center items-center shadow-sm">
                    <span className="text-lg font-black leading-none">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                  </div>
                  <span className="text-white font-black text-lg self-center animate-pulse">:</span>
                  <div className="bg-white/90 text-red-600 rounded-lg w-10 h-10 flex flex-col justify-center items-center shadow-sm">
                    <span className="text-lg font-black leading-none">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products Scroll */}
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x relative z-10 w-full" style={{ scrollBehavior: 'smooth' }}>
            {products.map((product) => {
              const discountPercent = Math.round((1 - product.salePrice / product.price) * 100);
              
              return (
                <Link
                  href={`/menu/${product.id}`}
                  key={product.id}
                  className="flex-shrink-0 snap-start w-56 md:w-64 bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-white/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl group flex flex-col"
                >
                  <div className="relative h-36 bg-gray-100 overflow-hidden">
                    {product.image && product.image !== '/images/default.jpg' ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200">
                        🍽️
                      </div>
                    )}
                    {/* Discount Badge */}
                    <div className="absolute top-2 left-2 bg-red-500 text-white font-black text-sm px-2.5 py-1 rounded-br-xl rounded-tl-md shadow-md border border-red-400">
                      -{discountPercent}%
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-red-600 transition-colors">{product.name}</h3>
                    
                    <div className="mt-auto">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xl font-black text-red-600 leading-none mb-1">
                            {formatPrice(product.salePrice)}
                          </p>
                          <p className="text-xs font-semibold text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
