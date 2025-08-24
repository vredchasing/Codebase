import React, { forwardRef } from 'react';
import './WindowControls.css';

const WindowControls = forwardRef((props, ref) => {
  return (
    <div className="window-controls-wrapper">
      <span className="wc-minimize">.</span>
      <span className="wc-expand" ref={ref}>.</span>
      <span className="wc-close">.</span>
    </div>
  );
});

export default WindowControls;
