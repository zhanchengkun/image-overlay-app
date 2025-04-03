import React from 'react';
import EditableCanvas from './EditableCanvas';
import FloatingTimer from './components/FloatingTimer';

const App = () => {
  return (
    <div style={{ paddingTop: '24px' }}> {/* 添加顶部安全区域 */}
      {/* <h1 style={{ textAlign: 'center', marginTop: '20px', height: "50px" }}>by FX</h1> */}
      {/* <EditableCanvas /> */}
      <FloatingTimer />
    </div>
  );
};

export default App;
