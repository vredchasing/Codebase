import { useRef, useEffect, useState, Suspense } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './LandingPage.css'

import HeroShowcase from "./CustomHero/HeroShowcase";
import CodeSplitAnimation from "./LogoSplitAnimation";
import IpadModel from '../ModelComponents/IpadModel';
import CodebaseLogo from './LogoSplitAnimationB';
import LandingPageB from './LandingPageComponents/LandingPageB';
import LandingPageC from './LandingPageComponents/LandingPageC';
import LandingPageD from './LandingPageComponents/LandingPageD';
import LandingPageE from './LandingPageComponents/LandingPageE';
import LandingPageA from './LandingPageComponents/LandingPageA';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
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

      <section className='lp-d-section-wrapper'>
        <LandingPageD></LandingPageD>
      </section>

      <section className='lp-e-section-wrapper'>
        <LandingPageE></LandingPageE>
      </section>
    </section>
  );
}
