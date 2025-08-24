import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

import './FeaturesAnimation.css';
import WindowControls from '../FunctionalComponents/WindowControls';
import LiveViewer from './FA-LiveViewer';
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



// MAIN ANIMATION EFFECT 

  const wrapperRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorTimelineRef = useRef(null);
  const expandButtonRef = useRef(null);

  const editorRef = useRef(null);
  const liveViewerRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const expandButton = expandButtonRef.current;
    const wrapper = wrapperRef.current;
    if (!cursor || !expandButton || !wrapper) return;

    //editor animation setup 

    const editor = editorRef.current;

    // live viewer setup

    const liveViewer = liveViewerRef.current;
  
    requestAnimationFrame(() => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const buttonRect = expandButton.getBoundingClientRect();

      // Arbitrary starting offset relative to wrapper
      const startX = 400; // px from wrapper's left
      const startY = 400; // px from wrapper's top

      // Target position relative to wrapper
      const targetX = buttonRect.left + buttonRect.width + 3 - wrapperRect.left;
      const targetY = buttonRect.top + buttonRect.height + 5 - wrapperRect.top;

      const tl = gsap.timeline({ paused: true });
      tl.set(cursor, { xPercent: -50, yPercent: -50, x: startX, y: startY })
      tl.set(liveViewer, { opacity: 0, scale: 0.9 })
        .to(cursor, { x: 600, y: 300, duration: 1, ease: 'power2.inOut' }, '+=0') // optional intermediate
        .to(cursor, { x: targetX, y: targetY, duration: 1, ease: 'power2.inOut' }, '+=0.1')
        .to(cursor, { scale: 1.2, duration: 0.2, ease: 'power2.inOut' }, '+=0.2')
        // expand button click effect 
        .to(editor, { width: '50vw', duration: 0.1, ease: 'power2.inOut' }, '+=0')
        // reset cursor scale
        .to(cursor, { scale: 1, duration: 0.1, ease: 'power2.inOut' }, '+=0')
        // copy and paste effect
        .to(cursor, { x: targetX + 50, y: targetY + 50, duration: 0.5, ease: 'power2.inOut' }, '+=0.1')
        //click run live preview button 
        .to(liveViewer, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.inOut' }, '+=0')
        //scroll the live viewer
        .to(cursor, { x: targetX + 100, y: targetY + 150, duration: 0.5, ease: 'power2.inOut' }, '+=0')

      tl.play();
    });
  }, []);



  //JSX
  return (
    <section className='f-a-wrapper' ref={wrapperRef}>
      <div className='cursor-container' ref={cursorRef}>
        <img className='cursor' src='/public/images/cursor.png'></img>
      </div>
      <div className='f-a-editor-wrapper' ref={editorRef}>
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
            <WindowControls ref={expandButtonRef} />
          </div>
        </div>

        {activeFile && (
          <Editor
            className='f-a-editor'
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

      <div className='f-a-live-viewer-wrapper' ref={liveViewerRef}>
        <LiveViewer
          htmlContent={``}
          cssContent={`
            .box {
            }
          `}
          jsContent={`
          `}
        />
      </div>

      <div ref={terminalRef} style={{ width: '80%', height: '300px', overflow: 'hidden', borderRadius: '12px', opacity: 0 }} />
    </section>
  );
}
