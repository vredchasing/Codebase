import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';

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
import { setOpenedTabs, setActiveTab } from '../../../stores/reduxTK/slices/UI/uiSlice';

export default function Sandbox() {
  const { projectId } = useParams();
  const dispatch = useDispatch();

  useWebSocket(projectId);

  // Local file cache state
  const [files, setFiles] = useState([]);
  const [filesMap, setFilesMap] = useState({});
  const [mainTree, setMainTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redux persisted workspace UI state
  const openedTabs = useSelector(state => state.workspaceUI.workspace.openedTabs || []);
  const activeTabName = useSelector(state => state.workspaceUI.workspace.activeTab);

  // —————————————————————————————————————————
  // Helpers

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

  // — Fetch project files once
  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await api.get(API_ENDPOINTS.PROJECTS.GET_PROJECT(projectId));
        const data = res.data || [];
        setFiles(data);
        setFilesMap(flattenFiles(data));
        buildContentTree(data);
      } catch (err) {
        handleError(err, 'Sandbox - Fetch Files');
        setError('Failed to load project files. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [projectId, flattenFiles, buildContentTree]);

  // — Derive current active file object
  const activeFile = useMemo(() => {
    if (!activeTabName) return null;
    let result = files.find(f => f.name === activeTabName);
    if (!result && mainTree.length > 0) {
      result = findFileInTree(mainTree, activeTabName);
    }
    return result || null;
  }, [activeTabName, files, mainTree, findFileInTree]);

  // — File selection handler
  const handleFileSelect = useCallback((file) => {
    if (!file || file.node_type !== 'file') return;

    // Add to openedTabs if not already
    const exists = openedTabs.some(t => t.id === file.id);
    if (!exists) dispatch(setOpenedTabs([...openedTabs, file]));

    dispatch(setActiveTab(file.name));
  }, [openedTabs, dispatch]);

  // — Build props for CodeEditor
  const fileData = useMemo(() => {
    if (!activeFile) return null;
    let content = activeFile.content || '';
    return {
      content,
      language: getLangFromExt(activeFile.name),
      name: activeFile.name,
      id: activeFile.id,
      projectId,
      files,
    };
  }, [activeFile, files, projectId]);

  return (
    <section className="sandbox-wrapper">
      <div className="sandbox">
        {/* File Explorer Panel */}
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
                  <EditorTabs projectId={projectId} />
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

              {/* Editor */}
              <div className="editor-wrapper">
                {loading ? (
                  <div>Loading...</div>
                ) : error ? (
                  <div>Error: {error}</div>
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
