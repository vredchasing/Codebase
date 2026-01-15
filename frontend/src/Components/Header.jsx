import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './Auth/AuthContext';
import { SlOptions } from 'react-icons/sl';
import { MdKeyboardArrowDown } from "react-icons/md";

import './Header.css'

function Header() {
  const { user } = useContext(AuthContext);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className='header'
    >
      <div className="header-content">
        <div className="custom-logo-container">
          <p className="logo">CODEBASE</p>
        </div>

        <div className={`${scrollDirection === 'down' ? 'header-hidden' : 'header-visible'}`}>
          <Link to="/dashboard" className="header-link">Product <MdKeyboardArrowDown size={14}/></Link>
          <Link to="/" className="header-link">Pricing</Link>
          <Link to="/" className="header-link">Workspace</Link>
          <Link to="/" className="header-link">Docs</Link>
        </div>

        <div className="header-right-nav">
          {user ? (
            <div className="header-right-nav-authenticated">
              <div className="header-profile-picture-container">
                <Link to="/dashboard" className="header-profile-picture">
                  <img 
                    src="/public/images/background-images/background2.webp" 
                    alt="Profile" 
                    className="profile-picture-img"
                  />
                </Link>
              </div>
              <SlOptions color='white' />
            </div>
          ) : (
            <>
              <Link to="/login" className="header-link">Login</Link>
              <Link to="/signup" className="header-link-try-for-free">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
