
import React, { useState } from 'react';
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
import ContextMenu from './ContextMenu';


export default function FileExplorer({ files, activeFile, onFileSelect }) {
  const hasRoot = files && files.length > 0;
  const [menu, setMenu] = useState(false)

  const menuOptions = menu ? [
    { label: 'New File...', labelRight: '',       onClick: () => onFileSelect(menu.file) },
    { label: 'New Folder...', labelRight: '',      onClick: () => console.log('Rename', menu.file) },
    { label: 'Cut', labelRight: 'Ctrl+X',      onClick: () => console.log('Delete', menu.file) },
    { label: 'Copy', labelRight: 'Ctrl+C',    onClick: () => console.log('New File inside', menu.file) },
    { label: 'Paste', labelRight: 'Ctrl+V',      onClick: () => console.log('Delete', menu.file) },
    { label: 'Rename', labelRight: '',      onClick: () => console.log('Delete', menu.file) },
    { label: 'Delete', labelRight: 'Delete',      onClick: () => console.log('Delete', menu.file) },
  ] : [];

  function handleMenu (e, file){

    e.preventDefault();      // <--- this prevents the default browser context menu
    e.stopPropagation();     // optional: stop the event bubbling if needed
    const x = e.clientX;
    const y = e.clientY;
    
    const menuHeight = 400
    const menuWidth = 250

    const { innerWidth: viewportWidth, innerHeight: viewportHeight } = window;

    if(y+menuHeight>viewportHeight){
      y=y-menuHeight
    }
    setMenu({x, y, menuOptions})
  }
  

  
  const closeMenu = () => setMenu(null);

  return (
    <div className="file-explorer">
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          options={menuOptions}
          onClose={closeMenu}
        />
      )}
      <div className='file-explorer-content-wrapper'>
        <div className='file-explorer-header-wrapper'>
          <div className='file-explorer-quick-nav-container'>
            <span className='file-explorer-quick-nav-widget'></span>
            <span className='file-explorer-quick-nav-widget'></span>
            <span className='file-explorer-quick-nav-widget'></span>
            <span className='file-explorer-quick-nav-widget'></span>
            <span className='file-explorer-quick-nav-widget'></span>
          </div>
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
                <div
                  className='file-explorer-inner-container'
                  key={file.name}
                  onContextMenu={(e) => handleMenu(e, file)}
                >
                  <FileNode
                    node={file}
                    activeFile={activeFile}
                    onFileSelect={onFileSelect}
                  />
                </div>
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
