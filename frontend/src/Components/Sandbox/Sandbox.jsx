import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './Sandbox.css';

export default function Sandbox() {
  const [html, setHtml] = useState('<h1>Hello, world!</h1>');
  const [css, setCss] = useState('h1 { color: red; }');
  const [js, setJs] = useState("console.log('Hello')");
  const [activeTab, setActiveTab] = useState('html');
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const combined = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
        </html>
      `;
      setSrcDoc(combined);
    }, 250);

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  const renderEditor = () => {
    switch (activeTab) {
      case 'html':
        return <Editor height="100%" defaultLanguage="html" value={html} onChange={value => setHtml(value)} />;
      case 'css':
        return <Editor height="100%" defaultLanguage="css" value={css} onChange={value => setCss(value)} />;
      case 'js':
        return <Editor height="100%" defaultLanguage="javascript" value={js} onChange={value => setJs(value)} />;
      default:
        return null;
    }
  };

  return (
    <div className="sandbox">
      <div className="editor-pane">
        <div className="tabs">
          <button onClick={() => setActiveTab('html')}>index.html</button>
          <button onClick={() => setActiveTab('css')}>style.css</button>
          <button onClick={() => setActiveTab('js')}>script.js</button>
        </div>
        <div className="editor-container">
          {renderEditor()}
        </div>
      </div>
      <iframe
        srcDoc={srcDoc}
        title="Live Preview"
        sandbox="allow-scripts"
        className="preview-pane"
      />
    </div>
  );
}
