import React, { useState, useEffect } from 'react';

const FloatingTimer = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
  const [colorIndex, setColorIndex] = useState(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    // 毫秒计时器
    const msTimer = setInterval(() => {
      setTime(prev => prev + 10);
    }, 10);

    // 颜色切换计时器
    const colorTimer = setInterval(() => {
      setColorIndex(prev => (prev + 1) % colors.length);
    }, 4250);

    return () => {
      clearInterval(msTimer);
      clearInterval(colorTimer);
    };
  }, []);

  const formatTime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: colors[colorIndex],
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '16px',
      zIndex: 9999,
      transition: 'background-color 0.3s ease'
    }}>
      {formatTime(time)}
    </div>
  );
};

export default FloatingTimer;
