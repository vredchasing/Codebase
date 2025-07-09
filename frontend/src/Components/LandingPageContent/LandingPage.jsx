import { useRef, useEffect, useState, Suspense } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './LandingPage.css'

import HeroShowcase from "./CustomHero/HeroShowcase";
import CodeSplitAnimation from "./LogoSplitAnimation";
import Core from './Core/Core';
import IpadModel from '../ModelComponents/IpadModel';
import CodebaseLogo from './LogoSplitAnimationB';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const sectionRef = useRef();
  const heroRef = useRef();
  const codeRef = useRef();
  const baseRef = useRef();
  const centerRef = useRef();
  const coreWrapperRef = useRef();


  //model refs

  const ipadRef = useRef()
  const [modelLoaded, setModelLoaded] = useState(false)

  //model animtions GSAP
useEffect(() => {
  if (!modelLoaded) return; // Wait until model is loaded
  if (!ipadRef.current) return;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "+=400vh",
        scrub: true,
        pin: true,
        anticipatePin: 1,
      },
    });

    // UI animations
    tl.to(codeRef.current, { ease: "power1.out" }, 0);
    tl.to(baseRef.current, { ease: "power1.out" }, 0);
    tl.to(heroRef.current, { opacity: 0, ease: "power1.inOut", scale: 1.3 }, 0.1);
    tl.fromTo(
      coreWrapperRef.current,
      { scale: 0, opacity: 0, transformOrigin: "center center", backgroundColor: "#ebebeb" },
      { scale: 1, opacity: 0, backgroundColor: "white", ease: "power2.out" },
      0.15
    );

    // Model animations
    tl.to(ipadRef.current.position, { x: 1.57, y: -0.5, z: 1, duration: 1 }, 0);
    tl.to(ipadRef.current.scale, { x: 4, y: 4, z: 4, duration: 1 }, 0);
    tl.to(ipadRef.current.rotation, { x: -1, y: 0, z: 1.57, duration: 1 }, 0);

  }, sectionRef);

  return () => ctx.revert();
}, [modelLoaded]);


  return (
    <section className="landing-page-main-wrapper"
    >
      <section
        className='landing-page-wrapper'
        ref={sectionRef}
      >
        <div className='landing-page-ipad-wrapper'>
          <Suspense>
            <IpadModel ipadRef={ipadRef} onLoad={()=>{setModelLoaded(true)}}></IpadModel>
          </Suspense>
        </div>
        <div className='lp-text1-wrapper'>
          <CodebaseLogo codeRef={codeRef} baseRef={baseRef}></CodebaseLogo>
        </div>
        <div className="lp-text2-wrapper">
          <CodeSplitAnimation
            codeRef={codeRef}
            baseRef={baseRef}
            centerRef={centerRef}
          />
        </div>
      </section>
    </section>
  );
}
