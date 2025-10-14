import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ data }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to the project details page using the project's ID
    navigate(`/workspace/${data.id}`);
  };

  return (
    <div className="dashboard-project-card" onClick={handleClick}>
      <div className="last-modified-date-container">
        <h2 className="last-modified-date">10/7/2025</h2>
      </div>
      <div className="project-file-info-container">
        <div className="projects-file-name-container">
          <h2 className="project-file-name">{data.name}</h2>
        </div>
        <div className="project-collaborators-container">
          <div className="project-collaborators-avatar-container">
            <img
              className="project-collaborator-avatar"
              src="/public/images/background-images/background2.webp"
              alt="Collaborator Avatar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
