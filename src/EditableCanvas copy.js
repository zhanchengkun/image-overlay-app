import React, { useState, useRef, useCallback } from 'react';

const EditableCanvas = () => {
  const [background, setBackground] = useState(null); // 背景图片
  const [images, setImages] = useState([]); // 加载的图片
  const [positions, setPositions] = useState([]); // 图片位置
  const [imageSizes, setImageSizes] = useState([]); // 添加图片尺寸状态
  const [inputVisible, setInputVisible] = useState(true); // 输入框始终可见
  const [inputValue, setInputValue] = useState(''); // 输入框的值
  const inputPosition = { top: 10, left: 200 }; // 固定输入框位置
  const canvasRef = useRef(null); // 用于导出页面内容
  const dragRef = useRef({
    isDragging: false,
    currentIndex: null,
    startX: 0,
    startY: 0
  });

  // 上传背景图片
  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackground(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 输入框值变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^[-.0-9]*$/.test(value)) {
      setInputValue(value);
    }
  };

  // 输入框回车确认
  const handleInputConfirm = async () => {
    if (inputValue) {
      const newImages = [];
      const newPositions = [];
      const newSizes = [];
      const digits = inputValue.split('');
      let offset = 0;

      for (const digit of digits) {
        try {
          const imageModule = await import(`./assets/${digit == "." ? "x" : digit}.jpg`);
          const newImage = imageModule.default;

          // 获取图片实际尺寸
          const img = new Image();
          img.src = newImage;
          await new Promise((resolve) => {
            img.onload = () => {
              newImages.push(newImage);
              newSizes.push({
                width: img.naturalWidth,
                height: img.naturalHeight
              });
              console.log(img.naturalWidth, img.naturalHeight);
              newPositions.push({ top: 100, left: 100 + offset });
              offset += img.naturalWidth + 10; // 使用实际宽度计算偏移
              resolve();
            };
          });
        } catch (error) {
          alert(`未找到对应图片: ${digit}`);
        }
      }

      setImages([...newImages]);
      setPositions([...positions, ...newPositions]);
  
      setImageSizes([...imageSizes, ...newSizes]);
    }
    setInputValue('');
  };

  const handleMouseDown = useCallback((e, index) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    dragRef.current = {
      isDragging: true,
      currentIndex: index,
      startX: clientX - positions[index].left,
      startY: clientY - positions[index].top
    };
  }, [positions]);

  const handleMouseMove = useCallback((e) => {
    if (dragRef.current.isDragging) {
      const { clientX, clientY } = e;
      const { currentIndex, startX, startY } = dragRef.current;

      setPositions(prev => {
        const newPositions = [...prev];
        newPositions[currentIndex] = {
          left: clientX - startX,
          top: clientY - startY
        };
        return newPositions;
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
  }, []);

  // 组件挂载时添加事件监听
  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // 导出页面内容为图片
  const handleExport = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
console.log('export')
    // 绘制背景
    const backgroundImage = new Image();
    backgroundImage.src = background;
    backgroundImage.onload = () => {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

      // 绘制所有图片
      images.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        const { top, left } = positions[index];
        img.onload = () => {
          ctx.drawImage(img, left, top, imageSizes[index]?.width || 37, imageSizes[index]?.height || 54); // 使用实际尺寸
          if (index === images.length - 1) {
            // 导出为图片
            const link = document.createElement('a');
            link.download = 'exported-image.png';
            link.href = canvas.toDataURL();
            link.click();
          }
        };
      });
    };
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: background ? `url(${background}) no-repeat center/contain` : '#f0f0f0',
      }}
    >
      {/* 上传背景图片按钮 */}
      <input
        type="file"
        accept="image/*"
        onChange={handleBackgroundUpload}
        style={{ position: 'absolute', top: 10, left: 10 }}
      />

      {/* 导出按钮 */}
      <button
        onClick={handleExport}
        style={{ position: 'absolute', top: 10, left: 120 }}
      >
        导出页面
      </button>

      {/* 输入框 */}
      {inputVisible && (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleInputConfirm()}
          style={{
            position: 'absolute',
            top: inputPosition.top,
            left: inputPosition.left,
            zIndex: 1000,
          }}
        />
      )}

      {/* 加载的图片 */}
      {images.map((src, index) => (
        <div key={index}>
          <img
            src={src}
            alt={`Image ${index}`}
            style={{
              position: 'absolute',
              top: positions[index].top,
              left: positions[index].left,
              width: imageSizes[index]?.width || 'auto',
              height: imageSizes[index]?.height || 'auto',
              cursor: dragRef.current.isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
            onMouseDown={(e) => handleMouseDown(e, index)}
          />
          {/* 显示坐标 */}
          <span
            style={{
              position: 'absolute',
              top: positions[index].top - 20,
              left: positions[index].left,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '2px 5px',
              borderRadius: '3px',
              fontSize: '12px',
            }}
          >
            {/* ({positions[index].left}, {positions[index].top}) */}
            {imageSizes[index]?.width}
          </span>
        </div>
      ))}

      {/* 隐藏的 canvas 用于导出 */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default EditableCanvas;