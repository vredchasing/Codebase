import React, { forwardRef } from "react";
import './LPHero.css';
import HeroShowcase from "../CustomHero/HeroShowcase";

const LPHero = forwardRef((props, ref) => {
    return (
        <section className="lp-hero-section" ref={ref}>
            <div className="lp-apps-wrapper">

                <div className="lp-app-container">
                    <img className="lp-app" src="/public/images/CustomHeroImages/website.PNG" />
                </div>
                <div className="lp-app-container">
                    <img className="lp-app" src="/public/images/CustomHeroImages/website.PNG" />
                </div>
                <div className="lp-app-container">
                    <img className="lp-app" src="/public/images/CustomHeroImages/website.PNG" />
                </div>
                <div className="lp-app-container">
                    <img className="lp-app" src="/public/images/CustomHeroImages/website.PNG" />
                </div>

            </div>
        </section>
    );
});

export default LPHero;
