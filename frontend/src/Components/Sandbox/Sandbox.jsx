import React, { useState, useEffect, act } from 'react';
import Editor from '@monaco-editor/react';
import './Sandbox.css';
import FileExplorer from './FileExplorer';
import EditorTabs from './EditorTabs/EditorTabs';

// Initial file + folder structure
const initialFiles = [
  {
    type: 'folder',
    name: 'TEMPLATE INFO',
    children: [
      {
        type: 'file',
        name: 'template.json',
        content: JSON.stringify({ name: "react", version: "18.0.0" }, null, 2),
        language: 'json',
      }
    ]
  },
  {
    type: 'folder',
    name: 'SANDBOX',
    children: [
      {
        type: 'folder',
        name: 'src',
        children: [
          {
            type: 'folder',
            name: 'public',
            children: [
              {
                type: 'file',
                name: 'favicon.ico'
              },
              {
                type: 'folder',
                name: 'images',
                children: [
                  {
                    type: 'file',
                    name: 'logo.png',
                  }
                ]
              }
            ]
          },
          {
            type: 'file',
            name: 'index.html',
            language: 'html',
            content: '<h1>Hello, world!</h1>',
          },
          {
            type: 'file',
            name: 'style.css',
            language: 'css',
            content: 'h1 { color: white; }',
          },
          {
            type: 'file',
            name: 'script.js',
            language: 'javascript',
            content: "console.log('Hello')",
          },
        ]
      }
    ]
  },
  {
    type: 'folder',
    name: 'DEPENDENCIES',
    children: [
      {
        type: 'file',
        name: 'package.json',
        content: JSON.stringify({
          dependencies: {
            react: "^18.0.0",
            "react-dom": "^18.0.0"
          }
        }, null, 2),
        language: 'json',
      }
    ]
  }
];


export default function Sandbox() {

  const [files, setFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState(
    initialFiles[0].children ? initialFiles[0].children[0] : initialFiles[0]
  );
  const [tabs, setTabs] = useState([activeFile]);
  const [activeTab, setActiveTab] = useState(activeFile.name);
  
  const [srcDoc, setSrcDoc] = useState('');

  // Helper to flatten files from folder structure
  const flattenFiles = (nodes) => {
    return nodes.reduce((acc, node) => {
      if (node.type === 'file') return [...acc, node];
      if (node.type === 'folder') return [...acc, ...flattenFiles(node.children)];
      return acc;
    }, []);
  };

  // File Selection Handler

  function handleFileSelect(file) {
    setActiveFile(file);
    setActiveTab(file.name);

    // Check if the file is already open in tabs
    const existingTab = tabs.find((tab) => tab.name === file.name);
    if (!existingTab) {
      setTabs((prev) => [...prev, file]);
    }
  }

  // Update srcDoc when any file changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      const flat = flattenFiles(files);
      const html = flat.find((f) => f.name === 'index.html')?.content || '';
      const css = flat.find((f) => f.name === 'style.css')?.content || '';
      const js = flat.find((f) => f.name === 'script.js')?.content || '';

      const combined = `
        <!DOCTYPE html>
        <html lang="en">
        <head><style>${css}</style></head>
        <body>
          ${html}
          <script>${js}<\/script>
        </body>
        </html>
      `;
      setSrcDoc(combined);
    }, 250);

    return () => clearTimeout(timeout);
  }, [files]);

  // Update a file’s content in the nested tree
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

  return (
    <div className="sandbox">
      <FileExplorer
        files={files}
        activeFile={activeFile}
        onFileSelect={handleFileSelect}
      />

      <div className='sandbox-right'>
        <div className="editor-pane">
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
          <div className="editor-container">
            <Editor
              height="100%"
              theme="vs-dark" 
              defaultLanguage={activeFile.language}
              value={activeFile.content}
              options={{
                minimap: { enabled: false },
              }}
              onChange={(value) => {
                setFiles(updateFileContent(files, activeFile.name, value));
                setActiveFile((prev) => ({ ...prev, content: value }));
              }}
            />
          </div>
        </div>
        <iframe
          srcDoc={srcDoc}
          title="Live Preview"
          sandbox="allow-scripts"
          className="preview-pane"
        />
      </div>
    </div>
  );
}
