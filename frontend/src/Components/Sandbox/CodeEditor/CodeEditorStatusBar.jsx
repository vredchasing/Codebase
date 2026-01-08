import React from 'react';
import useStatusBarStore from '../../../stores/statusBarStore';
import { StatusBarErrorWidget } from './StatusBarErrorWidget';
import { StatusBarActionStatus } from './StatusBarActionStatus';
import { VscError } from "react-icons/vsc";
import { BiError } from "react-icons/bi";
import { TbCheck } from "react-icons/tb";
import './CodeEditorStatusBar.css';

export function CodeEditorStatusBar() {
  const connections = useStatusBarStore((state) => state.connections);
  const cursor = useStatusBarStore((state) => state.cursor);
  const errors = useStatusBarStore((state) => state.errors);

  const getConnectionIndicator = (conn) => {
    switch (conn.state) {
      case 'connected':
        return <span className="status-indicator status-connected" title={`${conn.name}: Connected`}>●</span>;
      case 'connecting':
        return <span className="status-indicator status-connecting" title={`${conn.name}: Connecting`}>○</span>;
      case 'disconnected':
        return <span className="status-indicator status-disconnected" title={`${conn.name}: Disconnected`}>○</span>;
      case 'error':
        return <span className="status-indicator status-error" title={`${conn.name}: ${conn.error || 'Error'}`}>●</span>;
      default:
        return null;
    }
  };

  const formatCursorInfo = () => {
    if (!cursor) return null;
    
    const parts = [];
    if (cursor.line !== undefined) parts.push(`Ln ${cursor.line}`);
    if (cursor.column !== undefined) parts.push(`Col ${cursor.column}`);
    if (cursor.selectionLength > 0) {
      parts.push(`${cursor.selectionLength} selected`);
    }
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Calculate sync error count (errors from WebSocket, Sync, or Sync Service)
  const syncErrorCount = errors.filter(
    (e) => e.severity === 'error' && 
    (e.source === 'WebSocket' || e.source === 'Sync' || e.source === 'Sync Service')
  ).length;

  // Calculate other error count (all other errors)
  const otherErrorCount = errors.filter(
    (e) => e.severity === 'error' && 
    e.source !== 'WebSocket' && e.source !== 'Sync' && e.source !== 'Sync Service'
  ).length;

  return (
    <div className="code-editor-status-bar">
      {/* Left Section: Connections, Errors, Action Status */}
      <div className="status-bar-left">
        {/* Connection Indicators */}
        <div className="connection-indicators">
          {getConnectionIndicator(connections.websocket)}
        </div>
        <div className='error-logger'>
          <div className="error-logger-icon" title="Sync issues">
            <VscError color='#818181ff' size={15}/>
            <span className="error-logger-count">{syncErrorCount}</span>
          </div>
          <div className="error-logger-icon" title="Other issues">
            <BiError color='#818181ff' size={16}/>
            <span className="error-logger-count">{otherErrorCount}</span>
          </div>
        </div>
        {/* Error Widget */}
        <StatusBarErrorWidget />

        {/* Action Status (spinner/checkmark/X) */}
        <StatusBarActionStatus />
      </div>

      {/* Right Section: Editor Info (Cursor Position) */}
      <div className="status-bar-right">
        {cursor && (
          <span className="status-item cursor-info">
            {formatCursorInfo()}
          </span>
        )}
      </div>
    </div>
  );
}
