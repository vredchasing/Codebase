import React from 'react';
import { useState } from 'react';
import './AgentSettingsTab.css';
import { GoInfinity } from "react-icons/go";
import { TbCube } from "react-icons/tb";
import { VscSettings } from "react-icons/vsc";
import { FaBookOpen } from "react-icons/fa6";

import RAGSection from './RAGSection';

export default function AgentSettingsTab() {

  const NAV_OPTIONS = [
    { id: 'rag', label: 'Agents', icon: GoInfinity },
    { id: 'models', label: 'Models', icon: TbCube },
    { id: 'general', label: 'General', icon: VscSettings },
  ];

  const [activeSection, setActiveSection] = useState('rag');

  
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'rag':
        return <RAGSection />;
      case 'models':
        return (
          <div className="settings-section-content">
            <div className="agent-settings-section">
              <h3>Model Settings</h3>
              <p className="agent-settings-description">
                Configure AI model preferences and parameters.
              </p>
              <p className="agent-settings-description" style={{ color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>
                Coming soon...
              </p>
            </div>
          </div>
        );
      case 'general':
        return (
          <div className="settings-section-content">
            <div className="agent-settings-section">
              <h3>General Settings</h3>
              <p className="agent-settings-description">
                General agent preferences and behavior settings.
              </p>
              <p className="agent-settings-description" style={{ color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>
                Coming soon...
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="agent-settings-tab-wrapper">
      <div className='agent-settings-tab-content'>
        <div className='agent-settings-tab-inner-content-container'>
          <div className='agent-settings-tab-inner-content'>
            <div className='agent-settings-tab-left-container'>
              <div className='agent-settings-tab-nav-wrapper'>
              <div className="agent-settings-search-container">
                  <input
                    className="agent-settings-search-input"
                    placeholder="Search settings Ctrl+F"
                  />
                </div>
                <div className="agent-settings-nav-container">
                  {NAV_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        className={`agent-settings-nav-item ${activeSection === option.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(option.id)}
                      >
                        <Icon size={18} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className='agent-settings-tab-right-container'>
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}