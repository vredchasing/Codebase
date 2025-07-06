// Layout.jsx
import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Lenis from 'lenis'
import Header from './Components/Header'
import Footer from './Components/Footer'

const Layout = () => {

    useEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      lerp: 0.1, // Adjust smoothness (default is 0.1)
      autoRaf: false, // We will manually control RAF
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy(); // Cleanup on unmount
    };
  }, []);
  
  return (
    <>
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default Layout
