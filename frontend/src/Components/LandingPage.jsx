import HeroShowcase from "./CustomHero/HeroShowcase";

function LandingPage (){
    return (
        <div className="landing-page">
            <div className="landing-page-content">
                <div className="landing-page-hero-content-wrapper">
                    <HeroShowcase></HeroShowcase>
                </div>
                <div className="landing-page-text-wrapper">
                    <div className="landing-page-text1"><h1 className="landing-page-text1-h1">CODEBASE</h1></div>
                    <div className="landing-page-text2"><h1 className="landing-page-text2-h1">CREATE. SAVE. SHARE.</h1></div>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;