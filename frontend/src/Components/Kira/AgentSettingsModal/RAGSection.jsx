import React, { useState, useEffect } from 'react';
import { useRetrievalScope } from '../../../contexts/RetrievalScopeContext';
import { api, API_ENDPOINTS, handleError } from '../../../utils';
import { MdDelete } from 'react-icons/md';

function RAGSection() {
  const {
    scope,
    addProject,
    removeProject,
    addFile,
    removeFile,
    clearScope,
    toggleRetrieval,
  } = useRetrievalScope();

  const [projects, setProjects] = useState([]);
  const [selectedProjectFiles, setSelectedProjectFiles] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedProjectForFiles, setSelectedProjectForFiles] = useState(null);

  // Fetch user projects
  useEffect(() => {
    async function fetchProjects() {
      setLoadingProjects(true);
      try {
        const response = await api.get(API_ENDPOINTS.DASHBOARD.GET_PROJECTS);
        setProjects(response.data || []);
      } catch (err) {
        handleError(err, 'RAGSection - Fetch Projects');
      } finally {
        setLoadingProjects(false);
      }
    }

    fetchProjects();
  }, []);

  // Fetch files for selected project
  const fetchFilesForProject = async (projectId) => {
    if (!projectId) return;

    setLoadingFiles(true);
    setSelectedProjectForFiles(projectId);
    try {
      const response = await api.get(API_ENDPOINTS.PROJECTS.GET_PROJECT(projectId));
      const files = flattenFileTree(response.data || []);
      setSelectedProjectFiles(files);
    } catch (err) {
      handleError(err, 'RAGSection - Fetch Files');
      setSelectedProjectFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Helper to flatten file tree
  const flattenFileTree = (nodes, result = []) => {
    for (const node of nodes) {
      if (node.node_type === 'file') {
        result.push({
          id: node.id,
          name: node.name,
          project_id: node.project_id,
        });
      }
      if (node.children && node.children.length > 0) {
        flattenFileTree(node.children, result);
      }
    }
    return result;
  };

  return (
    <div className="settings-section-content">
      {/* Enable/Disable Toggle */}
      <div className="agent-settings-section">
        <div className="agent-settings-section-header">
          <label className="agent-settings-toggle-label">
            <input
              type="checkbox"
              checked={scope.enabled}
              onChange={toggleRetrieval}
              className="agent-settings-toggle"
            />
            <span>Enable RAG Retrieval</span>
          </label>
        </div>
        <p className="agent-settings-description">
          When enabled, the agent will search your codebase to provide context-aware responses.
        </p>
      </div>

      {scope.enabled && (
        <>
          {/* Projects Section */}
          <div className="agent-settings-section">
            <div className="agent-settings-section-header">
              <h3>Projects</h3>
              <button
                className="agent-settings-clear-btn"
                onClick={clearScope}
                disabled={scope.projectIds.length === 0 && scope.fileIds.length === 0}
              >
                Clear All
              </button>
            </div>
            <p className="agent-settings-description">
              {scope.projectIds.length === 0
                ? 'Searching all projects. Select specific projects to narrow the scope.'
                : `Searching ${scope.projectIds.length} project(s).`}
            </p>

            <div className="agent-settings-list">
              {loadingProjects ? (
                <div className="agent-settings-loading">Loading projects...</div>
              ) : (
                projects.map((project) => {
                  const isSelected = scope.projectIds.includes(project.id);
                  return (
                    <div
                      key={project.id}
                      className={`agent-settings-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          removeProject(project.id);
                        } else {
                          addProject(project.id);
                        }
                      }}
                    >
                      <div className="agent-settings-item-content">
                        <span className="agent-settings-item-name">{project.name}</span>
                        {project.description && (
                          <span className="agent-settings-item-desc">{project.description}</span>
                        )}
                      </div>
                      {isSelected && (
                        <button
                          className="agent-settings-item-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProject(project.id);
                          }}
                        >
                          <MdDelete size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Files Section */}
          <div className="agent-settings-section">
            <div className="agent-settings-section-header">
              <h3>Files</h3>
            </div>
            <p className="agent-settings-description">
              {scope.fileIds.length === 0
                ? 'No specific files selected. Search all files in selected projects.'
                : `Searching ${scope.fileIds.length} file(s).`}
            </p>

            {/* Project selector for files */}
            <div className="agent-settings-file-selector">
              <select
                className="agent-settings-project-select"
                value={selectedProjectForFiles || ''}
                onChange={(e) => {
                  const projectId = e.target.value ? Number(e.target.value) : null;
                  if (projectId) {
                    fetchFilesForProject(projectId);
                  } else {
                    setSelectedProjectFiles([]);
                    setSelectedProjectForFiles(null);
                  }
                }}
              >
                <option value="">Select a project to view files...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Files list */}
            {selectedProjectForFiles && (
              <div className="agent-settings-list">
                {loadingFiles ? (
                  <div className="agent-settings-loading">Loading files...</div>
                ) : selectedProjectFiles.length === 0 ? (
                  <div className="agent-settings-empty">No files found in this project.</div>
                ) : (
                  selectedProjectFiles.map((file) => {
                    const isSelected = scope.fileIds.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        className={`agent-settings-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            removeFile(file.id);
                          } else {
                            addFile(file.id);
                          }
                        }}
                      >
                        <div className="agent-settings-item-content">
                          <span className="agent-settings-item-name">{file.name}</span>
                        </div>
                        {isSelected && (
                          <button
                            className="agent-settings-item-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(file.id);
                            }}
                          >
                            <MdDelete size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected files summary */}
            {scope.fileIds.length > 0 && (
              <div className="agent-settings-selected-summary">
                <strong>Selected Files ({scope.fileIds.length}):</strong>
                <div className="agent-settings-selected-items">
                  {scope.fileIds.map((fileId) => {
                    const file = selectedProjectFiles.find((f) => f.id === fileId);
                    return file ? (
                      <span key={fileId} className="agent-settings-selected-tag">
                        {file.name}
                        <button
                          onClick={() => removeFile(fileId)}
                          className="agent-settings-tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RAGSection;








