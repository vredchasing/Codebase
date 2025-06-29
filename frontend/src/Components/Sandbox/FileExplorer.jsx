
import React from 'react';
import './FileExplorer.css';
import FileNode from './FileNode';

//Icon imports
import { VscMenu } from "react-icons/vsc";
import { VscFiles } from "react-icons/vsc";
import { VscSearch } from "react-icons/vsc";
import { VscExtensions } from "react-icons/vsc";
import { IoLogoGithub } from "react-icons/io";




export default function FileExplorer({ files, activeFile, onFileSelect }) {
  return (
    <div className="file-explorer">

      <div className='file-explorer-nav-wrapper'>
        <div className='fe-nav-icon-container'>
          <VscMenu size={23.5}/>
        </div>
        <div className='fe-nav-icon-container'>
          <VscFiles size={25}/>
        </div>
        <div className='fe-nav-icon-container'>
          <VscSearch size={25}/>
        </div>
        <div className='fe-nav-icon-container'>
          <VscExtensions size={25}/>
        </div>
        <div className='fe-nav-icon-container'>
          <IoLogoGithub size={25}/>  
        </div>
      </div>

      <div className='file-explorer-content-wrapper'>
        <div className='file-explorer-title-wrapper'>
          <h1 className='file-explorer-title'>EXPLORER</h1>
        </div>
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
  );
}
