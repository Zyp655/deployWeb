'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

const images = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&q=80',
];

export default function GalleryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); // 4 seconds interval
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
         <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
               Bộ Sưu Tập Món Ngon
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Dạo quanh các món ăn tuyệt hảo của chúng tôi</p>
         </div>

         <div className="relative w-full max-w-5xl h-[60vh] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-black group">
            {images.map((src, index) => (
                <img
                    key={index}
                    src={src}
                    alt={`Delicious food ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                        currentIndex === index 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-110 pointer-events-none'
                    }`}
                />
            ))}
            
            {/* Gradient Overlay & Text */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-10">
                <div className="flex flex-col gap-2 transition-all duration-500 transform translate-y-0 opacity-100 text-white">
                  <h2 className="text-4xl font-bold">Trải Nghiệm Ẩm Thực {currentIndex + 1}</h2>
                  <p className="text-gray-300 max-w-xl">
                    Khám phá hương vị độc đáo và tinh tế từ các đầu bếp hàng đầu. Mỗi món ăn là một câu chuyện.
                  </p>
                </div>
            </div>
            
            {/* Pagination Dots */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10">
               {images.map((_, i) => (
                   <button
                       key={i}
                       onClick={() => setCurrentIndex(i)}
                       className={`h-2 rounded-full transition-all duration-300 ${
                           currentIndex === i 
                           ? 'bg-primary-500 w-8 shadow-[0_0_15px_theme(colors.primary.500)]' 
                           : 'bg-white/50 w-2 hover:bg-white/80'
                       }`}
                       aria-label={`Go to slide ${i + 1}`}
                   />
               ))}
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
         </div>
      </main>
    </div>
  );
}
