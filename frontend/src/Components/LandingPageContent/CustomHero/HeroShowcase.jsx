import React, { useRef } from 'react';
import './HeroShowcase.css';

export default function HeroShowcase() {
  const heroSlides = [
    { name: 'Monaco', file: 'monaco.PNG', link: '/projects/monaco', y: -200 },
    { name: 'Website', file: 'website.PNG', link: '/projects/website', y: 200 },
    { name: 'Website4', file: 'website4.PNG', link: '/projects/website4', y: -75 },
    { name: 'Website5', file: 'website5.PNG', link: '/projects/website5', y: -230 },
    { name: 'Website2', file: 'website2.PNG', link: '/projects/website2', y: 100 },
    { name: 'Website6', file: 'website6.PNG', link: '/projects/website6', y: 250 },
  ];

  const basePath = '/images/CustomHeroImages/';
  const slidesRef = useRef([]);

  // Duplicate the slides array for seamless infinite scroll
const slidesToRender = [...heroSlides];
  return (
    <>
      <section className="hero-section-wrapper">
        <span className="slideshow-text">SLIDESHOW</span>
        <div className="hero-section">
          <div className="slides-track">
            {slidesToRender.map((slide, index) => (
              <div
                key={index}
                className="hero-slide"
                style={{ transform: `translateY(${slide.y}px)` }}
                ref={el => (slidesRef.current[index] = el)}
              >
                <img src={`${basePath}${slide.file}`} alt={slide.name} className="hero-img" />
              </div>
            ))}
          </div>
          <div className="slides-track">
            {slidesToRender.map((slide, index) => (
              <div
                key={index}
                className="hero-slide"
                style={{ transform: `translateY(${slide.y}px)` }}
                ref={el => (slidesRef.current[index] = el)}
              >
                <img src={`${basePath}${slide.file}`} alt={slide.name} className="hero-img" />
              </div>
            ))}
          </div>
          <div className="slides-track">
            {slidesToRender.map((slide, index) => (
              <div
                key={index}
                className="hero-slide"
                style={{ transform: `translateY(${slide.y}px)` }}
                ref={el => (slidesRef.current[index] = el)}
              >
                <img src={`${basePath}${slide.file}`} alt={slide.name} className="hero-img" />
              </div>
            ))}
          </div>

          <div className="slides-track">
            {slidesToRender.map((slide, index) => (
              <div
                key={index}
                className="hero-slide"
                style={{ transform: `translateY(${slide.y}px)` }}
                ref={el => (slidesRef.current[index] = el)}
              >
                <img src={`${basePath}${slide.file}`} alt={slide.name} className="hero-img" />
              </div>
            ))}
          </div>
          
        </div>
      </section>
    </>
  );
}
