import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './FileExplorer.css';
import FileNode from '../FileNode';
import { SlOptions } from "react-icons/sl";
import ContextMenu from './ContextMenu';
import axios from 'axios';

export default function FileExplorer({ files, activeFile, onFileSelect, onFileCreate, projectId, filesMap, setFilesMap, uiState,setUIState, updateLocalStorageUIState }) {
  const [menu, setMenu] = useState(null);
  const [creatingNode, setCreatingNode] = useState(null);  // { parentId | null, nodeType }
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const nodeHeightsRef = useRef(new Map()); // Store measured heights by node ID
  const nodeTopsRef = useRef(new Map()); // Store measured top positions by node ID (relative to container)
  const nodeRefsRef = useRef(new Map()); // Store refs to DOM elements by node ID
  const [nodeHeightsVersion, setNodeHeightsVersion] = useState(0); // Trigger recalculation when heights change

  async function createFileOrFolderAPI(name, parentId, projectId, nodeType) {
    if (!name?.trim()) return null;
    try {
      const payload = { name: name.trim(), parentId, nodeType, projectId };
      const response = await axios.post(
        `http://localhost:3000/api/projects/files/file-folder-creation`,
        payload,
        { withCredentials: true }
      );
      console.log('Created file/folder response:', response.data);  
      return response.data;
    } catch (error) {
      console.error('Error creating file or folder:', error);
      return null;
    }
  }

  const handleStartCreate = (parentId, nodeType) => {
    setCreatingNode({ parentId, nodeType });
  };

  const handleCancelCreate = () => setCreatingNode(null);

  const handleConfirmCreate = async (name) => {
    const trimmed = name?.trim();
    if (!trimmed) {
      handleCancelCreate();
      return;
    }
    const newNode = await createFileOrFolderAPI(trimmed, creatingNode.parentId, projectId, creatingNode.nodeType);
    if (newNode) onFileCreate(newNode);
    handleCancelCreate();
  };

  useEffect(() => {
    if (creatingNode && inputRef.current) inputRef.current.focus();
  }, [creatingNode]);

  const handleMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, file });
  };

  const closeMenu = () => setMenu(null);

  // Flatten visible tree (only expanded folders show children)
  const flattenVisibleTree = useCallback((nodes, expandedFolders, result = [], parentId = null, level = 0) => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isLastChild = i === nodes.length - 1;
      const isExpanded = expandedFolders.includes(node.id);
      
      result.push({
        id: node.id,
        name: node.name,
        node_type: node.node_type,
        parent_id: parentId,
        depth: level,
        isLastChild,
        index: result.length // Position in flattened array
      });

      // If folder is expanded, include its children
      if (isExpanded && node.children && node.children.length > 0) {
        flattenVisibleTree(node.children, expandedFolders, result, node.id, level + 1);
      }
    }
    return result;
  }, []);

  // Calculate line segments for continuous vertical lines (VS Code style)
  const calculateLineSegments = useCallback((visibleNodes) => {
    const segmentsByLevel = {}; // Track segments by level and ancestor to merge

    // Helper: Check if node2 is a descendant of node1
    const isDescendant = (node1, node2, allNodes) => {
      if (!node1 || !node2) return false;
      let current = node2;
      while (current && current.parent_id) {
        if (current.parent_id === node1.id) return true;
        current = allNodes.find(n => n.id === current.parent_id);
        if (!current) break;
      }
      return false;
    };

    // Group nodes by their direct parent
    const siblingGroups = {};
    visibleNodes.forEach((node, index) => {
      const parentKey = node.parent_id || 'root';
      if (!siblingGroups[parentKey]) {
        siblingGroups[parentKey] = [];
      }
      siblingGroups[parentKey].push({ node, visibleIndex: index });
    });

    // For each sibling group, find the full range including nested descendants
    Object.entries(siblingGroups).forEach(([parentKey, siblings]) => {
      if (siblings.length === 0) return;
      
      const firstSibling = siblings[0];
      const lastSibling = siblings[siblings.length - 1];
      
      // Skip root level
      if (firstSibling.node.depth === 0) return;

      // Find the actual last visible descendant (could be nested deeper)
      let actualLastIndex = lastSibling.visibleIndex;
      let actualLastIsLastChild = lastSibling.node.isLastChild;
      
      // Look ahead to find all nested descendants
      const parentNode = visibleNodes.find(n => n.id === parentKey);
      if (parentNode) {
        for (let i = lastSibling.visibleIndex + 1; i < visibleNodes.length; i++) {
          const nextNode = visibleNodes[i];
          // If nextNode is still a descendant of this parent, extend the range
          if (isDescendant(parentNode, nextNode, visibleNodes)) {
            actualLastIndex = i;
            actualLastIsLastChild = nextNode.isLastChild;
          } else {
            // We've moved to a different branch, stop
            break;
          }
        }
      }

      // Helper: Find ancestor at a specific level
      const getAncestorAtLevel = (node, targetLevel) => {
        if (node.depth <= targetLevel) return null;
        let current = node;
        while (current && current.depth > targetLevel) {
          const ancestor = visibleNodes.find(n => n.id === current.parent_id);
          if (!ancestor) return null;
          if (ancestor.depth === targetLevel) return ancestor;
          current = ancestor;
        }
        return null;
      };

      // For each ancestor level, draw a continuous line
      for (let level = 1; level < firstSibling.node.depth; level++) {
        const left = level * 18;
        
        // Get actual top position of first sibling (accounts for borders automatically)
        const firstSiblingTop = nodeTopsRef.current.get(firstSibling.node.id);
        if (firstSiblingTop === undefined) continue; // Skip if not measured yet
        
        // Line starts at the TOP of the first node (VS Code style)
        const top = firstSiblingTop;
        
        // Find the ancestor at this level
        const ancestorAtLevel = getAncestorAtLevel(firstSibling.node, level - 1);
        if (!ancestorAtLevel) continue;
        
        // Find the last visible descendant of this ancestor
        let levelLastIndex = actualLastIndex;
        let levelLastIsLastChild = actualLastIsLastChild;
        
        // If this is not the direct parent level, we need to find descendants of the ancestor
        if (level < firstSibling.node.depth - 1) {
          for (let i = actualLastIndex + 1; i < visibleNodes.length; i++) {
            const nextNode = visibleNodes[i];
            if (isDescendant(ancestorAtLevel, nextNode, visibleNodes)) {
              levelLastIndex = i;
              levelLastIsLastChild = nextNode.isLastChild;
            } else {
              break;
            }
          }
        }
        
        // Get actual top position and height of last node (accounts for borders automatically)
        const lastNodeId = visibleNodes[levelLastIndex].id;
        const lastNodeTop = nodeTopsRef.current.get(lastNodeId);
        const lastNodeHeight = nodeHeightsRef.current.get(lastNodeId);
        
        if (lastNodeTop === undefined || lastNodeHeight === undefined) continue; // Skip if not measured yet
        
        // Line ends at the BOTTOM of the last node (VS Code style)
        const lineEnd = lastNodeTop + lastNodeHeight;
        
        const height = lineEnd - top;
        const segmentKey = `${level}-${ancestorAtLevel.id}`;
        
        if (height > 0) {
          if (!segmentsByLevel[segmentKey]) {
            segmentsByLevel[segmentKey] = {
              left,
              top,
              height,
              level,
              bottom: lineEnd
            };
          } else {
            // Extend existing segment
            const existing = segmentsByLevel[segmentKey];
            if (lineEnd > existing.bottom) {
              existing.height = lineEnd - existing.top;
              existing.bottom = lineEnd;
            }
            if (top < existing.top) {
              const oldBottom = existing.bottom;
              existing.top = top;
              existing.height = oldBottom - top;
            }
          }
        }
      }
    });

    return Object.values(segmentsByLevel);
  }, []);

  // Get visible nodes and line segments
  const expandedFolders = uiState.expandedFolders || [];
  const visibleNodes = useMemo(() => {
    return flattenVisibleTree(files, expandedFolders);
  }, [files, expandedFolders, flattenVisibleTree]);

  const lineSegments = useMemo(() => {
    return calculateLineSegments(visibleNodes);
  }, [visibleNodes, calculateLineSegments, nodeHeightsVersion]);

  // Measure node heights and positions after render
  useEffect(() => {
    const measureHeights = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      let hasChanges = false;
      
      nodeRefsRef.current.forEach((element, nodeId) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          // Get position relative to container
          const top = rect.top - containerRect.top;
          const height = rect.height;
          
          const oldHeight = nodeHeightsRef.current.get(nodeId);
          const oldTop = nodeTopsRef.current.get(nodeId);
          
          if (oldHeight !== height || oldTop !== top) {
            nodeHeightsRef.current.set(nodeId, height);
            nodeTopsRef.current.set(nodeId, top);
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        setNodeHeightsVersion(prev => prev + 1);
      }
    };

    // Measure after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(measureHeights, 0);
    return () => clearTimeout(timeoutId);
  }, [visibleNodes]);

  // Callback to register node ref for height measurement
  const registerNodeRef = useCallback((nodeId, element) => {
    if (element) {
      nodeRefsRef.current.set(nodeId, element);
    } else {
      nodeRefsRef.current.delete(nodeId);
      nodeHeightsRef.current.delete(nodeId);
      nodeTopsRef.current.delete(nodeId);
    }
  }, []);

  const menuOptions = menu ? [
    { label: 'New File...',   onClick: () => { handleStartCreate(menu.file.id, 'file'); closeMenu(); } },
    { label: 'New Folder...', onClick: () => { handleStartCreate(menu.file.id, 'folder'); closeMenu(); } },
    { label: 'Cut',           onClick: () => console.log('Cut', menu.file) },
    { label: 'Copy',          onClick: () => console.log('Copy', menu.file) },
    { label: 'Paste',         onClick: () => console.log('Paste', menu.file) },
    { label: 'Rename',        onClick: () => console.log('Rename', menu.file) },
    { label: 'Delete',        onClick: () => console.log('Delete', menu.file) },
  ] : [];

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
          <div className='file-explorer-container' ref={containerRef}>
            {/* Render continuous vertical lines */}
            <div className="tree-lines-layer">
              {lineSegments.map((segment, idx) => (
                <div
                  key={`${segment.parentKey}-${segment.level}-${idx}`}
                  className="tree-line-segment"
                  style={{
                    position: 'absolute',
                    left: `${segment.left}px`,
                    top: `${segment.top}px`,
                    height: `${segment.height}px`,
                    width: '1px',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.19)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                />
              ))}
            </div>
            
            {/* Render file nodes */}
            <div className="file-nodes-layer">
              {files && files.map((node, index) => {
                const isLastChild = index === files.length - 1;
                return (
                  <div key={node.id} className='file-explorer-inner-container'>
                    <FileNode
                      node={node}
                      activeFile={activeFile}
                      onFileSelect={onFileSelect}
                      onStartCreate={handleStartCreate}
                      creatingNode={creatingNode}
                      inputRef={inputRef}
                      onConfirmCreate={handleConfirmCreate}
                      onCancelCreate={handleCancelCreate}
                      onContextMenu={handleMenu}
                      filesMap={filesMap}
                      setFilesMap={setFilesMap}
                      uiState={uiState}
                      setUIState={setUIState}
                      updateLocalStorageUIState={updateLocalStorageUIState}
                      isLastChild={isLastChild}
                      registerNodeRef={registerNodeRef}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
