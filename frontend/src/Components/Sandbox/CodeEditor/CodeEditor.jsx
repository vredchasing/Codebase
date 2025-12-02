import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { api, API_ENDPOINTS, handleError } from '../../../utils';
import LoadingAnimation from '../../animationAssests/loadingAnimation';

function CodeEditor({ fileData, editorFunctions }) {
  const { content: initialContent, language, name, id, projectId } = fileData;
  const { setFiles, updateFileContent, setActiveFile } = editorFunctions;

  const editorRef = useRef(null);
  const contentRef = useRef(initialContent);
  const contentStateRef = useRef(initialContent); // Track latest contentState for unmount

  const [contentState, setContentState] = useState(initialContent);
  const timerRef = useRef(null);

  function incrementalTreeUpdate (oldContent, newContent) {
    
  };

  async function updateFileDB() {
    try {
      const response = await api.post(API_ENDPOINTS.PROJECTS.UPDATE_FILE, {
        fileName: name,
        content: contentState,
        fileId: id,
        projectId: projectId,
      });
      // After successful save: update contentRef
      contentRef.current = contentState;
      return response.data;
    } catch (error) {
      handleError(error, 'CodeEditor - Update File');
      throw error; // Re-throw so caller knows save failed
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
        api.post(API_ENDPOINTS.PROJECTS.UPDATE_FILE, {
          fileName: currentName,
          content: currentContent,
          fileId: currentId,
          projectId: currentProjectId,
        }).catch(err => {
          handleError(err, 'CodeEditor - Save on Unmount');
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

  function handleEditorChange(value) {
    const v = value || '';
    setContentState(v);
    contentStateRef.current = v;
    setActiveFile(prev => ({ ...prev, content: v }));
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
        loading={<LoadingAnimation />}
      />
    </div>
  );
}

export default CodeEditor;
