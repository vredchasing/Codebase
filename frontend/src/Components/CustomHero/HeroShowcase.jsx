import React from 'react';
import './HeroShowcase.css';

export default function HeroShowcase() {
  return (
    <section className="hero-section">
      <div className="monaco-hero-container">
        <img className='monaco-hero-img' src='/images/CustomHeroImages/monaco.PNG'></img>
      </div>
      <div className='website-hero-container'>
        <img className='website-hero-img' src='/images/CustomHeroImages/website.PNG'></img>
      </div>
      <div className='terminal-hero-container'>
        <img className='terminal-hero-img' src='/images/CustomHeroImages/terminal.PNG'></img>
      </div>
    </section>
  );
}