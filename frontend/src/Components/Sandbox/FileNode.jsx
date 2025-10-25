import React, { useState } from 'react';
import './FileExplorer/FileExplorer.css';
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import getIcon from './ExplorerIcons/iconHelperFuncs';

export default function FileNode({
  node,
  activeFile,
  onFileSelect,
  onStartCreate,
  creatingNode,
  inputRef,
  onConfirmCreate,
  onCancelCreate,
  level = 0
}) {
  const [expanded, setExpanded] = useState(false);

  const arrowStatus = () => {
    return expanded ? (
      <MdKeyboardArrowDown size={18} />
    ) : (
      <MdKeyboardArrowRight size={18} />
    );
  };

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

  const icon = getIcon(node);

  if (node.node_type === 'folder') {
    return (
      <>
        <div className="file-label-container">
          <div className="file-indent">
            {renderIndentGuides(level)}
            <div
              className="file-content"
              onClick={() => setExpanded(!expanded)}
              style={{ paddingLeft: `${level * 13}px` }}
            >
              {arrowStatus()}
              {node.name}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="folder-contents">
            {node.children.map(child => (
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
                level={level + 1}
              />
            ))}
          </div>
        )}

        {creatingNode && creatingNode.parentId === node.id && (
          <div
            className="new-node-input-container"
            style={{
              paddingLeft: `${(level + 1) * 13}px`,
              width: `calc(100% - ${(level + 1) * 13}px)`
            }}
          >
            <input
              ref={inputRef}
              className="file-explorer-new-input"
              placeholder={
                creatingNode.nodeType === 'folder'
                  ? ''
                  : ''
              }
              onBlur={e => onConfirmCreate(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onConfirmCreate(e.target.value);
                }
                if (e.key === 'Escape') {
                  onCancelCreate();
                }
              }}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`file-label-container ${
        node.name === activeFile.name ? 'active' : ''
      }`}
      onClick={() => onFileSelect(node)}
    >
      <div className="file-indent">
        {renderIndentGuides(level)}
        <div
          className="file-content"
          style={{ paddingLeft: `${level * 13}px` }}
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
