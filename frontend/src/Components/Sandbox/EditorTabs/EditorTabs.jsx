import React from 'react';
import './EditorTabs.css';

import getIcon from '../ExplorerIcons/iconHelperFuncs';
import WindowControls from '../../FunctionalComponents/WindowControls';

export default function EditorTabs({ tabs, activeTab, onTabClick, onCloseTab }) {
  
  return (
    <div className="editor-tabs-wrapper">
      {tabs.map((tab) => (
        <div key={tab.name} className="editor-tabs-container">
          <div
            className={`editor-tab ${tab.name === activeTab ? 'active' : ''}`}
            onClick={() => onTabClick(tab)}
          >
            <div className='editor-tabs-icon-container'>
              <img className='editor-tabs-icon-img' src={getIcon(tab)}></img>
            </div>
            <h1 className='editor-tabs-text'h1>{tab.name}</h1>
            <span className='editor-tabs-close-btn-container'
              onClick={(e) => {
                e.stopPropagation(); // prevent triggering onClick
                onCloseTab(tab.name);
              }}
            >
              <span className='editor-tabs-close-btn'>
                x
              </span>
            </span>
          </div>
        </div>
      ))}
      <div className='editor-window-controls'>
      </div>
    </div>
  );
}
