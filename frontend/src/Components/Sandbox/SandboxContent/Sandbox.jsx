import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import './Sandbox.css';
import FileExplorer from '../FileExplorer/FileExplorer';
import EditorTabs from '../EditorTabs/EditorTabs';
import KiraWorkspace from '../../Kira/KiraWorkspace/KiraWorkspace';
import CodeEditor from '../CodeEditor/CodeEditor';

export default function Sandbox() {
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
        const response = await axios.get('/api/files');
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        setFiles(data);
        const initialFile = data[0]?.children ? data[0].children[0] : data[0];
        setActiveFile(initialFile);
        setTabs([initialFile]);
        setActiveTab(initialFile?.name || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // Handle file selection
  const handleFileSelect = (file) => {
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
        return { ...node, children: updateFileContent(node.children, targetName, newContent) };
      }
      return node;
    });
  };

  // Prepare props for CodeEditor
  const fileData = activeFile ? {
    content: activeFile.content,
    language: activeFile.language,
    name: activeFile.name,
    files,
  } : {};

  const editorFunctions = {
    setFiles,
    updateFileContent,
    setActiveFile,
  };

  return (
    <section className='sandbox-wrapper'>
      <div className="sandbox">
        <div className='sandbox-fe-wrapper'>
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
          />
        </div>
        <div className='sandbox-right'>
          <div className='sandbox-right-contents'>
            <div className="editor-pane">
              <div className='editor-tabs-wrapper'>
                <div className='editor-tabs-container-main'>
                  <EditorTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabClick={(file) => {
                      setActiveTab(file.name);
                      setActiveFile(file);
                    }}
                    onCloseTab={(fileName) => {
                      setTabs((prev) => prev.filter((tab) => tab.name !== fileName));
                      if (activeTab === fileName) {
                        const remainingTabs = tabs.filter((tab) => tab.name !== fileName);
                        if (remainingTabs.length > 0) {
                          setActiveFile(remainingTabs[0]);
                          setActiveTab(remainingTabs[0].name);
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className='editor-path-wrapper'>
                <span className='editor-path'>
                  {/* Display file path if needed */}
                </span>
              </div>
              <div className='editor-wrapper'>
                {loading ? (
                  <div>Loading...</div>
                ) : error ? (
                  <div>Error: {error}</div>
                ) : (
                  <CodeEditor fileData={fileData} editorFunctions={editorFunctions} />
                )}
              </div>
            </div>
            <div className='preview-wrapper'>
              <KiraWorkspace />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
