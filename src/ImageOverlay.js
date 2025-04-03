import React, { useEffect, useState } from 'react';

const ImageOverlay = () => {
  const [images, setImages] = useState([]);
  const [positions, setPositions] = useState(Array(10).fill({ top: 0, left: 0 }));
  const [draggingIndex, setDraggingIndex] = useState(null);

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages = await Promise.all(
        Array.from({ length: 10 }, async (_, index) => {
          const imageModule = await import(`./assets/${index}.jpg`);
          return imageModule.default; // Access the default export
        })
      );
      setImages(loadedImages);
    };

    loadImages();
  }, []);

  const handleMouseDown = (e, index) => {
    e.preventDefault(); // 防止默认行为（如拖动图片到浏览器外）
    setDraggingIndex(index);

    // 绑定全局事件
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (draggingIndex !== null) {
      const { pageX, pageY } = e;

      setPositions((prevPositions) => {
        const newPositions = [...prevPositions];
        newPositions[draggingIndex] = { top: pageY - 25, left: pageX - 25 }; // 调整图片中心点
        return newPositions;
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);

    // 解绑全局事件
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {images.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`Number ${index}`}
          style={{
            position: 'absolute',
            top: positions[index].top,
            left: positions[index].left,
            width: '50px',
            height: '50px',
            margin: '5px',
            border: '2px solid blue',
            cursor: 'grab',
          }}
          onMouseDown={(e) => handleMouseDown(e, index)}
        />
      ))}
    </div>
  );
};

export default ImageOverlay;
