import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { api, API_ENDPOINTS, handleError } from '../../../utils';
import LoadingAnimation from '../../animationAssests/loadingAnimation';
import useStatusBarStore from '../../../stores/statusBarStore';
import websocketService from '../../../services/websocketService';

function CodeEditor({ fileData}) {
  const { content: initialContent, language, name, id, projectId, path } = fileData;

  const editorRef = useRef(null);
  const contentRef = useRef(initialContent);
  const contentStateRef = useRef(initialContent); // Track latest contentState for unmount
  const cursorUpdateTimeoutRef = useRef(null);

  const [contentState, setContentState] = useState(initialContent);
  const timerRef = useRef(null);

  function incrementalTreeUpdate (oldContent, newContent) {
    
  };

  async function updateFileDB() {
    const actionId = useStatusBarStore.getState().startAction();
    const store = useStatusBarStore.getState();
    
    try {
      // Set database connection to connecting
      store.setConnectionState('database', 'connecting');
      
      const response = await api.post(API_ENDPOINTS.PROJECTS.UPDATE_FILE, {
        fileName: name,
        content: contentState,
        fileId: id,
        projectId: projectId,
        actionId: actionId, // Send actionId to backend
      });
      
      // After successful save: update contentRef
      contentRef.current = contentState;
      
      // Database save successful
      store.setConnectionState('database', 'connected');
      
      // Note: Embedding pipeline is async, so we'll wait for WebSocket message
      // If no WebSocket message arrives within 10 seconds, assume success (fallback)
      const pipelineTimeout = setTimeout(() => {
        // If action is still saving, complete it optimistically
        const currentAction = store.actionStatus;
        if (currentAction.actionId === actionId && currentAction.state === 'saving') {
          store.completeAction(true);
          store.setConnectionState('embeddingPipeline', 'connected');
        }
      }, 10000);
      
      // Store timeout ref to clear if we get WebSocket update
      if (!window.pipelineTimeouts) window.pipelineTimeouts = {};
      window.pipelineTimeouts[actionId] = pipelineTimeout;
      
      return response.data;
    } catch (error) {
      handleError(error, 'CodeEditor - Update File');
      
      // Database save failed
      store.setConnectionState('database', 'error', error.message || 'Save failed');
      store.addError('error', error.message || 'Failed to save file', 'Database');
      store.completeAction(false, error.message || 'Failed to save file');
      
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

  // Update status bar when file changes
  useEffect(() => {
    if (name && editorRef.current) {
      const model = editorRef.current.getModel();
      const lineCount = model ? model.getLineCount() : 0;
      
      useStatusBarStore.getState().setFileStatus({
        path: path || name,
        name,
        language: language || 'plaintext',
        lineCount,
      });

      // Send status update via WebSocket
      if (websocketService.isConnected()) {
        websocketService.sendStatusUpdate({
          file: {
            path: path || name,
            name,
            language: language || 'plaintext',
            lineCount,
          },
        });
      }
    }

    return () => {
      useStatusBarStore.getState().clearFileStatus();
    };
  }, [name, path, language]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const selection = editor.getSelection();
    const model = editor.getModel();

    if (!selection || !model) return;

    const line = selection.positionLineNumber;
    const column = selection.positionColumn;
    const selectionLength = model.getValueInRange(selection).length;

    const cursorStatus = {
      line,
      column,
      selectionLength,
    };

    // Update status bar
    useStatusBarStore.getState().setCursorStatus(cursorStatus);

    // Debounce WebSocket updates (only send every 500ms)
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    cursorUpdateTimeoutRef.current = setTimeout(() => {
      if (websocketService.isConnected()) {
        websocketService.sendStatusUpdate({
          cursor: cursorStatus,
        });
      }
    }, 500);
  }, []);

  function handleEditorChange(value) {
    const v = value || '';
    setContentState(v);
    contentStateRef.current = v;
    setActiveFile(prev => ({ ...prev, content: v }));
    
    // Update line count in status bar
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        useStatusBarStore.getState().setFileStatus((prev) => ({
          ...prev,
          lineCount,
        }));
      }
    }
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
          
          // Set up cursor position tracking
          editor.onDidChangeCursorPosition(() => {
            handleCursorChange();
          });

          editor.onDidChangeCursorSelection(() => {
            handleCursorChange();
          });

          // Initial cursor position
          handleCursorChange();
        }}
        loading={<LoadingAnimation />}
      />
    </div>
  );
}

export default CodeEditor;
