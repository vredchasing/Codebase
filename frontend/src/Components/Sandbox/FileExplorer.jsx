
import React from 'react';
import './FileExplorer.css';
import FileNode from './FileNode';

export default function FileExplorer({ files, activeFile, onFileSelect }) {
  return (
    <div className="file-explorer">
      {files.map(file => (
        <FileNode
          key={file.name}
          node={file}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
}
