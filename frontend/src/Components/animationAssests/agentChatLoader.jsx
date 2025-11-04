import React, { useRef } from "react";
import "./AgentChatLoader.css";

function AgentChatLoader() {
  const dotsRefs = useRef([]);

  const setDotsRef = (el, index) => {
    dotsRefs.current[index] = el;
  };
  
  return (
    <div className="agent-chat-loader">
      <div className="dot" ref={el => setDotsRef(el, 0)}></div>
      <div className="dot" ref={el => setDotsRef(el, 1)}></div>
      <div className="dot" ref={el => setDotsRef(el, 2)}></div>
    </div>
  );
}

export default AgentChatLoader;
