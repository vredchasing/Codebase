import React from 'react';

import { MdArrowForwardIos } from "react-icons/md";


export default function CodeSplitAnimation({ codeRef, baseRef, centerRef }) {
  return (
    <div
      className='lp-text2-container'
    >
      <div className='lp-text2-h1'>
        <h1 className='lp-text2-h1'>
          Design Meets Function.
        </h1>
      </div>
      <div className='lp-explore-wrapper'>
        <span className='lp-explore-btn'>Explore.</span>
        <span className='lp-learn-more-btn'>Learn More<MdArrowForwardIos size={18} /> </span>
      </div>
    </div>
  );
}
