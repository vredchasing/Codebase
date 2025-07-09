import './LandingPage.css'

export default function CodebaseLogo ({codeRef, baseRef}){
    return (
        <div className="lp-codebase-container">
            <div className= 'lp-codebase-text' ref={codeRef}>CODE</div>
            <div className= 'lp-codebase-text' ref={baseRef}>BASE</div>
        </div>
    )
}