import React, { useState } from "react";
import './KiraWorkspace.css';
import { RiClaudeFill } from "react-icons/ri";
import { BsCardImage } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { RiAddFill } from "react-icons/ri";
import { MdHistory } from "react-icons/md";

function KiraWorkspace() {
  const [messages, setMessages] = useState([]); // chat history
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // streaming request to backend
      const res = await fetch("http://localhost:3000/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = "";
      const streamMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, streamMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiMessage += decoder.decode(value);
        setMessages((prev) => {
          // update last message in place
          const updated = [...prev];
          updated[updated.length - 1].content = aiMessage;
          return updated;
        });
      }
    } catch (err) {
      console.error("Streaming error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Error fetching response" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="kira-workspace-wrapper">
      <div className="kira-workspace-nav-wrapper">
        <div className="kira-workspace-nav-inner">
          <div className="kira-workspace-nav-left">
            <span className="agent-nav-tab">New Chat</span>
          </div>
          <div className="kira-workspace-nav-right">
            <span className="agent-nav-option-container">
              <RiAddFill />
            </span>
            <span className="agent-nav-option-container">
              <MdHistory />
            </span>
          </div>
        </div>
      </div>

      <div className="kira-workspace-inner">
        <div className="kira-workspace-chat-history-wrapper">
          <div className='kira-workspace-chat-history-container'>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message-wrapper ${msg.role === "user" ? "user" : "assistant"}`}
              >
                <div className="chat-message-bubble">
                  {msg.content}
                  {loading && <div className="chat-message loading">Thinking...</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form className="kira-workspace-chat-input-wrapper" onSubmit={handleSend}>
          <div className="kira-workspace-chat-input-inner">
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
                    <span>
                      <BsCardImage color="gray" />
                    </span>
                  </div>
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
    </section>
  );
}

export default KiraWorkspace;
