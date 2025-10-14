// Layout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './Components/Header';
import Footer from './Components/Footer';
import { AuthProvider } from './Components/Auth/AuthContext'; // Adjust the path as necessary
import HeaderDashboard from './Components/HeaderDashboard';
import HeaderWorkspace from './Components/HeaderWorkspace';

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
  const [headerType, setHeaderType] = useState('default')

  function renderHeader (){
    if(headerType === 'dashboard'){
      return (
        <HeaderDashboard></HeaderDashboard>
      )
    }
    if(headerType === 'workspace'){
      return (
        <HeaderWorkspace></HeaderWorkspace>
      )
    }
    else{
      return(
        <HeaderDashboard></HeaderDashboard>
      )
    }
  }

  useEffect(()=>{
    if(location.pathname.startsWith('/dashboard')){
      setHeaderType('dashboard')
    }
    if(location.pathname.startsWith('/workspace')){
      setHeaderType('workspace')
    }
    else(
      setHeaderType('default')
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
