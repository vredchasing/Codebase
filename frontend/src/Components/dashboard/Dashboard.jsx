import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";


import { RxDashboard } from "react-icons/rx";
import { IoIosFolderOpen } from "react-icons/io";
import { FaRegFile } from "react-icons/fa6";
import { IoSearchSharp } from "react-icons/io5";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";






function Dashboard(){

  return (
    <section className="dashboard-wrapper">
      <div className="dashboard-inner-content">
        <div className="dashboard-nav-wrapper">
          <div className="dashboard-nav-header">
          </div>
          <div className="dashboard-options-wrapper">
            <div className="dashboard-options-inner-wrapper">
              <span className="dashboard-option">Dashboard</span>
              <span className="dashboard-option">Files</span>
              <span className="dashboard-option">Collections</span>
              <span className="dashboard-option">Explore</span>
              <span className="dashboard-option">Teams</span>
            </div>
            <div className="dashboard-support-container">
              <div className="dashboard-support-container-inner">
                <span className="dashboard-support-text">Need Help?</span>
                <div className="dashboard-support-icon-container">
                  <span className="dashboard-support-icon">?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-main-content-wrapper">
          <div className="dashboard-main-content-inner">
            <div className="dashboard-greeting-wrapper">
              <h1 className="dashboard-greeting">Good Evening, Abishek</h1>
            </div>
            <div className="dashboard-projects-wrapper">
              <div className="dashboard-projects-header">
                <div className="projects-header-left">
                  <h2 className="dashboard-projects-title">Recent Files</h2>
                  <div className="projects-filter-wrapper">
                    <div className="projects-filter-container">
                      <div className="projects-filter-type">Type <MdOutlineKeyboardArrowDown /></div>
                    </div>
                    <div className="projects-filter-file-size-container">
                      <div className="projects-filter-file-size">File Size <MdOutlineKeyboardArrowDown /></div>
                    </div>
                    <div className="projects-filter-date-modified-container">
                      <div className="projects-filter-date-modified">Date Modified <MdOutlineKeyboardArrowDown /></div>
                    </div>
                  </div>
                  <div className="projects-search-container">
                    <IoSearchSharp className="projects-search-icon"/>
                    <input className="projects-search-input" placeholder="Search Files"></input>
                  </div>
                </div>
                <div className="projects-create-container">
                  <Link to='/create-project' className="projects-create-button">+ Create New File</Link>
                </div>

              </div>
              <div className="dashboard-projects-content">
                <div className="dashboard-project-wrapper">
                  <div className="dashboard-project-card">
                    <div className="last-modified-date-container">
                      <h2 className="last-modified-date">10/7/2025</h2>
                    </div>
                    <div className="project-file-info-container">
                      <div className="projects-file-name-container">
                        <h2 className="project-file-name">Untitled Folder</h2>
                      </div>
                      <div className="project-collaborators-container">
                        <div className="project-collaborators-avatar-container">
                          <img className="project-colloborator-avatar" src="/public/images/background-images/background2.webp"></img>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="dashboard-project-card"></div>
                  <div className="dashboard-project-card"></div>
                  <div className="dashboard-project-card"></div>
                  <div className="dashboard-project-card"></div> 
                </div>
              </div>
            </div>

            <div className="dashboard-collections-wrapper">
              <div className="dashboard-collections-header">
                <h2 className="dashboard-collections-title">Your Collections</h2>
              </div> 
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

export default Dashboard;