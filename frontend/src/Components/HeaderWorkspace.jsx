import React from "react";
import './HeaderWorkspace.css'
import { LiaLongArrowAltLeftSolid } from "react-icons/lia";
import { LiaLongArrowAltRightSolid} from "react-icons/lia"
import { MdFullscreen } from "react-icons/md";
import { MdFullscreenExit } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { IoSearch } from "react-icons/io5";




function HeaderWorkspace (){
  return(
    <header className="workspace-header">
      <div className="workspace-header-inner">
        <div className="workspace-header-nav-wrapper">
          <nav className="workspace-header-nav">
            <span className="workspace-nav-option">File</span>
            <span className="workspace-nav-option">Edit</span>
            <span className="workspace-nav-option">Selection</span>
            <span className="workspace-nav-option">View</span>
            <span className="workspace-nav-option">Go</span>
            <span className="workspace-nav-option">Run</span>    
          </nav>
          <div className="nav-arrows-wrapper">
            <LiaLongArrowAltLeftSolid color="gray"></LiaLongArrowAltLeftSolid>
            <LiaLongArrowAltRightSolid color="gray"></LiaLongArrowAltRightSolid>
          </div>
        </div>
        <div className='workspace-header-center-wrapper'>
          <div className="workspace-header-center-inner">
            <span className="workspace-search-input-placeholder">
              <IoSearch className="workspace-search-icon"></IoSearch>
              Codebase
            </span>
            <input className="workspace-search-input"></input>
          </div>
        </div>
        <div className="workspace-header-right-wrapper">
          <div className="workspace-header-right-inner">
            <button 
              className="workspace-header-settings-btn"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '0.5rem', 
                display: 'flex', 
                alignItems: 'center',
                color: '#b0b0b0ff'
              }}
            >
              <CiSettings size={20} />
            </button>
            <div className="workspace-header-avatar-container">
              <img className="workspace-header-avatar" src="/public/images/background-images/background2.webp"></img>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeaderWorkspace