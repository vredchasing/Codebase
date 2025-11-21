import FeaturesAnimation from '../../FeaturesAnimationFolder/FeaturesAnimation'
import './LandingPageC.css'

import { FiArrowUpRight } from "react-icons/fi";



//Terminal hero page

export default function LandingPageC (){


    return(
        <section className="lp-c-section">
            <div className='lp-c-wrapper'>
                <div className='lp-c-header'>
                    <h2 className='lp-c-title'>
                        Introducing SDKs
                    </h2>
                    <h3 className='lp-c-description'>Build with a customizeable toolkit</h3>
                </div>
                <div className='lp-c-inner-wrapper'>
                    <div className='lp-c-inner-center-wrapper'>
                        <div className='lp-c-inner-center-left'>
                            <h2 className='codebase-sdk-logo1'>CODEBASE</h2>
                            <h2 className='codebase-sdk-logo2'>SDK</h2>
                        </div>
                        <div className='lp-c-inner-center-right'>
                            <h2 className='lp-c-inner-center-right-h2'>
                                Spin up custom development environments
                            </h2>
                            <h3 className='lp-c-inner-center-right-h3'>
                                Personalize your SDK with a vast library of custom tools.
                            </h3>
                            <div className='lp-c-sdk-btns-wrapper'>
                                <span className='sdk-explore-btn'>Explore <FiArrowUpRight></FiArrowUpRight></span>
                                <span className='sdk-docs-btn'>Read the Docs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )

}