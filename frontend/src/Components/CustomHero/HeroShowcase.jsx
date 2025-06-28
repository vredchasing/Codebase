import React, { useEffect, useRef } from 'react'
import './HeroShowcase.css'

export default function HeroShowcase() {
  const monacoRef = useRef(null)
  const websiteRef = useRef(null)
  const website2Ref = useRef(null)

  useEffect(() => {
    let frameId = null

    const handleScroll = () => {
      if (frameId) return // throttle to one animation frame at a time
      frameId = requestAnimationFrame(() => {
        const scrollY = window.scrollY

        if (monacoRef.current) {
          const offset = scrollY * -0.2
          const rotation = scrollY * 0.01 // adjust this multiplier as needed
          monacoRef.current.style.transform = `translateY(${offset}px) rotateZ(${rotation}deg)`
        }

        if (websiteRef.current) {
          const offset = scrollY * -0.3
          const rotation = scrollY * -0.02
          websiteRef.current.style.transform = `translateY(${offset}px) rotateZ(${rotation}deg)`
        }

        if (website2Ref.current) {
          const offset = scrollY * -0.3
          const rotation = scrollY * 0.02
          website2Ref.current.style.transform = `translateY(${offset}px) rotateZ(${rotation}deg)`
        }

        frameId = null
      })
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <section className="hero-section">
      <div className="monaco-hero-container" ref={monacoRef}>
        <img
          className="monaco-hero-img"
          src="/images/CustomHeroImages/monaco.PNG"
          alt="Monaco"
        />
      </div>
      <div className="website-hero-container" ref={websiteRef}>
        <img
          className="website-hero-img"
          src="/images/CustomHeroImages/website.PNG"
          alt="Website"
        />
      </div>
      <div className="website2-hero-container" ref={website2Ref}>
        <img
          className="website2-hero-img"
          src="/images/CustomHeroImages/website2.PNG"
          alt="Website2"
        />
      </div>
    </section>
  )
}