import React, { useState } from 'react';
import './FileExplorer.css';

export default function FileNode({ node, activeFile, onFileSelect, level = 0 }) {
  const [expanded, setExpanded] = useState(true);

  const paddingLeft = level * 16; // you can adjust this spacing

  if (node.type === 'folder') {
    return (
      <div className="folder">
        <div
          className="folder-label tree-line"
          style={{ paddingLeft }}
          onClick={() => setExpanded(!expanded)}
        >
          📁 {node.name}
        </div>
        {expanded && (
          <div className="folder-contents">
            {node.children.map(child => (
              <FileNode
                key={child.name}
                node={child}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                level={level + 1} // pass the updated depth level
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`file-item tree-line ${node.name === activeFile.name ? 'active' : ''}`}
      style={{ paddingLeft }}
      onClick={() => onFileSelect(node)}
    >
      📝 {node.name}
    </div>
  );
}
