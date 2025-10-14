import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ fileData, editorFunctions }) {
  const { content, language, name } = fileData;
  const { setFiles, updateFileContent, setActiveFile } = editorFunctions;
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [content]);

  return (
    <div className="editor-container" style={{ height: '100%', width: '100%' }}>
      <Editor
        value={content}
        language={language}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
        }}
        onChange={(value) => {
          setFiles(updateFileContent(fileData.files, name, value));
          setActiveFile((prev) => ({ ...prev, content: value }));
        }}
        editorDidMount={(editor) => {
          editorRef.current = editor;
        }}
      />
    </div>
  );
}

export default CodeEditor;
