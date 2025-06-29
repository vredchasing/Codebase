import React, { useState } from 'react';
import './FileExplorer.css';

import { MdArrowBackIos } from 'react-icons/md';


export default function FileNode({ node, activeFile, onFileSelect, level = 0 }) {
  const [expanded, setExpanded] = useState(true);

  const paddingLeft = '13px';

  if (node.type === 'folder') {
    return (
      <div className="folder">
        <div
          className="folder-label"
          onClick={() => setExpanded(!expanded)}
        >
          <MdArrowBackIos
            size={13}
            style={{
              transform: expanded ? 'rotate(270deg)' : 'rotate(180deg)',
            }}
          />{node.name}
        </div>
        {expanded && (
          <div
            className="folder-contents"
            style={{ paddingLeft }} // indent applied here
          >
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
      </div>
    );
  }

  return (
    <div
      className={`file-label ${node.name === activeFile.name ? 'active' : ''}`}
      onClick={() => onFileSelect(node)}
    >
    {node.name}
    </div>
  );
}
