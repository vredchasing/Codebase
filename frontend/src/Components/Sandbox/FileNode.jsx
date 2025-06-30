import React, { useState } from 'react';
import './FileExplorer.css';
import { MdArrowBackIos } from 'react-icons/md';


import getIcon from './ExplorerIcons/iconHelperFuncs';


export default function FileNode({ node, activeFile, onFileSelect, level = 0 }) {
  const [expanded, setExpanded] = useState(true);

  // Generate indent lines per level
  const renderIndentGuides = (level) => {
    if (level <= 1) return null; // No indent guides for root or first level

    // Create an array length level - 1 and map from i=1 to level-1 (skip outermost)
    return Array.from({ length: level - 1 }).map((_, i) => {
      const index = i + 1; // shift index by 1 to skip outermost
      return (
        <span
          key={index}
          className="indent-guide"
          style={{ left: `${index * 13}px` }}
        />
      );
    });
  };



  //get icons

  const icon = getIcon(node);

  // FOLDER
  if (node.type === 'folder') {
    return (
      <>
        <div className="file-label-wrapper">
          <div className="file-indent">
            {renderIndentGuides(level)}
            <div
              className="file-content"
              onClick={() => setExpanded(!expanded)}
              style={{ paddingLeft: `${level * 13}px` }}
            >
              <MdArrowBackIos
                size={13}
                style={{
                  transform: expanded ? 'rotate(270deg)' : 'rotate(180deg)'
                }}
              />
              {node.name}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="folder-contents">
            {node.children.map(child => (
              <FileNode
                key={child.name}
                node={child}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  // FILE
  return (
    <div
      className={`file-label-wrapper ${node.name === activeFile.name ? 'active' : ''}`}
      onClick={() => onFileSelect(node)}
    >
      <div className="file-indent">
        {renderIndentGuides(level)}
        <div
          className="file-content"
          style={{ paddingLeft: `${level * 13}px` }}
        >
          <div className='icon-container'>
            <img className='icon-img' src={icon}></img>
          </div>
          {node.name}
        </div>
      </div>
    </div>
  );
}
