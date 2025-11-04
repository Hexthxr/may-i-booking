// Stars.jsx — คอมโพเนนต์แสดงดาวให้คะแนน (ใช้ได้ทั้งแบบอ่านค่าและ interactive)

import React from 'react';

/**
 * ⭐ Stars component
 * @param {number} value คะแนนเฉลี่ยหรือค่าดาว เช่น 4.5
 * @param {function?} onChange ฟังก์ชันเมื่อคลิกเลือกดาว (optional)
 * @param {number} size ขนาดของดาว (px)
 */
export default function Stars({ value = 0, onChange, size = 20 }) {
  const stars = [1, 2, 3, 4, 5];
  const editable = typeof onChange === 'function';

  const handleClick = (val) => {
    if (editable) onChange(val);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {stars.map((star) => {
        const filled = value >= star;
        const half = !filled && value + 0.5 >= star;
        return (
          <svg
            key={star}
            onClick={() => handleClick(star)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={filled ? '#FFD700' : half ? 'url(#halfGradient)' : '#ddd'}
            stroke="#999"
            strokeWidth="0.5"
            style={{
              cursor: editable ? 'pointer' : 'default',
              transition: 'transform 0.1s ease-in-out',
            }}
            onMouseEnter={(e) => editable && (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => editable && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {/* กรณีครึ่งดาว */}
            {half && (
              <defs>
                <linearGradient id="halfGradient">
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#ddd" />
                </linearGradient>
              </defs>
            )}
            <path d="M12 .587l3.668 7.568L24 9.75l-6 5.847 1.417 8.268L12 19.771l-7.417 4.094L6 15.597 0 9.75l8.332-1.595z" />
          </svg>
        );
      })}
    </div>
  );
}
