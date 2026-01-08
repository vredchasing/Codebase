import React from 'react';
import useStatusBarStore from '../../../stores/statusBarStore';
import { TbCheck } from "react-icons/tb";
import LoadingAnimation from '../../animationAssests/loadingAnimation';
import './StatusBarActionStatus.css';

/**
 * Action status indicator
 * Shows spinner when saving, checkmark on success, X on error
 */
export function StatusBarActionStatus() {
  const actionStatus = useStatusBarStore((state) => state.actionStatus);

  if (actionStatus.state === 'idle') {
    return null;
  }

  return (
    <div className="status-bar-action-status">
      {actionStatus.state === 'saving' && (
        <div className="action-status-spinner" title="Saving...">
          <LoadingAnimation />
        </div>
      )}
      {actionStatus.state === 'success' && (
        <div className="action-status-success" title="Saved successfully">
          <TbCheck size={14} />
        </div>
      )}
      {actionStatus.state === 'error' && (
        <div className="action-status-error" title={actionStatus.error || 'Save failed'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1L1 7L7 13M13 1L7 7L13 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}


