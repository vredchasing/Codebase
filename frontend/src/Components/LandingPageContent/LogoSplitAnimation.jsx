import React from 'react';

import { MdArrowForwardIos } from "react-icons/md";


export default function CodeSplitAnimation({ sloganRef, exploreRef, learnMoreRef }) {
  return (
    <div
      className='lp-text2-container'
    >
      <div className='lp-text2-h1' ref={sloganRef}>
        <h1 className='lp-text2-h1'>
          Design Meets Function.
        </h1>
      </div>
      <div className='lp-explore-wrapper'>
        <span className='lp-explore-btn' ref={exploreRef}>Explore.</span>
        <span className='lp-learn-more-btn' ref={learnMoreRef}>Learn More<MdArrowForwardIos size={18} color="hsl(207, 76%, 62%)" /> </span>
      </div>
    </div>
  );
}
