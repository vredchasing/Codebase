import React, { useState, useRef, useEffect } from 'react';
import './FileExplorer.css';
import FileNode from '../FileNode';
import { VscMenu, VscFiles, VscSearch, VscExtensions, VscAccount, VscSettingsGear } from "react-icons/vsc";
import { IoLogoGithub } from "react-icons/io";
import { SlOptions } from "react-icons/sl";
import ContextMenu from './ContextMenu';
import axios from 'axios';

export default function FileExplorer({ files, activeFile, onFileSelect, onFileCreate, projectId }) {
  const [menu, setMenu] = useState(null);
  const [creatingNode, setCreatingNode] = useState(null);  // { parentId | null, nodeType }
  const inputRef = useRef(null);

  async function createFileOrFolderAPI(name, parentId, projectId, nodeType) {
    if (!name?.trim()) {
      return null;
    }
    try {
      const payload = { name: name.trim(), parentId, nodeType };
      const response = await axios.post(
        `http://localhost:3000/api/projects/${projectId}/files`,
        payload,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating file or folder:', error);
      return null;
    }
  }

  const handleStartCreate = (parentId, nodeType) => {
    setCreatingNode({ parentId, nodeType });
  };

  const handleCancelCreate = () => {
    setCreatingNode(null);
  };

  const handleConfirmCreate = async (name) => {
    const trimmed = name?.trim();
    if (!trimmed) {
      handleCancelCreate();
      return;
    }
    const newNode = await createFileOrFolderAPI(trimmed, creatingNode.parentId, projectId, creatingNode.nodeType);
    if (newNode) {
      onFileCreate(newNode);
    }
    handleCancelCreate();
  };

  useEffect(() => {
    if (creatingNode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creatingNode]);

  const menuOptions = menu ? [
    { label: 'New File...',   onClick: () => { handleStartCreate(menu.file.id, 'file'); closeMenu(); } },
    { label: 'New Folder...', onClick: () => { handleStartCreate(menu.file.id, 'folder'); closeMenu(); } },
    { label: 'Cut',           onClick: () => console.log('Cut', menu.file) },
    { label: 'Copy',          onClick: () => console.log('Copy', menu.file) },
    { label: 'Paste',         onClick: () => console.log('Paste', menu.file) },
    { label: 'Rename',        onClick: () => console.log('Rename', menu.file) },
    { label: 'Delete',        onClick: () => console.log('Delete', menu.file) },
  ] : [];

  const handleMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    setMenu({ x, y, file });
  };

  const closeMenu = () => {
    setMenu(null);
  };

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
          <div className='project-info-container'></div>
        </div>

        <div className='file-explorer-content-inner-wrapper'>
          <div className='file-explorer-container'>
            {files && files.map(node => (
              <div
                key={node.id}
                className='file-explorer-inner-container'
                onContextMenu={e => handleMenu(e, node)}
              >
                <FileNode
                  node={node}
                  activeFile={activeFile}
                  onFileSelect={onFileSelect}
                  onStartCreate={handleStartCreate}
                  creatingNode={creatingNode}
                  inputRef={inputRef}
                  onConfirmCreate={handleConfirmCreate}
                  onCancelCreate={handleCancelCreate}
                  level={0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
