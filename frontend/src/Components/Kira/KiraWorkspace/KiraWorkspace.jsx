import React, { useState, useEffect, useCallback } from "react";
import './KiraWorkspace.css';
import { RiClaudeFill } from "react-icons/ri";
import { BsCardImage } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { RiAddFill } from "react-icons/ri";
import { MdHistory } from "react-icons/md";
import { GoArrowUp } from "react-icons/go";
import { CiSettings } from "react-icons/ci";
import { API_ENDPOINTS, handleError, MESSAGE_ROLES } from '../../../utils';
import { useRetrievalScope } from '../../../contexts/RetrievalScopeContext';
import AgentSettingsModal from '../AgentSettingsModal/AgentSettingsModal';
import {
  getUserChatSessions,
  getChatHistory,
  transformMessageToComponent,
} from '../../../services/chatService';

import AgentChatLoader from "../../animationAssests/agentChatLoader";

const SESSION_STORAGE_KEY = 'kira_current_session_id';

function KiraWorkspace() {
  const [messages, setMessages] = useState([]); // chat history
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null); // Current active session ID
  const [chatSessions, setChatSessions] = useState([]); // List of all sessions
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const { getRetrievalOptions } = useRetrievalScope();

  // Load chat history for a session
  const loadChatHistory = useCallback(async (sessionIdToLoad) => {
    if (!sessionIdToLoad) return;
    
    setLoadingHistory(true);
    try {
      const history = await getChatHistory(sessionIdToLoad);
      const transformedMessages = history.map(transformMessageToComponent);
      setMessages(transformedMessages);
    } catch (err) {
      handleError(err, 'KiraWorkspace - Load History');
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch all chat sessions
  const fetchChatSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const sessions = await getUserChatSessions({ limit: 20 });
      setChatSessions(sessions);
      
      // If we have a current sessionId, verify it still exists
      const currentSessionId = sessionId || localStorage.getItem(SESSION_STORAGE_KEY);
      if (currentSessionId) {
        const sessionExists = sessions.some(s => s.session_id === currentSessionId);
        if (!sessionExists) {
          // Session no longer exists, clear it
          setSessionId(null);
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setMessages([]);
        }
      }
    } catch (err) {
      handleError(err, 'KiraWorkspace - Fetch Sessions');
      setChatSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [sessionId]);

  // Handle switching to a different session
  const handleSessionClick = useCallback(async (clickedSessionId) => {
    if (clickedSessionId === sessionId) return; // Already on this session
    
    setSessionId(clickedSessionId);
    localStorage.setItem(SESSION_STORAGE_KEY, clickedSessionId);
    await loadChatHistory(clickedSessionId);
  }, [sessionId, loadChatHistory]);

  // Handle creating a new chat
  const handleNewChat = useCallback(() => {
    setSessionId(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setMessages([]);
  }, []);

  // Get session title for display
  const getSessionTitle = useCallback((session) => {
    if (session.topic) return session.topic;
    // Generate a title from the first message or use date
    const date = new Date(session.started_at);
    return `Chat ${date.toLocaleDateString()}`;
  }, []);

  // Load sessions and current session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    // Fetch sessions first, then check if saved session exists
    const initializeSessions = async () => {
      try {
        const sessions = await getUserChatSessions({ limit: 20 });
        setChatSessions(sessions);
        
        // If we have a saved session and it exists in the list, load it
        if (savedSessionId) {
          const sessionExists = sessions.some(s => s.session_id === savedSessionId);
          if (sessionExists) {
            setSessionId(savedSessionId);
            await loadChatHistory(savedSessionId);
          } else {
            // Session doesn't exist, clear it
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (err) {
        handleError(err, 'KiraWorkspace - Initialize Sessions');
      }
    };
    
    initializeSessions();
  }, [loadChatHistory]); // Include loadChatHistory in dependencies

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: MESSAGE_ROLES.USER, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input.trim();
    setInput("");
    setLoading(true);

    try {
      // Get retrieval scope options
      const retrievalOptions = getRetrievalOptions();
      
      // streaming request to backend (sessionId will be created if not provided)
      const res = await fetch(API_ENDPOINTS.AGENT.STREAM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          retrievalOptions: retrievalOptions,
          sessionId: sessionId, // Send current sessionId (or null for new session)
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("Response body is null");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = "";
      const streamMessage = { role: MESSAGE_ROLES.ASSISTANT, content: "" };
      setMessages((prev) => [...prev, streamMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiMessage += chunk;
        
        // Check if this chunk contains the SESSION_ID marker
        const sessionIdMatch = aiMessage.match(/\[SESSION_ID:([^\]]+)\]/);
        if (sessionIdMatch) {
          const newSessionId = sessionIdMatch[1];
          // Remove the SESSION_ID marker from the message
          aiMessage = aiMessage.replace(/\[SESSION_ID:[^\]]+\]/, '').trim();
          
          // Update sessionId if it's new
          if (newSessionId && newSessionId !== sessionId) {
            setSessionId(newSessionId);
            localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
            // Refresh sessions list to include the new one
            fetchChatSessions();
          }
        }
        
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiMessage;
          return updated;
        });
      }
    } catch (err) {
      const errorMessage = handleError(err, 'KiraWorkspace');
      setMessages((prev) => [
        ...prev,
        { 
          role: MESSAGE_ROLES.SYSTEM, 
          content: errorMessage || "Error fetching response. Please try again." 
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <section className="kira-workspace-wrapper">
      <div className="kira-workspace-nav-wrapper">
        <div className="kira-workspace-nav-inner">
          <div className="kira-workspace-nav-left">
            <div className="chat-sessions-list">
              {!sessionId && chatSessions.length === 0 && (
                <span 
                  className={`agent-nav-tab ${!sessionId ? 'active' : ''}`}
                  onClick={handleNewChat}
                >
                  New Chat
                </span>
              )}
              {chatSessions.map((session) => (
                <span
                  key={session.session_id}
                  className={`agent-nav-tab ${session.session_id === sessionId ? 'active' : ''}`}
                  onClick={() => handleSessionClick(session.session_id)}
                  title={getSessionTitle(session)}
                >
                  {getSessionTitle(session)}
                </span>
              ))}
              {sessionId && (
                <span 
                  className="agent-nav-tab"
                  onClick={handleNewChat}
                >
                  + New Chat
                </span>
              )}
            </div>
          </div>
          <div className="kira-workspace-nav-right">
            <span 
              className="agent-nav-option-container"
              onClick={handleNewChat}
              title="New Chat"
            >
              <RiAddFill />
            </span>
            <span 
              className="agent-nav-option-container"
              onClick={fetchChatSessions}
              title="Refresh Sessions"
            >
              <MdHistory />
            </span>
            <span 
              className="agent-nav-option-container"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            >
              <CiSettings></CiSettings>
            </span>
          </div>
        </div>
      </div>

      <div className={`kira-workspace-chat-history-main-wrapper ${isEmpty ? "collapsed" : "expanded"}`}>
        <div className="kira-workspace-chat-history-wrapper" data-lenis-prevent>
          <div className="kira-workspace-chat-history-container">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message-wrapper ${msg.role === "user" ? "user" : "assistant"}`}
              >
                <div className="chat-message-bubble">
                  {msg.content}
                  {loading && msg.role === "assistant" && i === messages.length - 1 && (
                    <AgentChatLoader></AgentChatLoader>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kira-workspace-chat-input-wrapper">
        <form className="kira-workspace-chat-input-inner" onSubmit={handleSend}>
          <div className="kira-workspace-chat-top">
            <div className="kira-workspace-chat-top-inner">
              <div className="add-context-container">
                <span className="add-context-button">@</span>
              </div>
            </div>
          </div>

          <input
            className="kira-workspace-chat-input"
            placeholder="Plan, search, build anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="kira-workspace-chat-bottom">
            <div className="kira-workspace-chat-bottom-inner">
              <div className="current-mode-container">
                <span className="current-mode">
                  <RiClaudeFill /> Agent
                  <MdOutlineKeyboardArrowDown size={14} />
                </span>
              </div>
              <div className="kira-workspace-chat-bottom-right">
                <div className="upload-photo-container">
                  <BsCardImage color="gray" />
                </div>
                <div className="send-message-container">
                  <GoArrowUp size={15} color="#141414f2-"></GoArrowUp>
                </div>

              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="kira-workspace-footer-wrapper">
        <div className="kira-workspace-footer-inner">
          <span className="past-chats-label"></span>
        </div>
      </div>

      <AgentSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </section>
  );
}

export default KiraWorkspace;
