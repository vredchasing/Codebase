import './LandingPageB.css'

export default function LandingPageB (){
 
    
    return (
        <section className="lp-b-section">
            <div className="lp-b-text-wrapper">
                <h1 className='lp-b-text'>
                    Everything Dev. One Platform.
                </h1>
            </div>
            <div className='lp-b-icons-wrapper'>

                <div className='lp-b-icon-main-container'>
                    <div className='lp-b-icon-container'>
                        <img className='lp-b-icon' src='/public/images/LPB-Icons/LP-b-design.png'></img>
                    </div>
                    <span className='lp-b-icon-label'>Design</span>
                </div>
                <span className='lp-b-span'>.</span>

                <div className='lp-b-icon-main-container'>
                    <div className='lp-b-icon-container'>
                        <img className='lp-b-icon' src='/public/images/LPB-Icons/LP-b-terminal.png'></img>
                    </div>
                    <span className='lp-b-icon-label'>Code</span>
                </div>
                <span className='lp-b-span'>.</span>

                <div className='lp-b-icon-main-container'>
                    <div className='lp-b-icon-container'>
                        <img className='lp-b-icon' src='/public/images/LPB-Icons/LP-b-cloud.png'></img>
                    </div>
                    <span className='lp-b-icon-label'>Deploy</span>
                </div>

            </div>
        </section>
    )

}