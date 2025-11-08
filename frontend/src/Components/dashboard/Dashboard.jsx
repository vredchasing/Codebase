import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./Dashboard.css";


import { RxDashboard } from "react-icons/rx";
import { IoIosFolderOpen } from "react-icons/io";
import { FaRegFile } from "react-icons/fa6";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import axios from "axios";
import DashboardProjectsDefault from "./DashboardProjectsDefault";
import ProjectCard from "./ProjectCard";

import { MdSpaceDashboard } from "react-icons/md";
import { MdOutlineBookmark } from "react-icons/md";
import { AiOutlineTeam } from "react-icons/ai";
import { PiFileFill } from "react-icons/pi";
import { IoSearchSharp } from "react-icons/io5";







function Dashboard(){

  const [userProjects, setUserProjects] = useState([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await axios.get("http://localhost:3000/api/dashboard/get-user-projects", {
          withCredentials: true,
        });

        setUserProjects(response.data);
        console.log(response.data) // backend returns array of projects
      } catch (err) {
        console.error("Error fetching projects:", err);
        setUserProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const [collections, setCollections] = useState([]);

  useEffect(() => {
    async function fetchCollections() {
      try{
        const response = await axios.get("http://localhost:3000/api/collections/get-user-collections", {
          withCredentials: true,
        });
        setCollections(response.data);
      }
      catch(err){
        console.error("Error fetching collections:", err);
      }
    }
  }, []);
  

  return (
    <section className="dashboard-wrapper">
      <div className="dashboard-inner-content">
        <div className="dashboard-nav-wrapper">
          <div className="dashboard-nav-header">
          </div>
          <div className="dashboard-options-wrapper">
            <div className="dashboard-options-inner-wrapper">
              <span className="dashboard-option"><MdSpaceDashboard size={15}></MdSpaceDashboard>Dashboard</span>
              <span className="dashboard-option"><PiFileFill size={15}></PiFileFill>Files</span>
              <span className="dashboard-option"><MdOutlineBookmark size={15}></MdOutlineBookmark>Collections</span>
              <span className="dashboard-option"><IoSearchSharp size={15}></IoSearchSharp>Explore</span>
              <span className="dashboard-option"><AiOutlineTeam size={15}></AiOutlineTeam>Teams</span>
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
                  {userProjects.length > 0 ? (
                    userProjects.map(project => (
                      <ProjectCard key={project.id} data={project}></ProjectCard>
                    ))
                  ) : (
                    <DashboardProjectsDefault></DashboardProjectsDefault>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-collections-wrapper">
              <div className="dashboard-collections-header">
                <h2 className="dashboard-collections-title">Your Collections</h2>
              </div> 
              <div className="dashboard-collections-content">
                  {collections.length > 0 ? (
                    userProjects.map(project => (
                      <ProjectCard key={project.id} data={project}></ProjectCard>
                    ))
                  ) : (
                    <div className="no-collections-wrapper">
                      <p className="no-collections-text"><MdOutlineBookmark size={60} color="gray"></MdOutlineBookmark></p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

export default Dashboard;