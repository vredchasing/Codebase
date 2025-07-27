import { useRef, useEffect, useState, Suspense } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './LandingPage.css'

import HeroShowcase from "./CustomHero/HeroShowcase";
import CodeSplitAnimation from "./LogoSplitAnimation";
import LPHero from './LPHeroApps/LPHero';
import IpadModel from '../ModelComponents/IpadModel';
import CodebaseLogo from './LogoSplitAnimationB';
import LandingPageB from './LandingPageComponents/LandingPageB';
import LandingPageC from './LandingPageComponents/LandingPageC';
import LandingPageD from './LandingPageComponents/LandingPageD';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const sectionRef = useRef();
  const heroRef = useRef();
  const codeRef = useRef();
  const baseRef = useRef();
  const sloganRef = useRef();
  const exploreRef = useRef();
  const learnMoreRef = useRef();
  const coreWrapperRef = useRef();


  //apps refs

  const appsWrapperRef = useRef()


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
        end: "+=180vh",
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
    tl.to(ipadRef.current.position, { x: 1.1555, y: -0.4, z: 1.7, duration: 1 }, 0);
    tl.to(ipadRef.current.scale, { x: 3, y: 3, z: 3, duration: 1 }, 0);
    tl.to(ipadRef.current.rotation, { x: -1.57, y: 0, z: 1.57, duration: 1 }, 0);


    //text animations

    tl.to(exploreRef.current, {opacity: 0, scale: 0.9}, 0)
    tl.to(learnMoreRef.current, {opacity: 0, scale: 0.9}, 0)

    const appContainers = appsWrapperRef.current.querySelectorAll(".lp-app-container");

    // Example: stagger scale + fade in, starting at 0.2 on the timeline
    tl.fromTo(
      appContainers,
      { opacity: 1, scale: 1, y: 0, rotateX: 65 },
      {
        opacity: 1,
        scale: 1.1,
        y: -180,
        rotateX: 0,
        duration: 0.5,      // run faster to finish earlier
        ease: "power2.out",
        stagger: 0.25,
      },
      0                     // start at beginning of timeline
    );


  }, sectionRef);

  return () => ctx.revert();
}, [modelLoaded]);


  return (
    <section className="landing-page-main-wrapper">
      <section
        className='landing-page-wrapper'
        ref={sectionRef}
        style={{ height: '150vh' }}
      >
        <div className='landing-page-ipad-wrapper'>
          <Suspense>
            <IpadModel ipadRef={ipadRef} onLoad={()=>{setModelLoaded(true)}}></IpadModel>
          </Suspense>
        </div>
        <div className='landing-page-main-hero'>
          <div className='lp-hero-apps-main-wrapper'>
            <LPHero ref= {appsWrapperRef}></LPHero>
          </div>

          <div className='lp-text1-wrapper'>
            <CodebaseLogo codeRef={codeRef} baseRef={baseRef}></CodebaseLogo>
          </div>
          <div className="lp-text2-wrapper">
            <CodeSplitAnimation
              sloganRef={sloganRef}
              exploreRef={exploreRef}
              learnMoreRef={learnMoreRef}
            />
          </div>
        </div>
      </section>

      <section className='lp-b-section-wrapper'>
        <LandingPageB></LandingPageB>
      </section>

      <section className='lp-c-section-wrapper'>
        <LandingPageC></LandingPageC>
      </section>

      <section className='lp-d-section-wrapper'>
        <LandingPageD></LandingPageD>
      </section>
    </section>
  );
}
