'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  count?: number
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showCount = false,
  count
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= displayRating
          const isHalf = !isFilled && value - 0.5 <= displayRating

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform ${
                readonly ? '' : 'focus:outline-none focus:ring-2 focus:ring-primary-500 rounded'
              }`}
              aria-label={`Đánh giá ${value} sao`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHalf
                    ? 'fill-yellow-400 text-yellow-400'
                    : readonly
                    ? 'text-gray-300'
                    : 'text-gray-400 hover:text-yellow-400'
                } transition-colors`}
              />
            </button>
          )
        })}
      </div>
      
      {showCount && count !== undefined && (
        <span className="text-sm text-gray-600 ml-1">
          ({count})
        </span>
      )}
      
      {!readonly && hoverRating > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          {hoverRating} {hoverRating === 1 ? 'star' : 'stars'}
        </span>
      )}
    </div>
  )
}
