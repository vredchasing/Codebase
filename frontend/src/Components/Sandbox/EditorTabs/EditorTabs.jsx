// src/Components/Sandbox/EditorTabs/EditorTabs.jsx
import React, { useCallback } from 'react';
import './EditorTabs.css';
import { VscSettings } from "react-icons/vsc";
import getIcon from '../ExplorerIcons/iconHelperFuncs';
import { useSelector, useDispatch } from 'react-redux';
import {
  setOpenedTabs,
  setActiveTab,
  closeTab,
} from '../../../stores/reduxTK/slices/UI/uiSlice';
import { AGENT_SETTINGS_TAB } from '../../../stores/reduxTK/slices/workspace/workspaceSettingsSlice';

export default function EditorTabs() {
  const dispatch = useDispatch();

  const openedTabs = useSelector(
    (state) => state.workspaceUI.workspace.openedTabs
  ) || [];

  const activeTabId = useSelector(
    (state) => state.workspaceUI.workspace.activeTab
  );

  const handleTabClick = useCallback(
    (tab) => {
      if (!tab) return;
      dispatch(setActiveTab(tab.id));
    },
    [dispatch]
  );

  const handleCloseTab = useCallback(
    (tabId) => {
      dispatch(closeTab(tabId));
    },
    [dispatch]
  );

  // Filter for files + the special settings tab
  const validTabs = openedTabs.filter((tab) => {
    if (!tab) return false;
    // Always include settings tab
    if (tab.id === AGENT_SETTINGS_TAB) return true;
    // Only include real files
    return tab.node_type === 'file';
  });

  return (
    <div className="editor-tabs-main-wrapper">
      <div className="editor-tabs-inner-wrapper">
        {validTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const displayName = tab.name;

          const isSettings = tab.id === AGENT_SETTINGS_TAB;
          const iconSrc = !isSettings ? getIcon(tab) : null;

          return (
            <div
              key={tab.id}
              className={`editor-tabs-container ${isActive ? 'active' : ''}`}
            >
              <div
                className={`editor-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {/* Icon */}
                <div className="editor-tabs-icon-container">
                  {isSettings ? (
                    // Settings icon (use your preferred SVG/Icon)
                    <span className="settings-tab-icon"><VscSettings color='#a7a7a7' size={11}></VscSettings></span>
                  ) : (
                    <img
                      className="editor-tabs-icon-img"
                      src={iconSrc}
                      alt={displayName}
                    />
                  )}
                </div>

                {/* Tab Title */}
                <h1 className="editor-tabs-text">{displayName}</h1>

                {/* Close Button */}
                <span
                  className="editor-tabs-close-btn-container"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  <span className="editor-tabs-close-btn">×</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
