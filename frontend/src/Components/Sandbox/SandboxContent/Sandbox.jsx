import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import './Sandbox.css';
import FileExplorer from '../FileExplorer/FileExplorer';
import EditorTabs from '../EditorTabs/EditorTabs';
import KiraWorkspace from '../../Kira/KiraWorkspace/KiraWorkspace';
import CodeEditor from '../CodeEditor/CodeEditor';
import { useParams } from 'react-router-dom';

export default function Sandbox() {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch files from the database
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/projects/get-project/${projectId}`,
          {
            withCredentials: true, // if you’re using cookies for auth
          }
        );

        const data = response.data || []; 
        console.log('Fetched file tree:', data);
        setFiles(data);

        if (data.length > 0) {
          // Prefer first file if possible
          let initialFile = null;

          const first = data[0];
          if (first.children && first.children.length > 0) {
            initialFile = first.children[0];
          } else {
            initialFile = first;
          }

          setActiveFile(initialFile);
          setTabs([initialFile]);
          setActiveTab(initialFile?.name || null);
        } else {
          // No files => leave activeFile null, tabs empty
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

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    setActiveFile(file);
    setActiveTab(file.name);

    const existingTab = tabs.find((tab) => tab.name === file.name);
    if (!existingTab) {
      setTabs((prev) => [...prev, file]);
    }
  };

  // Update file content
  const updateFileContent = (tree, targetName, newContent) => {
    return tree.map((node) => {
      if (node.type === 'file' && node.name === targetName) {
        return { ...node, content: newContent };
      }
      if (node.type === 'folder') {
        return {
          ...node,
          children: updateFileContent(node.children || [], targetName, newContent),
        };
      }
      return node;
    });
  };

  // Prepare props for CodeEditor
  const fileData = activeFile
    ? {
        content: activeFile.content,
        language: activeFile.language,
        name: activeFile.name,
        files,
      }
    : null;

  const editorFunctions = { setFiles, updateFileContent, setActiveFile };

  return (
    <section className="sandbox-wrapper">
      <div className="sandbox">
        <div className="sandbox-fe-wrapper">
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
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
                      setActiveTab(file.name);
                      setActiveFile(file);
                    }}
                    onCloseTab={(fileName) => {
                      const newTabs = tabs.filter((tab) => tab.name !== fileName);
                      setTabs(newTabs);
                      if (activeTab === fileName) {
                        if (newTabs.length > 0) {
                          const next = newTabs[0];
                          setActiveFile(next);
                          setActiveTab(next.name);
                        } else {
                          setActiveFile(null);
                          setActiveTab(null);
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="editor-path-wrapper">
                <span className="editor-path">
                  {/* Display file path if needed */}
                </span>
              </div>
              <div className="editor-wrapper">
                {loading ? (
                  <div>Loading...</div>
                ) : error ? (
                  <div>Error: {error}</div>
                ) : activeFile ? (
                  <CodeEditor fileData={fileData} editorFunctions={editorFunctions} />
                ) : (
                  <div className="no-files-placeholder">
                    <span className='editor-no-files'>CODEBASE</span>
                  </div>
                )}
              </div>
            </div>
            <div className="preview-wrapper">
              <KiraWorkspace />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
