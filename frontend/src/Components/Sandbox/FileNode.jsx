import React, { useState } from 'react';
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
  level = 0
}) {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputIcon, setInputIcon] = useState(extensionIconMap.default);

  const arrowStatus = () => {
    return expanded ? (
      <MdKeyboardArrowDown size={18} />
    ) : (
      <MdKeyboardArrowRight size={18} />
    );
  };

  function calculateLevel(nodeId, filesMap) {
    let level = 0;
    let current = filesMap[nodeId];

    while (current && current.parent_id !== null) {
      level++;
      current = filesMap[current.parent_id];
    }

    return level;
  }

  const depth = filesMap[node.id]?.depth ?? 0; // ✅ use depth from filesMap

  const renderIndentGuides = (level) => {
    if (level <= 1) return null;
    return Array.from({ length: level - 1 }).map((_, i) => (
      <span
        key={i}
        className="indent-guide"
        style={{ left: `${(i + 1) * 13}px` }}
      />
    ));
  };

  function handleInputIcon(e) {
    const value = e.target.value;
    setInputValue(value);
    const iconSrc = getInputIcon(value);
    setInputIcon(iconSrc);
  }

  const icon = getIcon(node);

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
            {renderIndentGuides(depth)}
            <div
              className="file-content"
              onClick={() => setExpanded(!expanded)}
              style={{ paddingLeft: `${depth * 13}px` }}
            >
              {arrowStatus()}
              {node.name}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="folder-contents">
            {node.children && node.children.map(child => (
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
              />
            ))}
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
        {renderIndentGuides(depth)}
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
