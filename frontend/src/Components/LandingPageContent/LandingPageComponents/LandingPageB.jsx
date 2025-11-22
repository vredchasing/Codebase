import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LandingPageB.css';
import FeaturesAnimation from '../../FeaturesAnimationFolder/FeaturesAnimation';
import PlanAnimation from '../LandingPageBAnimations/PlanAnimation';
import GenerateAnimation from '../LandingPageBAnimations/GenerateAnimation';
import RefactorAnimation from '../LandingPageBAnimations/RefactorAnimation';

export default function LandingPageB() {

  return (
    <section className="lp-b-section">
      <div className='lp-b-wrapper'>
        <div className='lp-b-header'>
          <h2 className='lp-b-title'>Agents</h2>
        </div>
        
        <div className='lp-b-bottom-wrapper'>
          <div className='lp-b-card-container'>
            <div className='lp-b-cards-header'>
              <h2 className='lp-b-card-header-title'>Plan</h2>
              <h3 className='lp-b-card-header-description'>
                Our agents research your codebase.
              </h3>
            </div>
            <div className='lp-b-card'>
              <PlanAnimation></PlanAnimation>
            </div>
          </div>
          <div className='lp-b-card-container'>
            <div className='lp-b-cards-header'>
              <h2 className='lp-b-card-header-title'>Generate</h2>
              <h3 className='lp-b-card-header-description'>Use top coding models to generate high quality code.</h3>
            </div>
            <div className='lp-b-card'>
              <GenerateAnimation></GenerateAnimation>
            </div>
          </div>
          <div className='lp-b-card-container'>
            <div className='lp-b-cards-header'>
              <h2 className='lp-b-card-header-title'>Refactor</h2>
              <h3 className='lp-b-card-header-description'>
                Our agents understand your codebase via our RAG engine.  
              </h3>           
            </div>
            <div className='lp-b-card'>
              <RefactorAnimation></RefactorAnimation>
            </div>         
          </div>
        </div>  
      </div>
    </section>
  );
}
