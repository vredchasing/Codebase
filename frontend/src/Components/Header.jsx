import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Header() {
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
          <img className="square" src="/public/images/square-logo.svg" alt="Logo" />
          <p className="logo-c">C</p>
        </div>

        <div className={`${scrollDirection === 'down' ? 'header-hidden' : 'header-visible'}`}>
          <Link to="/workspace" className="header-link">Workspace</Link>
          <Link to="/" className="header-link">Collections</Link>
          <Link to="/" className="header-link">Explore</Link>
          <Link to="/" className="header-link">Support</Link>
          <Link to="/" className="header-link">Docs</Link>
        </div>

        <div className="header-right-nav">
          <Link to="/signin" className="header-link">Sign In</Link>
          <Link to="/signup" className="header-link-try-for-free">Try for free</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
