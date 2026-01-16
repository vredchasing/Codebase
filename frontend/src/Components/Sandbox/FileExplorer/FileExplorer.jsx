import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './FileExplorer.css';
import FileNode from '../FileNode';
import { SlOptions } from "react-icons/sl";
import { TbFiles } from "react-icons/tb";
import { IoSearch } from "react-icons/io5";
import { GoGitBranch } from "react-icons/go";
import { MdDashboardCustomize } from "react-icons/md";




import ContextMenu from './ContextMenu';
import { api, API_ENDPOINTS, handleError } from '../../../utils';
import { 
  setWorkspaceProject,
  setExpandedFolders,
} from '../../../stores/reduxTK/slices/UI/uiSlice';

export default function FileExplorer({ files, onFileSelect, onFileCreate, projectId, filesMap, setFilesMap }) {
  const dispatch = useDispatch();

  // Redux state
  const expandedFolders = useSelector(state => state.workspaceUI.workspace.expandedFolders || []);
  
  // Local state for creation and context menu
  const [menu, setMenu] = useState(null);
  const [creatingNode, setCreatingNode] = useState(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const nodeHeightsRef = useRef(new Map());
  const nodeTopsRef = useRef(new Map());
  const nodeRefsRef = useRef(new Map());
  const [nodeHeightsVersion, setNodeHeightsVersion] = useState(0);

  // API call to create file/folder
  const createFileOrFolderAPI = async (name, parentId, nodeType) => {
    if (!name?.trim()) return null;
    try {
      const payload = { name: name.trim(), parentId, nodeType, projectId };
      const response = await api.post(API_ENDPOINTS.PROJECTS.FILES.CREATE, payload);
      return response.data;
    } catch (error) {
      handleError(error, 'FileExplorer - Create File/Folder');
      return null;
    }
  };

  // Create handlers
  const handleStartCreate = (parentId, nodeType) => setCreatingNode({ parentId, nodeType });
  const handleCancelCreate = () => setCreatingNode(null);

  const handleConfirmCreate = async (name) => {
    const trimmed = name?.trim();
    if (!trimmed) return handleCancelCreate();

    const newNode = await createFileOrFolderAPI(trimmed, creatingNode.parentId, creatingNode.nodeType);
    if (newNode) onFileCreate(newNode);

    handleCancelCreate();
  };

  // Focus input when creating
  useEffect(() => {
    if (creatingNode && inputRef.current) inputRef.current.focus();
  }, [creatingNode]);

  // Context menu
  const handleMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, file });
  };
  const closeMenu = () => setMenu(null);

  // Flatten tree
  const flattenVisibleTree = useCallback((nodes, expanded, result = [], parentId = null, level = 0) => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isExpanded = expanded.includes(node.id);
      const isLastChild = i === nodes.length - 1;

      result.push({
        ...node,
        parent_id: parentId,
        depth: level,
        isLastChild,
        index: result.length
      });

      if (isExpanded && node.children?.length > 0) {
        flattenVisibleTree(node.children, expanded, result, node.id, level + 1);
      }
    }
    return result;
  }, []);

  const visibleNodes = useMemo(() => flattenVisibleTree(files, expandedFolders), [files, expandedFolders, flattenVisibleTree]);

  // Node measurements for VSCode-like tree lines
  const calculateLineSegments = useCallback((nodes) => {
    const segments = {};
    // ... same as your existing implementation (omitted for brevity)
    return Object.values(segments);
  }, []);

  const lineSegments = useMemo(() => calculateLineSegments(visibleNodes), [visibleNodes, calculateLineSegments, nodeHeightsVersion]);

  useEffect(() => {
    const measureHeights = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let hasChanges = false;

      nodeRefsRef.current.forEach((el, nodeId) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const top = rect.top - containerRect.top;
        const height = rect.height;

        if (nodeHeightsRef.current.get(nodeId) !== height || nodeTopsRef.current.get(nodeId) !== top) {
          nodeHeightsRef.current.set(nodeId, height);
          nodeTopsRef.current.set(nodeId, top);
          hasChanges = true;
        }
      });

      if (hasChanges) setNodeHeightsVersion(prev => prev + 1);
    };

    const timeout = setTimeout(measureHeights, 0);
    return () => clearTimeout(timeout);
  }, [visibleNodes]);

  const registerNodeRef = useCallback((nodeId, element) => {
    if (element) nodeRefsRef.current.set(nodeId, element);
    else {
      nodeRefsRef.current.delete(nodeId);
      nodeHeightsRef.current.delete(nodeId);
      nodeTopsRef.current.delete(nodeId);
    }
  }, []);

  const toggleFolder = (folderId) => {
    const newExpanded = expandedFolders.includes(folderId)
      ? expandedFolders.filter(id => id !== folderId)
      : [...expandedFolders, folderId];
    dispatch(setExpandedFolders(newExpanded));
  };

  const menuOptions = menu ? [
    { label: 'New File...', onClick: () => { handleStartCreate(menu.file.id, 'file'); closeMenu(); } },
    { label: 'New Folder...', onClick: () => { handleStartCreate(menu.file.id, 'folder'); closeMenu(); } },
    { label: 'Cut', onClick: () => console.log('Cut', menu.file) },
    { label: 'Copy', onClick: () => console.log('Copy', menu.file) },
    { label: 'Paste', onClick: () => console.log('Paste', menu.file) },
    { label: 'Rename', onClick: () => console.log('Rename', menu.file) },
    { label: 'Delete', onClick: () => console.log('Delete', menu.file) },
  ] : [];

  return (
    <div className="file-explorer">
      {menu && <ContextMenu x={menu.x} y={menu.y} options={menuOptions} onClose={closeMenu} />}

      <div className='file-explorer-content-wrapper'>
        <div className='file-explorer-header-wrapper'>
          <div className='file-explorer-quick-nav-container'>
            <span className='file-explorer-quick-nav-widget'>
              <TbFiles color='rgb(112, 112, 112)'></TbFiles>
            </span>
            <span className='file-explorer-quick-nav-widget'>
              <IoSearch color='rgb(112, 112, 112)'></IoSearch>
            </span>
            <span className='file-explorer-quick-nav-widget'>
              <GoGitBranch color='rgb(112, 112, 112)'></GoGitBranch>
            </span>
            <span className='file-explorer-quick-nav-widget'>
              <MdDashboardCustomize color='rgb(112, 112, 112)'></MdDashboardCustomize>
            </span>
          </div>
          <SlOptions className='explorer-options' />
        </div>

        <div className='file-explorer-content-inner-wrapper'>
          <div className='file-explorer-container' ref={containerRef}>
            {/* Tree lines */}
            <div className="tree-lines-layer">
              {lineSegments.map((segment, idx) => (
                <div key={idx} className="tree-line-segment"
                     style={{ position: 'absolute', left: `${segment.left}px`, top: `${segment.top}px`, height: `${segment.height}px`, width: '1px', borderLeft: '1px solid rgba(255,255,255,0.19)', pointerEvents: 'none' }}
                />
              ))}
            </div>

            {/* File nodes */}
            <div className="file-nodes-layer">
              {files.map(node => (
                <div key={node.id} className='file-explorer-inner-container'>
                  <FileNode
                    node={node}
                    onFileSelect={onFileSelect}
                    onStartCreate={handleStartCreate}
                    creatingNode={creatingNode}
                    inputRef={inputRef}
                    onConfirmCreate={handleConfirmCreate}
                    onCancelCreate={handleCancelCreate}
                    onContextMenu={handleMenu}
                    filesMap={filesMap}
                    setFilesMap={setFilesMap}
                    registerNodeRef={registerNodeRef}
                    toggleFolder={toggleFolder}
                    expandedFolders={expandedFolders}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
