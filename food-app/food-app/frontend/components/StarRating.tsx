'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showValue?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly = false,
  showValue = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const starSize = sizeMap[size];
  const displayValue = hoverValue || value;

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        const isHalf = !isFilled && star - 0.5 <= displayValue;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            className={`relative ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            } transition-transform duration-150 ${
              !readOnly && hoverValue >= star ? 'scale-110' : ''
            } focus:outline-none disabled:opacity-100`}
            aria-label={`${star} sao`}
          >
            {/* Empty star (background) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`${starSize} text-gray-200`}
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {/* Filled star (overlay) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`${starSize} absolute inset-0 transition-colors duration-150`}
              fill={isFilled ? '#F59E0B' : isHalf ? '#F59E0B' : 'transparent'}
              style={
                isHalf
                  ? { clipPath: 'inset(0 50% 0 0)' }
                  : undefined
              }
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1.5 text-sm font-bold text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
