import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

import './FeaturesAnimation.css';
import WindowControls from '../FunctionalComponents/WindowControls';
import getIcon from '../Sandbox/ExplorerIcons/iconHelperFuncs';

export default function FeaturesAnimation() {
  const [files, setFiles] = useState([
    { name: 'index.js', content: 'console.log("Hello, World!");' },
    { name: 'App.html', content: 'import React from "react";\n\nfunction App() {\n  return <div>My React App</div>;\n}\n\nexport default App;' },
    { name: 'styles.css', content: 'body { font-family: Arial, sans-serif; }' },
  ]);

  const [activeFileName, setActiveFileName] = useState('index.js');

  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);

  const activeFile = files.find(file => file.name === activeFileName);

  useEffect(() => {
    if (terminalRef.current) {
      terminalInstance.current = new Terminal({
        scrollback: 0,
        theme: {
          background: '#989898ff',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selectionBackground: '#ffffff55',
        },
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14,
        lineHeight: 1.2,
      });
      terminalInstance.current.open(terminalRef.current);
      terminalInstance.current.write('Welcome to the Monaco Editor Terminal!');
    }

    return () => {
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, []);

  const handleEditorChange = (newValue) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.name === activeFileName ? { ...file, content: newValue } : file
      )
    );
  };

  const onCloseTab = (name) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== name));
    if (activeFileName === name && files.length > 1) {
      // Switch to another tab automatically
      const nextFile = files.find(file => file.name !== name);
      setActiveFileName(nextFile?.name || '');
    }
  };

  return (
    <section>
      <div className='cursor-container'>
        <img className='cursor' src='/public/images/cursor.png'></img>
      </div>
      <div className='f-a-editor-wrapper'>
        <div className='f-a-editor-tabs-wrapper'>
          <div className='f-a-editor-tabs-content'>
            {files.map((file) => (
              <div
                key={file.name}
                className={`f-a-editor-tab ${file.name === activeFileName ? 'active' : ''}`}
                onClick={() => setActiveFileName(file.name)}
              >
                <div className='f-a-icon-container'>
                  <img className='f-a-icon-img' src={getIcon(file)} />
                </div>
                <div className='f-a-editor-tab-text'>
                  {file.name}
                </div>
                <span
                  className='editor-tabs-close-btn'
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.name);
                  }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
          <div className='f-a-window-controls-wrapper'>
            <WindowControls />
          </div>
        </div>

        {activeFile && (
          <Editor
            height="100%"
            theme="vs-dark"
            language={activeFile.name.split('.').pop()}
            value={activeFile.content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14,
            }}
          />
        )}
      </div>

      <div ref={terminalRef} style={{ width: '80%', height: '300px', overflow: 'hidden', borderRadius: '12px' }} />
    </section>
  );
}
