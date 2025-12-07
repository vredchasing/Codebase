import React from "react"
import './LandingPageA.css'
import { FiArrowUpRight } from "react-icons/fi";
import DotGridBackground from './DotGridBackground';

function LandingPageA (){

  return(
    <section className='landing-page-wrapper'>
      <div className='lp-a-hero-wrapper'>
        <div className='lp-text-wrapper'>
          <h1 className='lp-codebase-text'>Everything Dev. One Platform.</h1>
          <h3 className="lp-a-text-h3">An AI-Integrated Software Development Environment</h3>
        </div>
        <div className='lp-a-hero-btns-wrapper'>
          <span className="lp-a-learn-more-btn">
            Learn More
          </span>
          <span className="lp-a-get-started-btn">
            Get Started
            <FiArrowUpRight size={19}></FiArrowUpRight>
          </span>
        </div>
      </div>
    </section>
  )
}

export default LandingPageA