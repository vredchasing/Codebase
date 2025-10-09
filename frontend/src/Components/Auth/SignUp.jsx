import React, { useState } from "react";
import "./SignUp.css";

import { MdOutlineError } from "react-icons/md";
import axios from "axios";



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
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/signup',
        {
          name: form.name,
          email: form.email,
          password: form.password,
        },
        {
          withCredentials: false,
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'no-cors', // Disables CORS enforcement
        }
      );
      console.log(response);
    } catch (error) {
      console.error("Error during signup:", error);
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
          <button
            className="signup-button"
            type="submit"
            disabled={
              isEmpty(form.name) ||
              isEmpty(form.email) ||
              isEmpty(form.password) ||
              isEmpty(form.confirmPassword)
            }
          >
            Create Account
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
