import React, { useState } from 'react';
import useStatusBarStore from '../../../stores/statusBarStore';
import './StatusBarErrorWidget.css';

/**
 * VS Code style error widget
 * Displays error and warning counts with icons
 * Click to show error list
 */
export function StatusBarErrorWidget() {
  const errors = useStatusBarStore((state) => state.errors);
  const [isOpen, setIsOpen] = useState(false);

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  const hasErrors = errorCount > 0 || warningCount > 0;

  if (!hasErrors) {
    return null;
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="status-bar-error-widget">
      <div className="error-widget-icons" onClick={toggleOpen}>
        {errorCount > 0 && (
          <span className="error-icon" title={`${errorCount} error${errorCount !== 1 ? 's' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7 4v4h2V4H7zm0 5v2h2V9H7z" />
            </svg>
            <span className="error-count">{errorCount}</span>
          </span>
        )}
        {warningCount > 0 && (
          <span className="warning-icon" title={`${warningCount} warning${warningCount !== 1 ? 's' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L1 14h14L8 1zm0 3.5L12.5 13H3.5L8 4.5zM8 9v2h1V9H8zm0-1h1v1H8V8z" />
            </svg>
            <span className="warning-count">{warningCount}</span>
          </span>
        )}
      </div>

      {isOpen && (
        <>
          <div className="error-widget-overlay" onClick={toggleOpen} />
          <div className="error-widget-panel">
            <div className="error-widget-header">
              <span className="error-widget-title">Problems</span>
              <button className="error-widget-close" onClick={toggleOpen}>
                ×
              </button>
            </div>
            <div className="error-widget-list">
              {errors.length === 0 ? (
                <div className="error-widget-empty">No problems detected</div>
              ) : (
                errors.map((error) => (
                  <div key={error.id} className={`error-widget-item error-widget-item-${error.severity}`}>
                    <div className="error-widget-item-icon">
                      {error.severity === 'error' ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7 4v4h2V4H7zm0 5v2h2V9H7z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1L1 14h14L8 1zm0 3.5L12.5 13H3.5L8 4.5zM8 9v2h1V9H8zm0-1h1v1H8V8z" />
                        </svg>
                      )}
                    </div>
                    <div className="error-widget-item-content">
                      <div className="error-widget-item-message">{error.message}</div>
                      <div className="error-widget-item-meta">
                        <span className="error-widget-item-source">{error.source}</span>
                        <span className="error-widget-item-time">{formatTime(error.timestamp)}</span>
                      </div>
                      {error.details && (
                        <div className="error-widget-item-details">{error.details}</div>
                      )}
                    </div>
                    <button
                      className="error-widget-item-remove"
                      onClick={() => useStatusBarStore.getState().removeError(error.id)}
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}



