import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

function CodeEditor({ fileData, editorFunctions }) {
  const { content: initialContent, language, name, id, projectId } = fileData;
  const { setFiles, updateFileContent, setActiveFile } = editorFunctions;

  const editorRef = useRef(null);
  const contentRef = useRef(initialContent);
  const contentStateRef = useRef(initialContent); // Track latest contentState for unmount

  const [contentState, setContentState] = useState(initialContent);
  const timerRef = useRef(null);

  async function updateFileDB() {
    try {
      console.log('Auto-sav­ing file', name, 'with contentState:', contentState);
      const response = await axios.post('http://localhost:3000/api/projects/updateFile', {
        fileName: name,
        content: contentState,
        fileId: id,
        projectId: projectId,
      }, {
        withCredentials: true,
      });
      // After successful save: update contentRef
      contentRef.current = contentState;
      console.log('Save response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating file in DB:', error);
    }
  }

  function scheduleAutoSave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Only schedule if contentState changed since last saved
    if (contentState !== contentRef.current) {
      timerRef.current = setTimeout(() => {
        updateFileDB();
      }, 1000);
    }
  }

  // Effect to schedule autosave when content changes
  useEffect(() => {
    scheduleAutoSave();
    return () => {
      // Clear the timer when contentState changes (normal debounce behavior)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [contentState]);

  // Effect to save pending changes on component unmount
  useEffect(() => {
    return () => {
      // On unmount, save any pending changes immediately
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // Check if there are unsaved changes using ref (always has latest value)
      if (contentStateRef.current !== contentRef.current) {
        // Fire off the save - can't await in cleanup, but we try to save
        // Use a temporary function that captures the current values
        const currentContent = contentStateRef.current;
        const currentName = name;
        const currentId = id;
        const currentProjectId = projectId;
        
        // Make the save call with captured values
        axios.post('http://localhost:3000/api/projects/updateFile', {
          fileName: currentName,
          content: currentContent,
          fileId: currentId,
          projectId: currentProjectId,
        }, {
          withCredentials: true,
        }).then(() => {
          console.log('Saved on unmount:', currentName);
        }).catch(err => {
          console.error('Error saving on unmount:', err);
        });
      }
    };
  }, []); // Empty deps - only runs on mount/unmount

  // Effect to react to changes in initialContent prop (when switching files)
  useEffect(() => {
    if (initialContent !== contentRef.current) {
      contentRef.current = initialContent;
      setContentState(initialContent);
      contentStateRef.current = initialContent; // Keep ref in sync
    }
    // Also layout the editor if already mounted
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [initialContent]);

  function handleEditorChange (value) {
    const v = value || '';
    setContentState(v);
    contentStateRef.current = v; // Keep ref in sync
    updateFileContent(id, v);
    setActiveFile(prev => ({ ...prev, content: v })); 
    console.log('Editor content changed:', v);
  }

  return (
    <div className="editor-container" style={{ height: '100%', width: '100%' }}>
      <Editor
        value={contentState}                     // <- **use contentState**, not initialContent
        language={language}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
        }}
        onChange={handleEditorChange}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
      />
    </div>
  );
}

export default CodeEditor;
