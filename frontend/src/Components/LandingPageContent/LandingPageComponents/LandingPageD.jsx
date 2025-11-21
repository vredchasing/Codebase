import './LandingPageD.css'
import { IoMicOutline } from "react-icons/io5";
import { AiOutlinePlus } from "react-icons/ai";

export default function LandingPageD (){
  return (
    <section className='lp-d-section'>
      <div className='lp-d-wrapper'>
        <div className='lp-d-header'>
          <h2 className='lp-d-title'>Collections</h2>
        </div>
        <div className='lp-d-inner-wrapper'>
          <div className='lp-d-card-container'>
            <div className='lp-d-card-header'>
              <h2 className='lp-d-card-title'>Create/Save</h2>
              <h3 className='lp-d-card-description'>Create or discover code, save them to your vault.</h3>
            </div>

            <div className='lp-d-card'></div>

          </div>

          <div className='lp-d-card-container'>
            <div className='lp-d-card-header'>
              <h2 className='lp-d-card-title'>Drop</h2>
              <h3 className='lp-d-card-description'>Easily drop code into your project. Use AI to integrate smoothly.</h3>
            </div>
            <div className='lp-d-card'></div>
          </div>

        </div>
      </div>
    </section>
  )
}
