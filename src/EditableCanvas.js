import React, { useState, useRef, useCallback } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';

function isMobileDevice() {
  const userAgent=navigator.userAgent||navigator.vendor||window.opera;
  return /android|avantgo|blackberry|bada|bb10|iphone|ipod|ipad|iemobile|opera mini|opera mobi|webos|windows phone/i.test(userAgent);
}
const EditableCanvas=() => {
  const [background, setBackground]=useState(null); // 背景图片
  const [backgroundSize, setBackgroundSize]=useState({ width: 0, height: 0 }); // 背景图片尺寸
  const [images, setImages]=useState([]); // 加载的图片
  const [positions, setPositions]=useState([]); // 图片位置
  const [imageSizes, setImageSizes]=useState([]); // 添加图片尺寸状态
  const [inputVisible, setInputVisible]=useState(true); // 输入框始终可见
  const [inputValue, setInputValue]=useState(''); // 输入框的值
  const inputPosition={ top: 30, left: 200 }; // 固定输入框位置
  const canvasRef=useRef(null); // 用于导出页面内容
  const dragRef=useRef({
    isDragging: false,
    currentIndex: null,
    startX: 0,
    startY: 0
  });

  // 上传背景图片
  const handleBackgroundUpload=(e) => {
    const file=e.target.files[0];
    if (file) {
      const reader=new FileReader();
      reader.onload=(event) => {
        const img=new Image();
        img.onload=() => {
          setBackgroundSize({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
          setBackground(event.target.result);
        };
        img.src=event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // 输入框值变化
  const handleInputChange=(e) => {
    const value=e.target.value;
    if (/^[-.0-9]*$/.test(value)) {
      setInputValue(value);
    }
  };

  // 输入框回车确认
  const handleInputConfirm=async () => {
    if (inputValue) {
      const newImages=[];
      const newPositions=[];
      const newSizes=[];
      const digits=inputValue.split('');
      let offset=0;

      for (const digit of digits) {
        try {
          const imageModule=await import(`./assets/${digit=="."? "x":digit}.jpg`);
          const newImage=imageModule.default;

          // 获取图片实际尺寸
          const img=new Image();
          img.src=newImage;
          await new Promise((resolve) => {
            img.onload=() => {
              newImages.push(newImage);
              newSizes.push({
                width: img.naturalWidth,
                height: img.naturalHeight
              });

              newPositions.push({ top: 100, left: 50+offset });
              offset+=img.naturalWidth+10; // 使用实际宽度计算偏移
              resolve();
            };
          });
        } catch (error) {
          alert(`未找到对应图片: ${digit}`);
        }
      }

      setImages([...newImages]);
      setPositions([...newPositions]);

      setImageSizes([...newSizes]);
    }
    setInputValue('');
  };

  const handleMouseDown=useCallback((e, index) => {
    e.preventDefault();
    const { clientX, clientY }=e;
    dragRef.current={
      isDragging: true,
      currentIndex: index,
      startX: clientX-positions[index].left,
      startY: clientY-positions[index].top
    };
  }, [positions]);

  const handleMouseMove=useCallback((e) => {
    if (dragRef.current.isDragging) {
      const { clientX, clientY }=e;
      const { currentIndex, startX, startY }=dragRef.current;

      setPositions(prev => {
        const newPositions=[...prev];
        newPositions[currentIndex]={
          left: clientX-startX,
          top: clientY-startY
        };
        return newPositions;
      });
    }
  }, []);

  const handleMouseUp=useCallback(() => {
    dragRef.current.isDragging=false;
  }, []);

  const handleTouchStart=useCallback((e, index) => {
    e.preventDefault();
    const touch=e.touches[0];
    dragRef.current={
      isDragging: true,
      currentIndex: index,
      startX: touch.clientX-positions[index].left,
      startY: touch.clientY-positions[index].top
    };
  }, [positions]);

  const handleTouchMove=useCallback((e) => {
    if (dragRef.current.isDragging) {
      const touch=e.touches[0];
      const { currentIndex, startX, startY }=dragRef.current;

      setPositions(prev => {
        const newPositions=[...prev];
        newPositions[currentIndex]={
          left: touch.clientX-startX,
          top: touch.clientY-startY
        };
        return newPositions;
      });
    }
  }, []);

  const handleTouchEnd=useCallback(() => {
    dragRef.current.isDragging=false;
  }, []);

  // 组件挂载时添加事件监听
  React.useEffect(() => {
    // 鼠标事件
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    // 触摸事件
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      // 移除鼠标事件
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // 移除触摸事件
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // 导出页面内容为图片
  const handleExport=async () => {
    try {
      const canvas=canvasRef.current;
      const ctx=canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not supported');
      }

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制背景
      await new Promise((resolve, reject) => {
        const backgroundImage=new Image();
        backgroundImage.crossOrigin='anonymous'; // 允许跨域
        backgroundImage.onload=() => {
          try {
            ctx.drawImage(backgroundImage, 0, 0, backgroundImage.naturalWidth, backgroundImage.naturalHeight);

            resolve();
          } catch (err) {
            reject(err);
          }
        };
        backgroundImage.onerror=() => reject(new Error('Failed to load background'));
        backgroundImage.src=background;
      });

      // 按顺序绘制所有图片
      for (let index=0; index<images.length; index++) {
        await new Promise((resolve, reject) => {
          const img=new Image();
          img.crossOrigin='anonymous'; // 允许跨域
          img.onload=() => {
            try {
              const { top, left }=positions[index];
              ctx.drawImage(
                img,
                left,
                top,
                imageSizes[index]?.width||37,
                imageSizes[index]?.height||54
              );
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          img.onerror=() => reject(new Error(`Failed to load image ${index}`));
          img.src=images[index];
        });
      }

      // 获取图片数据
      const dataUrl=canvas.toDataURL('image/png');

      try {
        // 移除 data:image/png;base64, 前缀
        const base64Data=dataUrl.split(',')[1];

        // 生成时间戳文件名
        const fileName=`exported-${Date.now()}.png`;

        //检测设备 如果是pc 不执行这个代码


        if (!isMobileDevice()) {
          const link=document.createElement('a');
          link.href=dataUrl;
          link.download=fileName;
          link.click();
        } else {
          const result=await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });

          console.log('File saved:', result);
          alert('图片已保存到文档文件夹：'+fileName);
        }
        // 保存文件到设备


      } catch (err) {
        console.error('Save file failed:', err);
        // 显示更详细的错误信息
        alert('保存失败: '+(err.message||'未知错误'));
      }

    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请稍后重试');
    }
  };

  return (
    <>
      <div>
        {/* 上传背景图片按钮 */}
        <input
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          style={{ position: 'absolute', top: 30, left: 10 }}
        />

        {/* 导出按钮 */}
        <button
          onClick={handleExport}
          style={{ position: 'absolute', top: 30, left: 120 }}
        >
          导出页面
        </button>

        {/* 输入框 */}
        {inputVisible&&(
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key==='Enter'&&handleInputConfirm()}
            style={{
              position: 'absolute',
              top: inputPosition.top,
              left: inputPosition.left,
              zIndex: 1000,
            }}
          />
        )}
      </div>
      <div
        style={{
          width: backgroundSize.width||'100vw',
          height: backgroundSize.height||'100vh',
          position: 'relative',
          overflow: 'hidden',
          background: background? `url(${background}) no-repeat center/contain`:'#f0f0f0',
        }}
      >


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
                width: imageSizes[index]?.width||'auto',
                height: imageSizes[index]?.height||'auto',
                cursor: dragRef.current.isDragging? 'grabbing':'grab',
                userSelect: 'none',
                touchAction: 'none' // 防止触摸事件的默认行为
              }}
              onMouseDown={(e) => handleMouseDown(e, index)}
              onTouchStart={(e) => handleTouchStart(e, index)}
            />
          </div>
        ))}

        {/* 坐标显示层 - 仅在编辑时显示，不会被导出 */}
        {images.map((src, index) => (
          <span
            key={`coord-${index}`}
            style={{
              position: 'absolute',
              top: positions[index].top-20,
              left: positions[index].left,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: 'white',
              padding: '2px 5px',
              borderRadius: '3px',
              fontSize: '12px',
              pointerEvents: 'none', // 防止干扰拖拽
            }}
          >
            ({positions[index].left}, {positions[index].top})
          </span>
        ))}

        {/* 隐藏的 canvas 用于导出 */}
        <canvas
          ref={canvasRef}
          width={backgroundSize.width||window.innerWidth}
          height={backgroundSize.height||window.innerHeight}
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
};

export default EditableCanvas;