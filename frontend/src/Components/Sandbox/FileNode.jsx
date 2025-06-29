import React, { useState } from 'react';
import './FileExplorer.css';
import { MdArrowBackIos } from 'react-icons/md';

export default function FileNode({ node, activeFile, onFileSelect, level = 0 }) {
  const [expanded, setExpanded] = useState(true);

  // Generate indent lines per level
  const renderIndentGuides = () => {
    return Array.from({ length: level }).map((_, i) => (
      <span key={i} className="indent-guide" style={{ left: `${i * 13}px` }} />
    ));
  };

  // FOLDER
  if (node.type === 'folder') {
    return (
      <>
        <div className="file-label-wrapper">
          <div className="file-indent">
            {renderIndentGuides()}
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
        {renderIndentGuides()}
        <div
          className="file-content"
          style={{ paddingLeft: `${level * 13}px` }}
        >
          {node.name}
        </div>
      </div>
    </div>
  );
}
