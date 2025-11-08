import React, { useState, useCallback } from 'react';
import './FileExplorer/FileExplorer.css';
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import getIcon from './ExplorerIcons/iconHelperFuncs';
import { getInputIcon } from './ExplorerIcons/iconHelperFuncs';
import { extensionIconMap } from './ExplorerIcons/Icons';

export default function FileNode({
  node,
  activeFile,
  onFileSelect,
  onStartCreate,
  creatingNode,
  inputRef,
  onConfirmCreate,
  onCancelCreate,
  onContextMenu,
  filesMap,
  setFilesMap,
  uiState,
  setUIState,
  updateLocalStorageUIState,
  level = 0,
  isLastChild = false
}) {
  // remove local expanded state (we'll derive it from uiState)
  // const [expanded, setExpanded] = useState(false);  

  const [inputValue, setInputValue] = useState('');
  const [inputIcon, setInputIcon] = useState(extensionIconMap.default);

  const depth = filesMap[node.id]?.depth ?? 0;
  const nodeIsLastChild = filesMap[node.id]?.isLastChild ?? isLastChild;

  // No longer rendering individual indent guides - lines are rendered as continuous segments
  // This function is kept for potential horizontal connector lines if needed
  const renderIndentGuides = (level, isLast) => {
    // Lines are now rendered as continuous segments in FileExplorer
    // This can be used for horizontal connectors if needed
    return null;
  };

  function handleInputIcon(e) {
    const value = e.target.value;
    setInputValue(value);
    const iconSrc = getInputIcon(value);
    setInputIcon(iconSrc);
  }

  const icon = getIcon(node);

  // Derive expanded status from UI state
  const isExpanded = uiState.expandedFolders
    ? uiState.expandedFolders.includes(node.id)
    : false;

  const arrowStatus = () => {
    return isExpanded ? (
      <MdKeyboardArrowDown size={18} />
    ) : (
      <MdKeyboardArrowRight size={18} />
    );
  };

  // Define the click handler for folder toggling
  const handleFolderClick = useCallback(
    (e) => {
      e.stopPropagation();
      const folderId = node.id;
      const currentlyExpanded = uiState.expandedFolders ?? [];

      let newExpanded;
      if (currentlyExpanded.includes(folderId)) {
        // folder already expanded → collapse it (remove from list)
        newExpanded = currentlyExpanded.filter(id => id !== folderId);
      } else {
        // folder not expanded → expand it (add to list)
        newExpanded = [...currentlyExpanded, folderId];
      }

      // Update UI state
      setUIState({
        ...uiState,
        expandedFolders: newExpanded
      });
      // Optionally persist
      if (updateLocalStorageUIState) {
        updateLocalStorageUIState({ expandedFolders: newExpanded });
      }
    },
    [node.id, uiState, setUIState, updateLocalStorageUIState]
  );

  if (node.node_type === 'folder') {
    return (
      <>
        <div
          className="file-label-container"
          onContextMenu={(e) => {
            if (onContextMenu) onContextMenu(e, node);
          }}
        >
          <div className="file-indent">
            {renderIndentGuides(depth, nodeIsLastChild)}
            <div
              className="file-content"
              onClick={handleFolderClick}
              style={{ paddingLeft: `${depth * 13}px`, cursor: 'pointer' }}
            >
              {arrowStatus()}
              {node.name}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="folder-contents">
            {node.children && node.children.map((child, index) => {
              const childIsLast = index === node.children.length - 1;
              return (
                <FileNode
                  key={child.id}
                  node={child}
                  activeFile={activeFile}
                  onFileSelect={onFileSelect}
                  onStartCreate={onStartCreate}
                  creatingNode={creatingNode}
                  inputRef={inputRef}
                  onConfirmCreate={onConfirmCreate}
                  onCancelCreate={onCancelCreate}
                  onContextMenu={onContextMenu}
                  filesMap={filesMap}
                  setFilesMap={setFilesMap}
                  uiState={uiState}
                  setUIState={setUIState}
                  updateLocalStorageUIState={updateLocalStorageUIState}
                  isLastChild={childIsLast}
                />
              );
            })}
          </div>
        )}

        {creatingNode && creatingNode.parentId === node.id && (
          <div
            className="new-node-input-container"
            style={{
              paddingLeft: `${(depth + 1) * 13}px`,
              width: `calc(100% - ${(depth + 1) * 13}px)`
            }}
          >
            <div
              className="input-wrapper"
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%'
              }}
            >
              {inputIcon && (
                <div className="input-icon-container">
                  <img
                    src={inputIcon}
                    alt="file icon"
                    className="icon-img"
                  />
                </div>
              )}
              <input
                ref={inputRef}
                className="file-explorer-new-input"
                value={inputValue}
                onChange={handleInputIcon}
                placeholder=""
                onBlur={e => {
                  onConfirmCreate(e.target.value);
                  setInputValue('');
                  setInputIcon(extensionIconMap.default);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirmCreate(e.target.value);
                    setInputValue('');
                    setInputIcon(extensionIconMap.default);
                  }
                  if (e.key === 'Escape') {
                    onCancelCreate();
                    setInputValue('');
                    setInputIcon(extensionIconMap.default);
                  }
                }}
                style={{ flex: 1, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // non-folder (file) branch
  return (
    <div
      className={`file-label-container ${
        activeFile && node.name === activeFile.name ? 'active' : ''
      }`}
      onClick={() => onFileSelect(node)}
      onContextMenu={(e) => {
        if (onContextMenu) onContextMenu(e, node);
      }}
    >
      <div className="file-indent">
        {renderIndentGuides(depth, nodeIsLastChild)}
        <div
          className="file-content"
          style={{ paddingLeft: `${depth * 13}px` }}
        >
          <div className="icon-container">
            <img className="icon-img" src={icon} alt={node.name} />
          </div>
          {node.name}
        </div>
      </div>
    </div>
  );
}
