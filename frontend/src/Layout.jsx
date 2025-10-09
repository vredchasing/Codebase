// Layout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './Components/Header';
import Footer from './Components/Footer';
import { AuthProvider } from './Components/Auth/AuthContext'; // Adjust the path as necessary
import HeaderDashboard from './Components/HeaderDashboard';

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

  const location = useLocation()
  const [headerType, setHeaderType] = useState('non-dashboard')

  function renderHeader (){
    if(headerType === 'dashboard'){
      return (
        <HeaderDashboard></HeaderDashboard>
      )
    }
    else{
      return(
        <Header></Header>
      )
    }
  }

  useEffect(()=>{
    if(location.pathname.startsWith('/dashboard')){
      setHeaderType('dashboard')
    }
    else(
      setHeaderType('non-dashboard')
    )
  }, [location.pathname])

  return (
    <AuthProvider>
      {renderHeader()}
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </AuthProvider>
  );
};

export default Layout;
