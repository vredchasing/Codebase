import React from "react"
import './Core.css'
import HeroShowcase from "../CustomHero/HeroShowcase"
function Core (){
    
    return(
        <section className="core-section">
          <div className="core1-wrapper">
            <div className="core1-hero-wrapper">
              <HeroShowcase></HeroShowcase>
            </div>
            <div className="core1-right">
              <div className="core1-right-text">
                <span className="core1-text1">
                  Create. Share. Explore.
                </span>
                <span className="core1-text2">
                </span>
              </div>
            </div>
          </div>
        </section>
    )

}

export default Core