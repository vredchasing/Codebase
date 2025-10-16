
import React from 'react';
import './FileExplorer.css';
import FileNode from '../FileNode';

//Icon imports
import { VscMenu } from "react-icons/vsc";
import { VscFiles } from "react-icons/vsc";
import { VscSearch } from "react-icons/vsc";
import { VscExtensions } from "react-icons/vsc";
import { IoLogoGithub } from "react-icons/io";

import { VscAccount } from "react-icons/vsc";
import { VscSettingsGear } from "react-icons/vsc";


import { SlOptions } from "react-icons/sl";




export default function FileExplorer({ files, activeFile, onFileSelect }) {
  const hasRoot = files && files.length > 0;

  return (
    <div className="file-explorer">
      <div className='file-explorer-content-wrapper'>
        <div className='file-explorer-title-wrapper'>
          <h1 className='file-explorer-title'>Explorer</h1>
          <SlOptions className='explorer-options' />
        </div>

        <div className='project-info-wrapper'>
          <div className='project-info-container'>
          </div>
        </div>

        <div className='file-explorer-content-inner-wrapper'>
          <div className='file-explorer-container'>
            {hasRoot ? (
              files.map(file => (
                <FileNode
                  key={file.name}
                  node={file}
                  activeFile={activeFile}
                  onFileSelect={onFileSelect}
                />
              ))
            ) : (
              <div className='empty-project-message'>
                This project has no files yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
