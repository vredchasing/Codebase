import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearUserInfo } from '../stores/reduxTK/slices/user/userSlice';

import { FiLogOut } from "react-icons/fi";

import './Header.css';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(state => state.user.userInfo);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  const dropdownRef = useRef();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    dispatch(clearUserInfo());
    setDropdownOpen(false);
    navigate('/login');
  }

  return (
    <header className='header'>
      <div className="header-content">
        <div className="custom-logo-container">
          <p className="logo">CODEBASE</p>
        </div>

        <div className='header-visible'>
          <Link to="/dashboard" className="header-link">Dashboard</Link>
          <Link to="/" className="header-link">Workspace</Link>
          <Link to="/" className="header-link">Features</Link>
          <Link to="/" className="header-link">Pricing</Link>
          <Link to="/" className="header-link">Docs</Link>
        </div>

        <div className="header-right-nav">
          {user ? (
            <div className="header-right-nav-authenticated" ref={dropdownRef}>
              <div
                className="header-profile-picture-container"
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                <img
                  src={user.avatarUrl || "/public/images/background-images/background2.webp"}
                  alt="Profile"
                  className="profile-picture-img"
                />
              </div>

              {dropdownOpen && (
                <div className="header-dropdown">
                  <div className="header-dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                    {user.name || 'Profile'}
                  </div>
                  <div className="header-dropdown-item" onClick={() => { navigate('/settings'); setDropdownOpen(false); }}>
                    Settings
                  </div>
                  <div className="header-dropdown-item" onClick={handleLogout}>
                    Logout <FiLogOut/>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="header-link">Login</Link>
              <Link to="/signup" className="header-link header-signup">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
