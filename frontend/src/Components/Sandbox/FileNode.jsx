import React, { useState, useCallback } from 'react';
import './FileExplorer/FileExplorer.css';
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import getIcon, { getInputIcon } from './ExplorerIcons/iconHelperFuncs';
import { extensionIconMap } from './ExplorerIcons/Icons';
import { useSelector, useDispatch } from 'react-redux';
import { setExpandedFolders } from '../../stores/reduxTK/slices/UI/uiSlice';

export default function FileNode({ node, activeFile, onFileSelect, onStartCreate, creatingNode, inputRef, onConfirmCreate, onCancelCreate, onContextMenu, filesMap, setFilesMap, level = 0, isLastChild = false, registerNodeRef }) {
  const dispatch = useDispatch();
  const expandedFolders = useSelector(state => state.workspaceUI.workspace.expandedFolders) || [];

  const [inputValue, setInputValue] = useState('');
  const [inputIcon, setInputIcon] = useState(extensionIconMap.default);

  const depth = filesMap[node.id]?.depth ?? 0;
  const nodeIsLastChild = filesMap[node.id]?.isLastChild ?? isLastChild;

  const isExpanded = expandedFolders.includes(node.id);
  const arrowStatus = () => isExpanded ? <MdKeyboardArrowDown size={18} /> : <MdKeyboardArrowRight size={18} />;

  const handleFolderClick = useCallback((e) => {
    e.stopPropagation();
    const newExpanded = isExpanded
      ? expandedFolders.filter(id => id !== node.id)
      : [...expandedFolders, node.id];
    dispatch(setExpandedFolders(newExpanded));
  }, [dispatch, expandedFolders, node.id, isExpanded]);

  const handleInputIcon = e => {
    const value = e.target.value;
    setInputValue(value);
    setInputIcon(getInputIcon(value));
  };

  if (node.node_type === 'folder') {
    return (
      <>
        <div ref={el => registerNodeRef && registerNodeRef(node.id, el)} className="file-label-container" onContextMenu={e => onContextMenu?.(e, node)}>
          <div className="file-indent">
            <div className="file-content" onClick={handleFolderClick} style={{ paddingLeft: `${depth * 13}px`, cursor: 'pointer' }}>
              {arrowStatus()}
              {node.name}
            </div>
          </div>
        </div>

        {isExpanded && node.children?.map((child, index) => (
          <FileNode
            key={child.id}
            node={child}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            onStartCreate={onStartCreate}
            creatingNode={creatingNode}
            inputRef={inputRef}
            onConfirmCreate={onConfirmCreate}
            onCancelCreate={onCancelCreate}
            onContextMenu={onContextMenu}
            filesMap={filesMap}
            setFilesMap={setFilesMap}
            isLastChild={index === node.children.length - 1}
            registerNodeRef={registerNodeRef}
          />
        ))}

        {creatingNode && creatingNode.parentId === node.id && (
          <div className="new-node-input-container" style={{ paddingLeft: `${(depth + 1) * 13}px`, width: `calc(100% - ${(depth + 1) * 13}px)` }}>
            <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {inputIcon && <div className="input-icon-container"><img src={inputIcon} alt="file icon" className="icon-img" /></div>}
              <input
                ref={inputRef}
                className="file-explorer-new-input"
                value={inputValue}
                onChange={handleInputIcon}
                placeholder=""
                onBlur={e => { onConfirmCreate(e.target.value); setInputValue(''); setInputIcon(extensionIconMap.default); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); onConfirmCreate(e.target.value); setInputValue(''); setInputIcon(extensionIconMap.default); }
                  if (e.key === 'Escape') { onCancelCreate(); setInputValue(''); setInputIcon(extensionIconMap.default); }
                }}
                style={{ flex: 1, boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div ref={el => registerNodeRef && registerNodeRef(node.id, el)} className={`file-label-container ${activeFile?.name === node.name ? 'active' : ''}`} onClick={() => onFileSelect(node)} onContextMenu={e => onContextMenu?.(e, node)}>
      <div className="file-indent">
        <div className="file-content" style={{ paddingLeft: `${depth * 13}px` }}>
          <div className="icon-container"><img className="icon-img" src={getIcon(node)} alt={node.name} /></div>
          {node.name}
        </div>
      </div>
    </div>
  );
}
