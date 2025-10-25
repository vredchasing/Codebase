import React from "react";
import './KiraWorkspace.css'

import { RiClaudeFill } from "react-icons/ri";
import { BsCardImage } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

import { RiAddFill } from "react-icons/ri";
import { MdHistory } from "react-icons/md";






function KiraWorkspace (){

  return(
    <section className="kira-workspace-wrapper">
      <div className='kira-workspace-nav-wrapper'>
        <div className='kira-workspace-nav-inner'>
          <div className='kira-workspace-nav-left'>
            <span className="agent-nav-tab">New Chat</span>
          </div>
          <div className='kira-workspace-nav-right'>
            <span className="agent-nav-option-container">
              <RiAddFill></RiAddFill>
            </span>
            <span className="agent-nav-option-container">
              <MdHistory></MdHistory>
            </span>
          </div>
        </div>
      </div>
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
      <div className='kira-workspace-footer-wrapper'>
        <div className='kira-workspace-footer-inner'>
          <span className="past-chats-label"></span>
        </div>
      </div>
    </section>
  )

}

export default KiraWorkspace