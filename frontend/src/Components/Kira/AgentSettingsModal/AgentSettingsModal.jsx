import React, { useState } from 'react';
import { useSettingsModal } from '../../../contexts/SettingsModalContext';
import './AgentSettingsModal.css';
import { IoClose } from 'react-icons/io5';
import { CiSettings } from 'react-icons/ci';
import { RiDatabase2Line } from 'react-icons/ri';
import { TbBrain } from 'react-icons/tb';
import { MdOutlineSettings } from 'react-icons/md';
import RAGSection from './RAGSection';

const SECTIONS = [
  { id: 'rag', label: 'RAG', icon: RiDatabase2Line },
  { id: 'models', label: 'Models', icon: TbBrain },
  { id: 'general', label: 'General', icon: MdOutlineSettings },
];

function AgentSettingsModal() {
  const { isOpen, closeSettings } = useSettingsModal();
  const [activeSection, setActiveSection] = useState('rag');

  if (!isOpen) return null;

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
    <div className="agent-settings-modal-overlay" onClick={closeSettings} data-lenis-prevent>
      <div className="agent-settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="agent-settings-modal-header">
          <div className="agent-settings-modal-header-left">
            <CiSettings size={20} />
            <h2>Agent Settings</h2>
          </div>
          <button className="agent-settings-modal-close" onClick={closeSettings}>
            <IoClose size={20} />
          </button>
        </div>

        <div className="agent-settings-modal-body" data-lenis-prevent>
          <div className="agent-settings-modal-layout">
            {/* Left Navigation */}
            <div className="agent-settings-nav">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    className={`agent-settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon size={18} />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Content Area */}
            <div className="agent-settings-content-area">
              {renderSectionContent()}
            </div>
          </div>
        </div>

        <div className="agent-settings-modal-footer">
          <button className="agent-settings-modal-save" onClick={closeSettings}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgentSettingsModal;

