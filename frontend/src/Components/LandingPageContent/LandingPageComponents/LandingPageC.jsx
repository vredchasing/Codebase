import TabletModel from '../../ModelComponents/TabletModel'
import './LandingPageC.css'



//Terminal hero page

export default function LandingPageC (){


    return(
        <section className="lp-c-wrapper">
            <div className='lp-c-tablet-model-wrapper'>
                <TabletModel></TabletModel>
            </div>
            <div className='lp-c-text-wrapper'>
                <h1 className='lp-c-text'>
                    A sleek, intuitive code editor built for focus and speed. 
                    With real-time syntax highlighting and smart file navigation,
                    it’s the perfect space to bring your ideas to life.
                </h1>
            </div>
        </section>
    )

}