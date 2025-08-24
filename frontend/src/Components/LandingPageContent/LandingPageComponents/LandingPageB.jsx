import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LandingPageB.css';
import FeaturesAnimation from '../../FeaturesAnimationFolder/FeaturesAnimation';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPageB() {
  const col1Imgs = [
    { src: '/public/images/LPB-images/img1.webp', alt: 'Image 1', xIndex: 'center' },
    { src: '/public/images/LPB-images/img4.webp', alt: 'Image 1', xIndex: 'start' },
    { src: '/public/images/LPB-images/img5.webp', alt: 'Image 1', xIndex: 'center' },
  ];

  const col2Imgs = [
    { src: '/public/images/LPB-images/img2.webp', alt: 'Image 1', xIndex: 'end' },
    { src: '/public/images/LPB-images/img2.webp', alt: 'Image 1', xIndex: 'center' },
    { src: '/public/images/LPB-images/img1.webp', alt: 'Image 1', xIndex: 'start' },
  ];

  const col3Imgs = [
    { src: '/public/images/LPB-images/img6.webp', alt: 'Image 1', xIndex: 'center' },
    { src: '/public/images/LPB-images/img3.webp', alt: 'Image 1', xIndex: 'end' },
    { src: '/public/images/LPB-images/img3.webp', alt: 'Image 1', xIndex: 'center' },
  ];

  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const col3Ref = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const columns = [col1Ref.current, col2Ref.current, col3Ref.current];

    columns.forEach((col, i) => {
      gsap.fromTo(
        col,
        { scale: 0.7, opacity: 0.5 }, // initial state
        {
          scale: 1, 
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top bottom",   // when text enters viewport
            end: "bottom top",     // until text leaves viewport
            scrub: true,           // ties animation progress to scroll
          },
        }
      );
    });
  }, []);

  return (
    <section className="lp-b-section">
      <div className="lp-b-text-wrapper" ref={textRef}>
        <h1 className="lp-b-text">Everything Dev. One Platform.</h1>
        <h1 className='lp-b-text2'>
        </h1>
      </div>
      <div className='f-a-wrapper'>
      </div>
    </section>
  );
}
