
import React from 'react';
import './FileExplorer.css';
import FileNode from './FileNode';

//Icon imports
import { VscMenu } from "react-icons/vsc";
import { VscFiles } from "react-icons/vsc";
import { VscSearch } from "react-icons/vsc";
import { VscExtensions } from "react-icons/vsc";
import { IoLogoGithub } from "react-icons/io";

import { VscAccount } from "react-icons/vsc";
import { VscSettingsGear } from "react-icons/vsc";





export default function FileExplorer({ files, activeFile, onFileSelect }) {
  return (
    <div className="file-explorer">

      <div className='file-explorer-nav-wrapper'>
        
        <div className='file-explorer-nav-top-wrapper'>
          <div className='fe-nav-icon-container'>
            <VscMenu size={23.5}/>
          </div>
          <div className='fe-nav-icon-container'>
            <VscFiles size={26}/>
          </div>
          <div className='fe-nav-icon-container'>
            <VscSearch size={26}/>
          </div>
          <div className='fe-nav-icon-container'>
            <VscExtensions size={26}/>
          </div>
          <div className='fe-nav-icon-container'>
            <IoLogoGithub size={26}/>  
          </div>
        </div>

        <div className='file-explorer-nav-bottom-wrapper'>
          <div className='fe-nav-icon-container'>
            <VscAccount size={26}/>  
          </div>
          <div className='fe-nav-icon-container'>
            <VscSettingsGear size={26}/>
          </div>
        </div>

      </div>

      <div className='file-explorer-content-wrapper'>
        <div className='file-explorer-title-wrapper'>
          <h1 className='file-explorer-title'>EXPLORER</h1>
        </div>
        <div className='file-explorer-content-inner-wrapper'>
          {files.map(file => (
            <FileNode
              key={file.name}
              node={file}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
