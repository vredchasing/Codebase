import React, { useCallback } from 'react';
import './EditorTabs.css';

import getIcon from '../ExplorerIcons/iconHelperFuncs';
import WindowControls from '../../FunctionalComponents/WindowControls';

export default function EditorTabs({
  // tabs could be the full list of available tab objects (for opening new ones)
  tabs,
  uiState,
  setUIState,
  updateLocalStorageUIState,
  onTabClick,
  onCloseTab
}) {
  // Derive openedTabs and activeTab from uiState
  const openedTabs = uiState.openedTabs || [];
  const activeTabName = uiState.activeTab;

  const handleTabClick = useCallback((tab) => {
    if (!tab) return;

    // If parent provides onTabClick callback, use it
    if (onTabClick) {
      onTabClick(tab);
      return;
    }

    // Otherwise, use internal state management
    const tabName = tab.name;
    let newOpenedTabs = openedTabs;
    // If tab isn't already opened, add it
    if (!openedTabs.some(t => t.name === tabName)) {
      newOpenedTabs = [...openedTabs, tab];
    }
    const newActiveTab = tabName;

    const newUIState = {
      ...uiState,
      openedTabs: newOpenedTabs,
      activeTab: newActiveTab,
      lastUpdated: Date.now(),
    };

    setUIState(newUIState);
    if (updateLocalStorageUIState) {
      updateLocalStorageUIState(newUIState);
    }
  }, [openedTabs, uiState, setUIState, updateLocalStorageUIState, onTabClick]);

  const handleCloseTab = useCallback((tabName) => {
    // If parent provides onCloseTab callback, use it
    if (onCloseTab) {
      onCloseTab(tabName);
      return;
    }

    // Otherwise, use internal state management
    const newOpenedTabs = openedTabs.filter(t => t.name !== tabName);

    let newActiveTab = activeTabName;
    if (activeTabName === tabName) {
      // If closing the active tab, pick last tab in list (if any)
      if (newOpenedTabs.length > 0) {
        newActiveTab = newOpenedTabs[newOpenedTabs.length - 1].name;
      } else {
        newActiveTab = null;
      }
    }

    const newUIState = {
      ...uiState,
      openedTabs: newOpenedTabs,
      activeTab: newActiveTab,
      lastUpdated: Date.now(),
    };

    setUIState(newUIState);
    if (updateLocalStorageUIState) {
      updateLocalStorageUIState(newUIState);
    }
  }, [openedTabs, activeTabName, uiState, setUIState, updateLocalStorageUIState, onCloseTab]);

  // Filter out any folders that might have been added incorrectly
  const validTabs = openedTabs.filter(tab => tab && tab.node_type === 'file');

  return (
    <div className="editor-tabs-wrapper">
      {validTabs.map(tab => {
        const isActive = tab.name === activeTabName;

        return (
          <div key={tab.name} className={`editor-tabs-container ${isActive ? 'active' : ''}`}>
            <div
              className={`editor-tab ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              <div className='editor-tabs-icon-container'>
                <img className='editor-tabs-icon-img' src={getIcon(tab)} alt={tab.name} />
              </div>
              <h1 className='editor-tabs-text'>{tab.name}</h1>
              <span
                className='editor-tabs-close-btn-container'
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering the tab click
                  handleCloseTab(tab.name);
                }}
              >
                <span className='editor-tabs-close-btn'>×</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
