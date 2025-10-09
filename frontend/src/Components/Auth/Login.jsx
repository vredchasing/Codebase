import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext'; // Adjust the path as necessary
import { useNavigate } from 'react-router-dom';

import './Login.css';

function Login() {
  const { login } = useContext(AuthContext); // Access the login function from context
  const navigate = useNavigate(); // Hook for navigation
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/login',
        {
          email: form.email,
          password: form.password,
        },
        {
          withCredentials: true, // Ensure cookies are sent with the request
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.user) {
        login(response.data.user);
        // Redirect or perform other actions as needed
        navigate('/dashboard'); // Redirect to the dashboard after login

      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  }

  return (
    <section className="login-wrapper">
      <div className="login-inner-content">
        <div className="login-header-wrapper">
          <div className="signup-logo-container">
            <div className="custom-logo-container-signup">
              <img
                className="square-signup"
                src="/public/images/square-logo.svg"
                alt="Logo"
              />
              <p className="logo-c-signup">C</p>
            </div>
          </div>
          <h1 className="login-title">Sign in to Codebase</h1>
        </div>

        <div className="external-signup-wrapper">
          <span className="signup-google">
            <div className="signup-google-icon-container">
              <img className="google-icon" src="/public/images/google-icon.svg" />
            </div>
            Sign in with Google
          </span>
        </div>
        <span className="or-span">
          <span className="line"></span> or <span className="line"></span>
        </span>
        <div className="login-form-wrapper">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-container">
              <input
                className="login-email-input"
                name="email"
                placeholder="Email"
                onChange={handleChange}
              />
            </div>
            <div className="login-input-container">
              <input
                className="login-password-input"
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleChange}
              />
            </div>
            <button className="signup-button" type="submit">
              Login
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Login;
