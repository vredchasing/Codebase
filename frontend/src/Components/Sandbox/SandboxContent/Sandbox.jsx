import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import HeaderWorkspace from '../../HeaderWorkspace';

import { api, API_ENDPOINTS, handleError } from '../../../utils';
import './Sandbox.css';
import FileExplorer from '../FileExplorer/FileExplorer';
import EditorTabs from '../EditorTabs/EditorTabs';
import KiraWorkspace from '../../Kira/KiraWorkspace/KiraWorkspace';
import CodeEditor from '../CodeEditor/CodeEditor';
import { CodeEditorStatusBar } from '../CodeEditor/CodeEditorStatusBar';
import getLangFromExt from '../CodeEditor/getExtHelper';
import getIcon from '../ExplorerIcons/iconHelperFuncs';
import { useWebSocket } from '../../../hooks/useWebSocket';
import LoadingAnimation from '../../animationAssests/loadingAnimation';

import {
  setOpenedTabs,
  setActiveTab,
  setWorkspaceProject,
  closeTab
} from '../../../stores/reduxTK/slices/UI/uiSlice';

import { AGENT_SETTINGS_TAB } from '../../../stores/reduxTK/slices/workspace/workspaceSettingsSlice';
import AgentSettingsTab from '../../Kira/AgentSettingsModal/AgentSettingsTab';

