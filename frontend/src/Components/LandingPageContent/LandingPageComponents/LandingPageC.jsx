import FeaturesAnimation from '../../FeaturesAnimationFolder/FeaturesAnimation'
import './LandingPageC.css'



//Terminal hero page

export default function LandingPageC (){


    return(
        <section className="lp-c-wrapper">
            <div className='kira-intro-wrapper'>
                <h1 className='kira-intro-1'>Meet Kira.</h1>
                <h1 className='kira-intro-2'>Intelligent AI designed to innovate your workflow.</h1>
                <div className='kira-voice-wrapper'>
                    <img className='kira-voice' src='/public/images/voice2.gif'></img>
                </div>
            </div>
        </section>
    )

}