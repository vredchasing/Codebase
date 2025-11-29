import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Retrieval Scope Context
 * Manages the scope configuration for RAG retrieval (projects, files, etc.)
 */

const RetrievalScopeContext = createContext();

export const useRetrievalScope = () => {
  const context = useContext(RetrievalScopeContext);
  if (!context) {
    throw new Error('useRetrievalScope must be used within RetrievalScopeProvider');
  }
  return context;
};

export const RetrievalScopeProvider = ({ children }) => {
  const STORAGE_KEY = 'agent_retrieval_scope';

  // Load initial state from localStorage
  const loadInitialState = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading retrieval scope from localStorage:', error);
    }
    // Default: empty scope (search all projects)
    return {
      projectIds: [], // Empty array means search all projects
      fileIds: [],     // Empty array means search all files
      enabled: true,   // Whether retrieval is enabled
    };
  };

  const [scope, setScope] = useState(loadInitialState);

  // Save to localStorage whenever scope changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
    } catch (error) {
      console.error('Error saving retrieval scope to localStorage:', error);
    }
  }, [scope]);

  const addProject = (projectId) => {
    setScope((prev) => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds
        : [...prev.projectIds, projectId],
    }));
  };

  const removeProject = (projectId) => {
    setScope((prev) => ({
      ...prev,
      projectIds: prev.projectIds.filter((id) => id !== projectId),
    }));
  };

  const addFile = (fileId) => {
    setScope((prev) => ({
      ...prev,
      fileIds: prev.fileIds.includes(fileId)
        ? prev.fileIds
        : [...prev.fileIds, fileId],
    }));
  };

  const removeFile = (fileId) => {
    setScope((prev) => ({
      ...prev,
      fileIds: prev.fileIds.filter((id) => id !== fileId),
    }));
  };

  const clearScope = () => {
    setScope({
      projectIds: [],
      fileIds: [],
      enabled: true,
    });
  };

  const toggleRetrieval = () => {
    setScope((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  // Get retrieval options for backend API
  const getRetrievalOptions = () => {
    if (!scope.enabled) {
      return null; // Disable retrieval
    }

    const options = {
      topK: 10,
      similarityThreshold: 0.7,
    };

    // If specific projects are selected, filter by them
    if (scope.projectIds.length > 0) {
      // Pass array of project IDs (backend supports arrays)
      options.projectId = scope.projectIds.length === 1 
        ? scope.projectIds[0] 
        : scope.projectIds;
    }

    // If specific files are selected, filter by them
    if (scope.fileIds.length > 0) {
      // Pass array of file IDs (backend supports arrays)
      options.fileId = scope.fileIds.length === 1 
        ? scope.fileIds[0] 
        : scope.fileIds;
    }

    return options;
  };

  const value = {
    scope,
    addProject,
    removeProject,
    addFile,
    removeFile,
    clearScope,
    toggleRetrieval,
    getRetrievalOptions,
  };

  return (
    <RetrievalScopeContext.Provider value={value}>
      {children}
    </RetrievalScopeContext.Provider>
  );
};

