import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, API_ENDPOINTS, handleError, validateForm, VALIDATION_RULES } from '../../utils';

import './Login.css';

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(form, {
      email: VALIDATION_RULES.EMAIL,
      password: VALIDATION_RULES.PASSWORD,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: form.email.trim(),
        password: form.password,
      });

      if (response.data?.user) {
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Login', (msg) => {
        setErrors({ submit: msg });
      });
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
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
            {errors.submit && (
              <div className="login-error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                {errors.submit}
              </div>
            )}
            <div className="login-input-container">
              <input
                className="login-email-input"
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && (
                <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.email}</span>
              )}
            </div>
            <div className="login-input-container">
              <input
                className="login-password-input"
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.password && (
                <span style={{ color: 'red', fontSize: '0.75rem' }}>{errors.password}</span>
              )}
            </div>
            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Login;
