import React, { useState } from "react";
import "./SignUp.css";

import { MdOutlineError } from "react-icons/md";
import { api, API_ENDPOINTS, handleError, validateForm, VALIDATION_RULES } from '../../utils';



const SignUp = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isEmpty = (str) => str.trim().length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(form, {
      name: VALIDATION_RULES.NAME,
      email: VALIDATION_RULES.EMAIL,
      password: VALIDATION_RULES.PASSWORD,
      confirmPassword: {
        required: true,
        validator: (value, formData) => {
          if (value !== formData.password) {
            return 'Passwords do not match';
          }
          return null;
        },
      },
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SIGNUP, {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      
      if (response.data?.user) {
        // TODO: Redirect to dashboard or show success message
        console.log('Signup successful:', response.data);
      }
    } catch (error) {
      const errorMessage = handleError(error, 'SignUp', (msg) => {
        setErrors({ submit: msg });
      });
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="signup-wrapper">
      <div className="signup-content-wrapper">
        <div className="signup-header">
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
          <h1 className="signup-title">Sign up to Codebase</h1>
        </div>
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="external-signup-wrapper">
            <span className="signup-google">
              <div className="signup-google-icon-container">
                <img className="google-icon" src="/public/images/google-icon.svg" />
              </div>
              Sign up with Google
            </span>
          </div>
          <span className="or-span">
            <span className="line"></span> or <span className="line"></span>
          </span>
          <div className="signup-input-container">
            <input
              className="name-input"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
            />
            {touched.name && isEmpty(form.name) && (
              <MdOutlineError className="error-icon"/>
            )}
          </div>

          <div className="signup-input-container">
            <input
              className="email-input"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            {touched.email && isEmpty(form.email) && (
              <MdOutlineError className="error-icon"/>
            )}            
          </div>

          <div className="signup-input-container">
            <input
              className="password-input"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            {touched.password && isEmpty(form.password) && (
              <MdOutlineError className="error-icon"/>
            )}            
          </div>
          <div className="signup-input-container">
            <input
              className="password-input"
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {touched.confirmPassword && isEmpty(form.confirmPassword) && (
              <MdOutlineError className="error-icon"/>
            )}           
          </div>
          {errors.submit && (
            <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {errors.submit}
            </div>
          )}
          <button
            className="signup-button"
            type="submit"
            disabled={
              isLoading ||
              isEmpty(form.name) ||
              isEmpty(form.email) ||
              isEmpty(form.password) ||
              isEmpty(form.confirmPassword)
            }
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <h1 className="signup-login-option">
          Already have an account?{" "}
          <span className="signup-login">Login</span>
        </h1>
      </div>
    </div>
  );
};

export default SignUp;
