import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const requestOverlayPermission = async () => {
    if (Capacitor.getPlatform() === 'android') {
      try {
        // 使用新的权限API
        const result = await App.canOpenUrl({ url: 'package:/' });
        if (!result.value) {
          alert('需要悬浮窗权限');
        } else {
          startFloatingService();
        }
      } catch (error) {
        console.error('权限请求失败:', error);
      }
    }
};

const startFloatingService = async () => {
  try {
    await App.addListener('appStateChange', (state) => {
      console.log('App state changed:', state);
    });
  } catch (error) {
    console.error('启动服务失败:', error);
  }
};

const FloatingTimer = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
  const [colorIndex, setColorIndex] = useState(0);
  const [time, setTime] = useState(0);
  useEffect(() => {
    requestOverlayPermission();
  },[])

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