export default function Sandbox() {
  const { projectId } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!projectId) return;
    dispatch(setWorkspaceProject(projectId));
  }, [projectId, dispatch]);

  useWebSocket(projectId);

  // Local file state
  const [files, setFiles] = useState([]);
  const [filesMap, setFilesMap] = useState({});
  const [mainTree, setMainTree] = useState([]);
  const [filesContentMap, setFilesContentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redux workspace tabs
  const openedTabs = useSelector(state => state.workspaceUI.workspace.openedTabs || []);
  const activeTabId = useSelector(state => state.workspaceUI.workspace.activeTab);

  // =============================================================================
  // Helpers
  // =============================================================================

  const findFileInTree = useCallback((tree, fileName) => {
    for (const node of tree) {
      if (node.name === fileName && node.node_type === 'file') return node;
      if (node.children?.length > 0) {
        const found = findFileInTree(node.children, fileName);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const flattenFiles = useCallback((nodes, parentId = null, level = 0, result = {}) => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      result[node.id] = {
        ...node,
        parent_id: parentId,
        depth: level,
        isLastChild: i === nodes.length - 1,
      };
      if (node.children?.length) flattenFiles(node.children, node.id, level + 1, result);
    }
    return result;
  }, []);

  const getFilePath = useCallback((file) => {
    if (!file || !filesMap[file.id]) return [];
    const path = [];
    let current = file.id;
    while (current && filesMap[current]) {
      const node = filesMap[current];
      if (node.parent_id === null) break;
      path.unshift(node.name);
      current = node.parent_id;
    }
    path.push(file.name);
    return path;
  }, [filesMap]);

  const buildContentTree = useCallback(async (data) => {
    try {
      const response = await api.post(API_ENDPOINTS.PROJECTS.GET_FILE_TREE_CONTENT, { data });
      const treeWithContent = response.data || [];
      setMainTree(treeWithContent);

      // Build a content map (id → file with content)
      const buildFilesContentMap = (nodes, result = {}) => {
        for (const node of nodes) {
          if (node.node_type === 'file') {
            result[node.id] = node;
          }
          if (node.children?.length) {
            buildFilesContentMap(node.children, result);
          }
        }
        return result;
      };
      const contentMap = buildFilesContentMap(treeWithContent);
      setFilesContentMap(contentMap);

      const mergeContent = (nodes) =>
        nodes.map(node => {
          const matching = findFileInTree(treeWithContent, node.name);
          if (node.node_type === 'file' && matching) {
            return { ...node, content: matching.content };
          }
          if (node.children?.length) return { ...node, children: mergeContent(node.children) };
          return node;
        });

      setFiles(prev => mergeContent(prev));
    } catch (err) {
      handleError(err, 'Sandbox - Build Content Tree');
      setError('Failed to load file tree content');
    }
  }, [findFileInTree]);

  // =============================================================================
  // Fetch files once
  // =============================================================================

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await api.get(API_ENDPOINTS.PROJECTS.GET_PROJECT(projectId));
        const data = res.data || [];
        setFiles(data);
        setFilesMap(flattenFiles(data));
        await buildContentTree(data);
      } catch (err) {
        handleError(err, 'Sandbox - Fetch Files');
        setError('Failed to load project files. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [projectId, flattenFiles, buildContentTree]);

  // =============================================================================
  // Determine active tab
  // =============================================================================

  // Find the active tab object
  const activeTab = useMemo(() => {
    return openedTabs.find(t => t.id === activeTabId) || null;
  }, [openedTabs, activeTabId]);

  // Determine if we’re on the settings tab
  const isSettingsTab = activeTabId === AGENT_SETTINGS_TAB;

  // If this is a file tab, locate the file object with content
  const activeFile = useMemo(() => {
    if (!activeTab || isSettingsTab) return null;

    const fileId = activeTab.id;
    // Prefer the content map (backend content)
    const fileFromContent = filesContentMap[fileId];
    if (fileFromContent) return fileFromContent;

    // Fallback: find in mainTree by name
    return findFileInTree(mainTree, activeTab.name) || null;
  }, [activeTab, filesContentMap, mainTree, findFileInTree, isSettingsTab]);

  // Build fileData if a file is active
  const fileData = useMemo(() => {
    if (!activeFile) return null;
    const content = activeFile.content || '';
    return {
      content,
      language: getLangFromExt(activeFile.name),
      name: activeFile.name,
      id: activeFile.id,
      projectId,
      files,
    };
  }, [activeFile, files, projectId]);

  // Handle file clicks in explorer
  const handleFileSelect = useCallback((file) => {
    if (!file || file.node_type !== 'file') return;

    const exists = openedTabs.some(t => t.id === file.id);
    if (!exists) dispatch(setOpenedTabs([...openedTabs, { id: file.id, name: file.name, node_type: 'file' }]));

    dispatch(setActiveTab(file.id));
  }, [openedTabs, dispatch]);

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <section className="sandbox-wrapper">
      <HeaderWorkspace></HeaderWorkspace>
      <div className="sandbox">
        {/* File Explorer */}
        <div className="sandbox-fe-wrapper">
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            projectId={projectId}
            onFileCreate={null}
            filesMap={filesMap}
            setFilesMap={setFilesMap}
          />
        </div>

        {/* Editor + Preview */}
        <div className="sandbox-right">
          <div className="sandbox-right-contents">
            <div className="editor-pane">
              {/* Tabs */}
              <div className="editor-tabs-wrapper">
                <div className="editor-tabs-container-main">
                  <EditorTabs />
                </div>
              </div>

              {/* Breadcrumb Path */}
              {activeFile && (
                <div className="editor-path-wrapper">
                  <div className="editor-path">
                    {getFilePath(activeFile).map((part, index, arr) => (
                      <React.Fragment key={index}>
                        <span>{part}</span>
                        {index < arr.length - 1 && <MdKeyboardArrowRight size={14} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Editor / Settings */}
              <div className="editor-wrapper">
                {loading ? (
                  <LoadingAnimation />
                ) : error ? (
                  <div>Error: {error}</div>
                ) : isSettingsTab ? (
                  <AgentSettingsTab />
                ) : activeFile ? (
                  <CodeEditor fileData={fileData} />
                ) : (
                  <div className="no-files-placeholder">
                    <span className="editor-no-files">CODEBASE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="preview-wrapper">
              <div className="preview-container">
                <KiraWorkspace />
              </div>
            </div>
          </div>
        </div>
      </div>

      <CodeEditorStatusBar />
    </section>
  );
}
