import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api, API_ENDPOINTS, handleError } from '../../../utils';
import Editor from '@monaco-editor/react';
import './Sandbox.css';
import FileExplorer from '../FileExplorer/FileExplorer';
import EditorTabs from '../EditorTabs/EditorTabs';
import KiraWorkspace from '../../Kira/KiraWorkspace/KiraWorkspace';
import CodeEditor from '../CodeEditor/CodeEditor';
import { useParams } from 'react-router-dom';
import getLangFromExt from '../CodeEditor/getExtHelper';
import { MdKeyboardArrowRight } from "react-icons/md";
import getIcon from '../ExplorerIcons/iconHelperFuncs';
import { CodeEditorStatusBar } from '../CodeEditor/CodeEditorStatusBar';
import { useWebSocket } from '../../../hooks/useWebSocket';

export default function Sandbox() {
  const { projectId } = useParams();
  
  // Initialize WebSocket connection
  useWebSocket(projectId);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filesMap, setFilesMap] = useState({});
  const [mainTree, setMainTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState([]);

  // --- Helper function to find a file in tree by name ---
  // Memoized to avoid recreation on every render
  const findFileInTree = useCallback((tree, fileName) => {
    for (const node of tree) {
      if (node.name === fileName && node.node_type === 'file') {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findFileInTree(node.children, fileName);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Helper to strip content from file objects for localStorage (only store metadata)
  const stripContentFromTabs = useCallback((tabs) => {
    return tabs.map(tab => {
      const { content, ...tabWithoutContent } = tab;
      return tabWithoutContent;
    });
  }, []);

  // Helper to restore tabs with content from files/mainTree state
  const restoreTabsWithContent = useCallback((tabsMetadata) => {
    return tabsMetadata.map(tabMeta => {
      // Try to find file with content from files state
      const fileWithContent = findFileInTree(files, tabMeta.name);
      if (fileWithContent && fileWithContent.content !== undefined) {
        return fileWithContent;
      }
      // Fallback to mainTree
      const fileFromMainTree = findFileInTree(mainTree, tabMeta.name);
      if (fileFromMainTree && fileFromMainTree.content !== undefined) {
        return fileFromMainTree;
      }
      // Return metadata only if content not found (will be empty)
      return { ...tabMeta, content: '' };
    });
  }, [files, mainTree, findFileInTree]);

  // --- Build Tree from Backend ---
  async function buildContentTree(data) {
    try {
      const response = await api.post(API_ENDPOINTS.PROJECTS.GET_FILE_TREE_CONTENT, { data });
      
      if (response.data) {
        const treeDataWithContent = response.data;
        setMainTree(treeDataWithContent);
        
        // Update files state with content
        const updateFilesWithContent = (nodes) => {
          return nodes.map(node => {
            const nodeWithContent = findFileInTree(treeDataWithContent, node.name);
            if (node.node_type === 'file' && nodeWithContent) {
              return { ...node, content: nodeWithContent.content };
            }
            if (node.children && node.children.length > 0) {
              return { ...node, children: updateFilesWithContent(node.children) };
            }
            return node;
          });
        };
        
        setFiles(prevFiles => updateFilesWithContent(prevFiles));
      }
    } catch (error) {
      handleError(error, 'Sandbox - Build Content Tree');
      setError('Failed to load file tree. Please refresh the page.');
    }
  }

  function flattenFiles(nodes, parentId = null, level = 0, result = {}) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isLastChild = i === nodes.length - 1;
      result[node.id] = { 
        ...node, 
        parent_id: parentId, 
        depth: level,
        isLastChild 
      };
      if (node.children?.length) {
        flattenFiles(node.children, node.id, level + 1, result);
      }
    }
    return result;
  }

  // --- Default UI State ---
  const defaultUIState = {
    projectId,
    scrollPositions: {},
    openedTabs: [],
    activeTab: null,
    lastUpdated: null,
  };

  const [uiState, setUIState] = useState(defaultUIState);

  // --- Local Storage Helpers ---
  function getLocalStorageUIState() {
    const key = `workspaceUIState_${projectId}`;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  const updateLocalStorageUIState = useCallback((updates) => {
    const key = `workspaceUIState_${projectId}`;
    setUIState(prevState => {
      const newState = {
        ...prevState,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(newState));
      return newState;
    });
  }, [projectId]);

  useEffect(() => {
    async function initUIState() {
      if (!projectId) return;
      const local = getLocalStorageUIState();
      if (local) {
        console.log('Loaded UI state from localStorage:', local);
        setUIState(local);
        return;
      }

      // 2️⃣ Otherwise fetch from DB
      try {
        const response = await api.get(API_ENDPOINTS.PROJECTS.GET_WORKSPACE_UI_STATE(projectId));
        const dbState = response.data?.ui_state || defaultUIState;
        const key = `workspaceUIState_${projectId}`;
        localStorage.setItem(key, JSON.stringify(dbState));
        setUIState(dbState);
      } catch (error) {
        handleError(error, 'Sandbox - Fetch UI State');
        setUIState(defaultUIState);
      }
    }

    initUIState();
  }, [projectId]);

  // --- Fetch files from the database ---
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await api.get(API_ENDPOINTS.PROJECTS.GET_PROJECT(projectId));
        const data = response.data || [];
        setFiles(data);

        const flattened = flattenFiles(data);
        setFilesMap(flattened);

        // Build content tree
        buildContentTree(data);

        // Note: Tab restoration with content happens in the useEffect hook
        // after files and mainTree are loaded (see useEffect at line 203)
        // This ensures content is fetched from backend/R2, not stale localStorage
      } catch (err) {
        handleError(err, 'Sandbox - Fetch Files');
        setError('Failed to load project files. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
  }, [projectId]);

  // Use ref to track if we're processing to prevent infinite loops
  const isProcessingRef = useRef(false);
  const lastProcessedTabsRef = useRef(null);
  const lastProcessedActiveTabRef = useRef(null);

  // --- Sync tabs when uiState.openedTabs changes (from localStorage/DB) ---
  useEffect(() => {
    if (files.length === 0) return; // Wait for files to load
    if (isProcessingRef.current) return; // Prevent concurrent processing
    
    // Create a stable reference to check if we've already processed this state
    const currentTabsKey = JSON.stringify(uiState.openedTabs?.map(t => t?.name) || []);
    const currentActiveTab = uiState.activeTab;
    
    // Skip if we've already processed this exact state
    if (lastProcessedTabsRef.current === currentTabsKey && 
        lastProcessedActiveTabRef.current === currentActiveTab) {
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      // If tabs are empty, clear activeFile
      if (!uiState.openedTabs || uiState.openedTabs.length === 0) {
        // Only update if state is different to avoid infinite loop
        if (tabs.length > 0 || activeFile !== null || activeTab !== null) {
          setTabs([]);
          setActiveFile(null);
          setActiveTab(null);
        }
        lastProcessedTabsRef.current = currentTabsKey;
        lastProcessedActiveTabRef.current = currentActiveTab;
        return;
      }
      
      // Filter out any folders that might have been added incorrectly
      const tabsMetadata = uiState.openedTabs.filter(tab => tab && tab.node_type === 'file');
      
      // Restore tabs with content from files/mainTree (localStorage only has metadata)
      const validTabs = restoreTabsWithContent(tabsMetadata);
      
      // If folders were filtered out, update the state (but only once per unique state)
      if (tabsMetadata.length !== uiState.openedTabs.length) {
        updateLocalStorageUIState({ openedTabs: tabsMetadata });
        lastProcessedTabsRef.current = JSON.stringify(tabsMetadata.map(t => t?.name));
        lastProcessedActiveTabRef.current = currentActiveTab;
        return; // Return early - the update will trigger this effect again with new state
      }
      
      // If no valid tabs remain after filtering, clear everything
      if (validTabs.length === 0) {
        if (tabs.length > 0 || activeFile !== null || activeTab !== null) {
          setTabs([]);
          setActiveFile(null);
          setActiveTab(null);
          updateLocalStorageUIState({ openedTabs: [], activeTab: null });
        }
        lastProcessedTabsRef.current = currentTabsKey;
        lastProcessedActiveTabRef.current = null;
        return;
      }
      
      // Only update if tabs actually changed
      const tabsChanged = JSON.stringify(tabs.map(t => t.name)) !== JSON.stringify(validTabs.map(t => t.name));
      if (tabsChanged) {
        setTabs(validTabs);
      }
      
      // Set active file if we have an active tab
      if (uiState.activeTab) {
        const activeFileObj = validTabs.find(t => t.name === uiState.activeTab);
        if (activeFileObj) {
          if (activeFile?.name !== activeFileObj.name) {
            setActiveFile(activeFileObj);
            setActiveTab(uiState.activeTab);
          }
        } else if (validTabs.length > 0) {
          // If active tab was a folder, set the last valid tab as active
          const lastTab = validTabs[validTabs.length - 1];
          if (activeFile?.name !== lastTab.name) {
            setActiveFile(lastTab);
            setActiveTab(lastTab.name);
            updateLocalStorageUIState({ activeTab: lastTab.name });
          }
        } else {
          // No valid tabs, clear everything
          if (activeFile !== null || activeTab !== null) {
            setActiveFile(null);
            setActiveTab(null);
          }
        }
      } else if (activeFile !== null || activeTab !== null) {
        // No active tab in uiState, but we have one locally - clear it
        setActiveFile(null);
        setActiveTab(null);
      }
      
      // Mark this state as processed
      lastProcessedTabsRef.current = currentTabsKey;
      lastProcessedActiveTabRef.current = currentActiveTab;
    } finally {
      isProcessingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState.openedTabs, uiState.activeTab, files.length]);

  // --- File selection ---
  // Memoized to prevent recreation on every render
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    setActiveFile(file);
    setActiveTab(file.name);

    const currentOpenedTabs = uiState.openedTabs || [];
    const exists = currentOpenedTabs.find((t) => t.name === file.name);
    if (!exists) {
      const updatedTabs = [...currentOpenedTabs, file];
      setTabs(updatedTabs);
      // Store only metadata in localStorage (no content)
      updateLocalStorageUIState({ 
        openedTabs: stripContentFromTabs(updatedTabs), 
        activeTab: file.name 
      });
    } else {
      updateLocalStorageUIState({ activeTab: file.name });
    }
  }, [uiState.openedTabs, updateLocalStorageUIState, stripContentFromTabs]);

  // --- Update file content ---
  // Memoized to prevent recreation on every render
  // Note: setFiles, setMainTree, setTabs, setUIState are stable from useState, so safe to omit from deps
  const updateFileContent = useCallback((fileId, newContent) => {
    // Helper to update a file in a tree structure
    const updateFileInTree = (nodes) => {
      return nodes.map((node) => {
        if (node.node_type === 'file' && node.id === fileId) {
          return { ...node, content: newContent };
        }
        if (node.node_type === 'folder' && node.children) {
          return {
            ...node,
            children: updateFileInTree(node.children),
          };
        }
        return node;
      });
    };

    // Update files state
    setFiles((prevFiles) => updateFileInTree(prevFiles));

    // Update mainTree state
    setMainTree((prevTree) => updateFileInTree(prevTree));

    // Update tabs if the file is open in a tab
    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) =>
        tab.id === fileId ? { ...tab, content: newContent } : tab
      );
      return updatedTabs;
    });

    // Note: We don't update localStorage with content - only metadata is stored
    // Content is fetched from backend/R2 when needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function onFileCreate(newNode) {
    setFiles((prevFiles) => {
      const insertNode = (nodes) =>
        nodes.map((node) => {
          if (node.id === newNode.parentId) {
            const updatedChildren = node.children
              ? [...node.children, newNode]
              : [newNode];
            return { ...node, children: updatedChildren };
          }
          if (node.children?.length) {
            return { ...node, children: insertNode(node.children) };
          }
          return node;
        });

      if (!newNode.parentId) return [...prevFiles, newNode];
      return insertNode(prevFiles);
    });

    setFilesMap((prevMap) => {
      const parentDepth = prevMap[newNode.parent_id]?.depth ?? 0;
      return {
        ...prevMap,
        [newNode.id]: {
          ...newNode,
          parent_id: newNode.parentId,
          depth: parentDepth + 1,
        },
      };
    });
  }

  // Build file path from root to current file (VS Code style)
  // Memoized based on activeFile and filesMap
  const getFilePath = useCallback((file) => {
    if (!file || !filesMap[file.id]) return [];
    
    const pathParts = [];
    let currentId = file.id;
    
    // Traverse up the parent chain
    while (currentId && filesMap[currentId]) {
      const node = filesMap[currentId];
      // Skip root folder (usually has project name, parent_id is null)
      if (node.parent_id === null) {
        break; // Stop at root
      }
      pathParts.unshift(node.name); // Add to beginning of array
      currentId = node.parent_id;
    }
    
    // Add the filename at the end
    pathParts.push(file.name);
    
    return pathParts;
  }, [filesMap]);

  // Get file data with content - ensure content is loaded
  // Memoized to avoid recalculation on every render
  const fileData = useMemo(() => {
    if (!activeFile) return null;
    
    // Try to get content from activeFile first
    let content = activeFile.content;
    
    // If no content in activeFile, try to find it in mainTree
    if (!content && mainTree.length > 0) {
      const fileWithContent = findFileInTree(mainTree, activeFile.name);
      if (fileWithContent && fileWithContent.content !== undefined) {
        content = fileWithContent.content;
      }
    }
    
    // Default to empty string if no content found
    if (content === undefined || content === null) {
      content = '';
    }
    
    return {
      content,
      language: getLangFromExt(activeFile.name),
      name: activeFile.name,
      id: activeFile.id,
      projectId: projectId,
      files,
    };
  }, [activeFile, mainTree, projectId, files, findFileInTree]);

  // Memoize editorFunctions to prevent unnecessary re-renders of CodeEditor
  const editorFunctions = useMemo(() => ({
    setFiles,
    updateFileContent,
    setActiveFile
  }), [setFiles, updateFileContent, setActiveFile]);

  return (
    <section className="sandbox-wrapper">
        <div className="sandbox">
        <div className="sandbox-fe-wrapper">
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            projectId={projectId}
            onFileCreate={onFileCreate}
            filesMap={filesMap}
            setFilesMap={setFilesMap}
            uiState={uiState}
            setUIState = {setUIState}
            updateLocalStorageUIState={updateLocalStorageUIState}
          />
        </div>
        <div className="sandbox-right">
          <div className="sandbox-right-contents">
            <div className="editor-pane">
              <div className="editor-tabs-wrapper">
                <div className="editor-tabs-container-main">
                  <EditorTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabClick={(file) => {
                      if (!file) return;
                      setActiveTab(file.name);
                      setActiveFile(file);
                      
                      // Ensure the tab is in openedTabs
                      const currentOpenedTabs = uiState.openedTabs || [];
                      const exists = currentOpenedTabs.find((t) => t.name === file.name);
                      if (!exists) {
                        const updatedTabs = [...currentOpenedTabs, file];
                        setTabs(updatedTabs);
                        // Store only metadata in localStorage (no content)
                        updateLocalStorageUIState({ 
                          openedTabs: stripContentFromTabs(updatedTabs), 
                          activeTab: file.name 
                        });
                      } else {
                        updateLocalStorageUIState({ activeTab: file.name });
                      }
                    }}
                    onCloseTab={(fileName) => {
                      const currentOpenedTabs = uiState.openedTabs || [];
                      const newTabs = currentOpenedTabs.filter((tab) => tab.name !== fileName);
                      setTabs(newTabs);
                      
                      // If no tabs remain, clear activeFile and activeTab
                      if (newTabs.length === 0) {
                        setActiveFile(null);
                        setActiveTab(null);
                        updateLocalStorageUIState({
                          openedTabs: [],
                          activeTab: null,
                        });
                        return;
                      }
                      
                      // Otherwise, determine which tab should be active
                      let next = null;
                      let nextActiveTab = null;
                      // If we closed the active tab, activate the last one
                      if (uiState.activeTab === fileName) {
                        next = newTabs[newTabs.length - 1];
                        nextActiveTab = next?.name || null;
                      } else {
                        // Keep the current active tab
                        next = newTabs.find(t => t.name === uiState.activeTab);
                        nextActiveTab = next?.name || null;
                      }
                      
                      setActiveFile(next);
                      setActiveTab(nextActiveTab);
                      // Store only metadata in localStorage (no content)
                      updateLocalStorageUIState({
                        openedTabs: stripContentFromTabs(newTabs),
                        activeTab: nextActiveTab,
                      });
                    }}
                    uiState={uiState}
                    setUIState={setUIState}
                    updateLocalStorageUIState={updateLocalStorageUIState}
                  />
                </div>
              </div>
              {useMemo(() => {
                if (!activeFile) return null;
                const filePath = getFilePath(activeFile);
                const isLastElement = (index) => index === filePath.length - 1;
                // Map node_type to type for getIcon compatibility
                const fileType = activeFile.node_type === 'folder' ? 'folder' : 'file';
                const fileIcon = getIcon({ name: activeFile.name, type: fileType });
                
                return (
                  <div className="editor-path-wrapper">
                    <div className="editor-path">
                      {filePath.map((part, index) => (
                        <React.Fragment key={index}>
                          {isLastElement(index) && fileIcon && (
                            <img 
                              src={fileIcon} 
                              alt="file icon" 
                              style={{ 
                                width: '14px', 
                                height: '14px', 
                                marginRight: '0.25rem',
                                opacity: 0.7
                              }} 
                            />
                          )}
                          <span>{part}</span>
                          {index < filePath.length - 1 && (
                            <MdKeyboardArrowRight 
                              size={14} 
                              style={{ margin: '0 0.25rem', color: '#b0b0b0ff' }} 
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              }, [activeFile, getFilePath])}
              <div className="editor-wrapper">
                {loading ? (
                  <div>Loading...</div>
                ) : error ? (
                  <div>Error: {error}</div>
                ) : activeFile && tabs.length > 0 ? (
                  <CodeEditor fileData={fileData} editorFunctions={editorFunctions} />
                ) : (
                  <div className="no-files-placeholder">
                    <span className="editor-no-files">CODEBASE</span>
                  </div>
                )}
              </div>
            </div>

            <div className="preview-wrapper">
              <div className="preview-container">
                <KiraWorkspace />
              </div>
            </div>
          </div>
        </div>
      </div>
      <CodeEditorStatusBar></CodeEditorStatusBar>
    </section>
  );
}
