import React, { useState } from "react";
import './ProjectCreator.css'
import { api, API_ENDPOINTS, handleError, validateForm, VALIDATION_RULES } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowDropdown } from "react-icons/io";

function ProjectCreator() {
  const navigate = useNavigate();
  const [projectInfo, setProjectInfo] = useState({
    name: '',
    description: '',
    privacy: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setProjectInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }

  async function handleCreateProject() {
    // Validate form
    const validation = validateForm(projectInfo, {
      name: {
        required: true,
        minLength: 1,
        maxLength: 100,
      },
      description: {
        required: false,
        maxLength: 500,
      },
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await api.post(API_ENDPOINTS.PROJECTS.CREATE, {
        name: projectInfo.name.trim(),
        description: projectInfo.description.trim(),
        privacy: projectInfo.privacy || 'private',
      });

      if (response.data?.project?.id) {
        // Redirect to workspace
        navigate(`/workspace/${response.data.project.id}`);
      }
    } catch (error) {
      const errorMessage = handleError(error, 'ProjectCreator', (msg) => {
        setErrors({ submit: msg });
      });
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="project-creator-section-wrapper">
      <div className="project-creator-section-inner">
        <div className="create-project-header">
          <h2 className="create-project-title">Create a new project or file</h2>
          <p className="create-project-title-2">
            Everything you build is safely stored and managed in the cloud. From collaborative editing to AI agents and project templates. Get the tools you need to move faster and more securely.
          </p>
        </div>

        <div className="project-form-main-wrapper">
          <div className="project-form-container">
            <div className="form-label-container">
              <div className="step-container">
                <label className="step">1</label>
              </div>
              <label className="form-label">General</label>
            </div>
            <div className="create-project-form-container">
              <span className="step-line"></span>
              <form className="create-project-form-1">
                <div className="custom-input-label">
                  <div className="create-project-owners-wrapper">
                    <label className="input-label">Owners</label>
                    <div className="selected-owners-container">
                      <div className="selected-owners">
                        <div className="selected-owners-avatar-container">
                          <img className="selected-owners-avatar" src="/public/images/background-images/background2.webp" alt="owner"/>
                        </div>
                        <div className="selected-owner-name">
                          vredchasing
                        </div>
                        <IoMdArrowDropdown />
                      </div>
                    </div>
                  </div>
                  <div className="create-project-name-wrapper">
                    <label className="input-label">Project / Directory name</label>
                    <div className="project-input-container">
                      <input
                        className="project-name-input"
                        name="name"
                        value={projectInfo.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="create-project-name-wrapper">
                  <label className="input-label">Description</label>
                  <input
                    className="project-name-input"
                    name="description"
                    value={projectInfo.description}
                    onChange={handleChange}
                  />
                </div>    
              </form>
            </div>
          </div>

          <div className="project-form-container">
            <div className="form-label-container">
              <div className="step-container">
                <label className="step">2</label>
              </div>
              <label className="form-label">Configuration</label>
            </div>
            <div className="create-project-form-container">
              <span className="step-line"></span>
              <form className="create-project-form-2">
                <div className="create-project-name-wrapper">
                  <label className="input-label-1a">
                    Starter Template
                    <label className="input-label-1b">Packaged starter templates</label>
                  </label>
                  <input className="project-name-input" />
                </div>
                <div className="create-project-name-wrapper">
                  <label className="input-label">Project Visibility</label>
                  <input
                    className="project-name-input"
                    name="privacy"
                    value={projectInfo.privacy}
                    onChange={handleChange}
                  />
                </div>
                <div className="create-project-name-wrapper">
                  <label className="input-label">License</label>
                  <input className="project-name-input" />
                </div>
              </form>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {errors.submit}
          </div>
        )}
        {errors.name && (
          <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {errors.name}
          </div>
        )}
        <div className="create-button-container" onClick={handleCreateProject}>
          <span className="create-button" style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? 'Creating...' : 'Confirm'}
          </span>
        </div>
      </div>
    </section>
  )
}

export default ProjectCreator;
