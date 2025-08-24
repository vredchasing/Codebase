import React from 'react';
import { useState, useEffect, useRef } from 'react';

// component imports

import WindowControls from '../FunctionalComponents/WindowControls';

// svg imports
import { FaArrowLeft } from "react-icons/fa6";
import { FaArrowRight } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";



export default function LiveViewer({ htmlContent, cssContent, jsContent }) {
  const srcDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        ${cssContent || ''}
      </style>
    </head>
    <body>
      ${htmlContent || ''}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
      <script>
        try {
          ${jsContent || ''}
        } catch(e) {
          console.error('Error in live viewer JS:', e);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <div className='f-a-live-viewer-content-wrapper'>
      <div className='f-a-live-viewer-header'>
        <div className='f-a-live-viewer-header-left'>
          <FaArrowLeft color='white'/>
          <FaArrowRight color='white'/>
          <IoMdRefresh color='white' size={20}/>
        </div>
        <div className='f-a-live-viewer-header-center'>
          <span className='f-a-live-viewer-header-title'></span>
        </div>
        <WindowControls></WindowControls>
      </div>
      <iframe
        srcDoc={srcDoc}
        className='f-a-live-viewer-iframe'
        title="Live Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
}
