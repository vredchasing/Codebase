import React from "react"
import './HeaderDashboard.css'


import { SlSettings } from "react-icons/sl";
import { SlOptions } from "react-icons/sl";





function HeaderDashboard (){

  return(
    <header className="header-dashboard-wrapper">
      <div className="header-dashboard-left">
        <h1 className="header-dashboard-logo">CODEBASE</h1>
      </div>
      <div className="header-dashboard-right">
        <div className="header-dashboard-avatar-container">
          <img className="header-dashboard-avatar" src="/public/images/background-images/background2.webp"></img>
        </div>
        <SlOptions></SlOptions>
      </div>
    </header>
  )
}

export default HeaderDashboard