// src/Components/Sandbox/EditorTabs/EditorTabs.jsx
import React, { useCallback } from 'react';
import './EditorTabs.css';
import getIcon from '../ExplorerIcons/iconHelperFuncs';
import { useSelector, useDispatch } from 'react-redux';
import { setOpenedTabs, setActiveTab } from '../../../stores/reduxTK/slices/UI/uiSlice';

export default function EditorTabs() {
  const dispatch = useDispatch();
  const openedTabs = useSelector(state => state.workspaceUI.workspace.openedTabs) || [];
  const activeTabName = useSelector(state => state.workspaceUI.workspace.activeTab);

  const handleTabClick = useCallback((tab) => {
    if (!tab) return;
    const tabName = tab.name;

    // Derive fresh state directly from Redux
    const newOpenedTabs = openedTabs.some(t => t.name === tabName) ? openedTabs : [...openedTabs, tab];
    dispatch(setOpenedTabs(newOpenedTabs));
    dispatch(setActiveTab(tabName));
  }, [openedTabs, dispatch]);

  const handleCloseTab = useCallback((tabName) => {
    const newOpenedTabs = openedTabs.filter(t => t.name !== tabName);
    const newActiveTab = activeTabName === tabName && newOpenedTabs.length > 0
      ? newOpenedTabs[newOpenedTabs.length - 1].name
      : (newOpenedTabs.length === 0 ? null : activeTabName);

    dispatch(setOpenedTabs(newOpenedTabs));
    dispatch(setActiveTab(newActiveTab));
  }, [openedTabs, activeTabName, dispatch]);

  const validTabs = openedTabs.filter(tab => tab && tab.node_type === 'file');

  return (
    <div className='editor-tabs-main-wrapper'>
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
                    e.stopPropagation();
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
    </div>
  );
}
