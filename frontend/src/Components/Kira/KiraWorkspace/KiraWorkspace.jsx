import React from "react";
import './KiraWorkspace.css'

import { RiClaudeFill } from "react-icons/ri";
import { BsCardImage } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";




function KiraWorkspace (){

  return(
    <section className="kira-workspace-wrapper">
      <div className="kira-workspace-inner">
        <div className="kira-workspace-chat-history-wrapper">
        </div>
        <div className="kira-workspace-chat-input-wrapper">
          <div className="kira-workspace-chat-input-inner">
            <div className="kira-workspace-chat-top">
              <div className="kira-workspace-chat-top-inner">
                <div className="add-context-container">
                  <span className="add-context-button">@</span>
                </div>
              </div>
            </div>
            <input className="kira-workspace-chat-input" placeholder="Plan, search, build anything"></input>
            <div className="kira-workspace-chat-bottom">
              <div className="kira-workspace-chat-bottom-inner">
                <div className="current-mode-container">
                  <span className="current-mode"><RiClaudeFill></RiClaudeFill>Agent<MdOutlineKeyboardArrowDown size={14}></MdOutlineKeyboardArrowDown></span>
                </div>
                <div className="kira-workspace-chat-bottom-right">
                  <div className="upload-photo-container">
                    <span><BsCardImage color="gray"></BsCardImage></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )

}

export default KiraWorkspace