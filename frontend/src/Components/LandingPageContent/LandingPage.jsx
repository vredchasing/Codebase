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
import LandingPageE from './LandingPageComponents/LandingPageE';
import LandingPageA from './LandingPageComponents/LandingPageA';

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

  return (
    <section className="landing-page-main-wrapper">
      <section className='lp-a-section-wrapper'>
        <LandingPageA></LandingPageA>
      </section>
      <section className='lp-b-section-wrapper'>
        <LandingPageB></LandingPageB>
      </section>

      <section className='lp-c-section-wrapper'>
        <LandingPageC></LandingPageC>
      </section>
      
      <section className='lp-e-section-wrapper'>
        <LandingPageE></LandingPageE>
      </section>
    </section>
  );
}
