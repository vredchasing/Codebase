import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ fileData, editorFunctions }) {
  const { content, language, name } = fileData;
  const { setFiles, updateFileContent, setActiveFile } = editorFunctions;
  const editorRef = useRef(null);

  const contentRef = useRef(content);
  const [contentState, setContentState] = useState(content);
  const timerRef = useRef(null);

  async function updateFileDB(){
    try{
      const response = await axios.post('/api/updateFile', {
        fileName: name,
        content: contentState,
      });
      return response.data;
    }
    catch(error){
      console.error('Error updating file in DB:', error);
    }
    contentRef.current = contentState;
  }

  async function scheduleAutoSave(){
    if (timerRef.current) clearTimeout(timerRef.current);
    // check if mainTree is retrieved from the database, if not, we need to queue 
    if(contentState !== contentRef.current){
      timerRef.current = setTimeout(()=>{
        updateFileDB();
      }, 2000);
    }
  }

  useEffect(() => {
    scheduleAutoSave();
    return ()=>{
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [contentState]);

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
          // update content state
          setContentState(value);
        }}
        editorDidMount={(editor) => {
          editorRef.current = editor;
        }}
      />
    </div>
  );
}

export default CodeEditor;
