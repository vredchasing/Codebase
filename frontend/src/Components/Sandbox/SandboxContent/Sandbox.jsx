import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import './Sandbox.css';
import FileExplorer from '../FileExplorer/FileExplorer';
import EditorTabs from '../EditorTabs/EditorTabs';
import KiraWorkspace from '../../Kira/KiraWorkspace/KiraWorkspace';
import CodeEditor from '../CodeEditor/CodeEditor';
import { useParams } from 'react-router-dom';
import getLangFromExt from '../CodeEditor/getExtHelper';

export default function Sandbox() {
  const { projectId } = useParams();
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
  function findFileInTree(tree, fileName) {
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
  }

  // --- Build Tree from Backend ---
  async function buildContentTree(data) {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/projects/get-file-tree-content`,
        { data },
        { withCredentials: true }
      );
      if (response.data) {
        const treeDataWithContent = response.data;
        setMainTree(treeDataWithContent);
        console.log('Built content tree:', treeDataWithContent);
        
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
      console.error('Error building content tree:', error);
    }
  }

  function flattenFiles(nodes, parentId = null, level = 0, result = {}) {
    for (const node of nodes) {
      result[node.id] = { ...node, parent_id: parentId, depth: level };
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
        const response = await axios.get(
          `http://localhost:3000/api/projects/get-workspace-ui-state/${projectId}`,
          { withCredentials: true }
        );
        const dbState = response.data?.ui_state || defaultUIState;
        const key = `workspaceUIState_${projectId}`;
        localStorage.setItem(key, JSON.stringify(dbState));
        setUIState(dbState);
        console.log('Loaded UI state from DB:', dbState);
      } catch (error) {
        console.error('Error fetching UI state from DB:', error);
        setUIState(defaultUIState);
      }
    }

    initUIState();
  }, [projectId]);

  // --- Fetch files from the database ---
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/projects/get-project/${projectId}`,
          { withCredentials: true }
        );
        const data = response.data || [];
        setFiles(data);

        const flattened = flattenFiles(data);
        setFilesMap(flattened);
        console.log('Fetched file tree:', data);

        // Build content tree
        buildContentTree(data);

        // Only restore tabs if they exist in uiState (from previous session)
        // Don't auto-load any files - user must explicitly click to open files
        if (uiState.openedTabs && uiState.openedTabs.length > 0) {
          // Restore from uiState (user had tabs open in previous session)
          const restoredTabs = uiState.openedTabs.filter(tab => tab && tab.node_type === 'file');
          const restoredActiveTab = uiState.activeTab;
          setTabs(restoredTabs);
          if (restoredActiveTab) {
            const activeFileObj = restoredTabs.find(t => t.name === restoredActiveTab);
            if (activeFileObj) {
              setActiveFile(activeFileObj);
              setActiveTab(restoredActiveTab);
            } else if (restoredTabs.length > 0) {
              // If active tab was removed, set the last tab as active
              const lastTab = restoredTabs[restoredTabs.length - 1];
              setActiveFile(lastTab);
              setActiveTab(lastTab.name);
            }
          }
        } else {
          // No tabs in previous session - start with empty state
          setActiveFile(null);
          setTabs([]);
          setActiveTab(null);
        }
      } catch (err) {
        console.error('Error fetching files:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

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
      const validTabs = uiState.openedTabs.filter(tab => tab && tab.node_type === 'file');
      
      // If folders were filtered out, update the state (but only once per unique state)
      if (validTabs.length !== uiState.openedTabs.length) {
        updateLocalStorageUIState({ openedTabs: validTabs });
        lastProcessedTabsRef.current = JSON.stringify(validTabs.map(t => t?.name));
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
  const handleFileSelect = (file) => {
    if (!file || file.node_type === 'folder') return; // Don't open folders as tabs
    setActiveFile(file);
    setActiveTab(file.name);

    const currentOpenedTabs = uiState.openedTabs || [];
    const exists = currentOpenedTabs.find((t) => t.name === file.name);
    if (!exists) {
      const updatedTabs = [...currentOpenedTabs, file];
      setTabs(updatedTabs);
      updateLocalStorageUIState({ openedTabs: updatedTabs, activeTab: file.name });
    } else {
      updateLocalStorageUIState({ activeTab: file.name });
    }
  };

  // --- Update file content ---
  const updateFileContent = (tree, targetName, newContent) =>
    tree.map((node) => {
      if (node.node_type === 'file' && node.name === targetName) {
        return { ...node, content: newContent };
      }
      if (node.node_type === 'folder') {
        return {
          ...node,
          children: updateFileContent(node.children || [], targetName, newContent),
        };
      }
      return node;
    });

  // --- File creation ---
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

  // Get file data with content - ensure content is loaded
  const getFileData = () => {
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
      files,
    };
  };

  const fileData = getFileData();

  const editorFunctions = { setFiles, updateFileContent, setActiveFile };

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
                      if (!file || file.node_type === 'folder') return; // Don't open folders
                      setActiveTab(file.name);
                      setActiveFile(file);
                      
                      // Ensure the tab is in openedTabs
                      const currentOpenedTabs = uiState.openedTabs || [];
                      const exists = currentOpenedTabs.find((t) => t.name === file.name);
                      if (!exists) {
                        const updatedTabs = [...currentOpenedTabs, file];
                        setTabs(updatedTabs);
                        updateLocalStorageUIState({ 
                          openedTabs: updatedTabs, 
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
                      updateLocalStorageUIState({
                        openedTabs: newTabs,
                        activeTab: nextActiveTab,
                      });
                    }}
                    uiState={uiState}
                    setUIState={setUIState}
                    updateLocalStorageUIState={updateLocalStorageUIState}
                  />
                </div>
              </div>
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
    </section>
  );
}
