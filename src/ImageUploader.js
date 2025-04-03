import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUploader = () => {
  const [image, setImage] = useState(null);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} style={{ border: '2px dashed blue', padding: '20px', margin: '20px' }}>
      <input {...getInputProps()} />
      <p>拖拽文件到这里，或点击选择文件</p>
      {image && <img src={ image} alt="Uploaded" style={{ width: '100%', maxHeight: '400px' }} />}
    </div>
  );
};

export default ImageUploader;
