import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroShowcase from "./CustomHero/HeroShowcase";
import CodeSplitAnimation from "./LogoSplitAnimation";
import Core from './Core/Core';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const sectionRef = useRef();
  const heroRef = useRef();
  const codeRef = useRef();
  const baseRef = useRef();
  const centerRef = useRef();
  const coreWrapperRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=200vh',
          scrub: true,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Split animation
      tl.to(codeRef.current, { x: '-100px', opacity: 0.6, ease: 'power1.out' }, 0);
      tl.to(baseRef.current, { x: '100px', opacity: 0.6, ease: 'power1.out' }, 0);

      // Scale-in center text

      // Scale-in core wrapper at the same time
      tl.fromTo(coreWrapperRef.current,
        { scale: 0, opacity: 1, transformOrigin: 'center center' },
        { scale: 1, opacity: 1, ease: 'power2.out' },
        0.2
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="landing-page-main-wrapper">
      <section
        ref={sectionRef}
        style={{
          height: '100vh',
          width:'100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          ref={heroRef}
          className="landing-page-hero-content-wrapper"
          style={{
            position: 'absolute',
            width: '100%',
            zIndex: 0,
          }}
        >
          <HeroShowcase />
        </div>

        <div
          className="landing-page-text-wrapper"
          style={{
            position: 'relative',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <CodeSplitAnimation
            codeRef={codeRef}
            baseRef={baseRef}
            centerRef={centerRef}
          />
        </div>
        
      <div className="core-wrapper" ref={coreWrapperRef}>
        <Core />
      </div>
      </section>
    </section>
  );
}
