import React from 'react';

function StarRating({ rating, onRatingChange, readOnly = false, maxRating = 5, size = 'medium' }) {
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  
  const handleStarClick = (event, starValue) => {
    if (!readOnly && onRatingChange) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const starWidth = rect.width;
      
      // If clicked on left half of star, use half rating
      // If clicked on right half of star, use full rating
      const newRating = clickX < starWidth / 2 ? starValue - 0.5 : starValue;
      
      onRatingChange(newRating);
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: '14px', marginRight: '1px' };
      case 'large':
        return { fontSize: '36px', marginRight: '6px' };
      case 'xlarge':
        return { fontSize: '48px', marginRight: '8px' };
      case 'medium':
      default:
        return { fontSize: '18px', marginRight: '2px' };
    }
  };

  const renderStar = (index) => {
    const starValue = index + 1;
    const isFull = roundedRating >= starValue;
    const isHalf = roundedRating >= starValue - 0.5 && roundedRating < starValue;
    
    let starIcon;
    if (isFull) {
      starIcon = '★'; // Full star
    } else if (isHalf) {
      starIcon = '☆'; // Half star (we'll use CSS to show half)
    } else {
      starIcon = '☆'; // Empty star
    }
    
    const sizeStyle = getSizeStyle();
    
    return (
      <span
        key={index}
        onClick={(e) => handleStarClick(e, starValue)}
        style={{
          cursor: readOnly ? 'default' : 'pointer',
          color: isFull ? '#ffd700' : (isHalf ? '#ffd700' : '#ccc'),
          fontSize: sizeStyle.fontSize,
          marginRight: sizeStyle.marginRight,
          position: 'relative',
          display: 'inline-block',
          userSelect: 'none'
        }}
        title={readOnly ? `${starValue} star${starValue !== 1 ? 's' : ''}` : `Click left for ${starValue - 0.5}, right for ${starValue}`}
      >
        {isHalf ? (
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ color: '#ccc' }}>☆</span>
            <span 
              style={{ 
                position: 'absolute', 
                left: 0, 
                top: '50%',
                transform: 'translateY(-50%)',
                width: '50%', 
                overflow: 'hidden',
                color: '#ffd700'
              }}
            >
              ★
            </span>
          </span>
        ) : (
          starIcon
        )}
      </span>
    );
  };

  return (
    <div style={{ display: 'inline-block' }}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      {rating && (
        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
          {typeof rating === 'number' ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  );
}

export default StarRating;