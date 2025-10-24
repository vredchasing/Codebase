import React, { useEffect, useRef } from 'react';
import './ContextMenu.css'

export default function ContextMenu({ x, y, options, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', onClose, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  // Use inline style to position; adjustments might be done in parent or here if needed
  const style = {
    top: y,
    left: x,
  };

  return (
    <ul className="context-menu" ref={menuRef} style={style}>
      {options.map((option, idx) => (
        <span className='menu-option-span' key={idx} onClick={() => { option.onClick(); onClose(); }}>
          <span className='menu-option-label'>
            {option.label}
          </span>
          <span className='menu-option-label-right'>
            {option.labelRight}
          </span>
        </span>
      ))}
    </ul>
  );
}
