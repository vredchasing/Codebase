import React, { forwardRef } from "react";
import './LPHero.css';
import HeroShowcase from "../CustomHero/HeroShowcase";

const LPHero = forwardRef((props, ref) => {
    return (
        <section className="lp-hero-section" ref={ref}>
            <div className="lp-apps-wrapper">


            </div>
        </section>
    );
});

export default LPHero;
