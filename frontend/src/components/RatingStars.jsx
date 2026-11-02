/**
 * @file RatingStars.jsx
 * @description Modular star rating component supporting both interactive input and read-only display modes.
 * @module components/RatingStars
 * @see {@link MUSTmart Review Submission and Moderation Flowchart.pdf}
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Star rating component adhering to international accessibility standards.
 *
 * @param {Object} props - Component properties.
 * @param {number} props.rating - Numerical rating value (1 to 5).
 * @param {Function} [props.onChange] - Callback fired when a rating is selected in interactive mode.
 * @param {boolean} [props.interactive=false] - Whether the component permits user selection.
 * @param {number} [props.maxStars=5] - Maximum number of stars to display.
 * @param {number} [props.size=16] - Pixel dimension for star icons.
 * @returns {React.ReactElement} The rendered rating element.
 */
export default function RatingStars({
  rating = 0,
  onChange,
  interactive = false,
  maxStars = 5,
  size = 16
}) {
  // Temporary hover state during interactive selection
  const [hoverValue, setHoverValue] = useState(0);

  // Generate an array of star numbers [1, 2, 3, 4, 5]
  const starsArray = Array.from({ length: maxStars }, (_, index) => index + 1);

  return (
    <div
      className={`rating-stars-container ${interactive ? 'interactive' : 'readonly'}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${rating} out of ${maxStars} stars`}
    >
      {starsArray.map((starIndex) => {
        // Determine whether this star should be rendered as filled
        const isFilled = (hoverValue || rating) >= starIndex;

        if (interactive) {
          return (
            <button
              key={starIndex}
              type="button"
              role="radio"
              aria-checked={rating === starIndex}
              aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
              className={`star-interactive-btn ${isFilled ? 'filled' : 'empty'}`}
              onMouseEnter={() => setHoverValue(starIndex)}
              onMouseLeave={() => setHoverValue(0)}
              onClick={() => onChange && onChange(starIndex)}
            >
              <Star
                size={size}
                fill={isFilled ? 'currentColor' : 'none'}
                strokeWidth={isFilled ? 0 : 1.5}
                aria-hidden="true"
              />
            </button>
          );
        }

        return (
          <span
            key={starIndex}
            className={`star-readonly-icon ${isFilled ? 'filled' : 'empty'}`}
          >
            <Star
              size={size}
              fill={isFilled ? 'currentColor' : 'none'}
              strokeWidth={isFilled ? 0 : 1.5}
              aria-hidden="true"
            />
          </span>
        );
      })}
    </div>
  );
}
