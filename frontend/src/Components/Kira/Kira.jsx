import './Kira.css';
import axios from 'axios';
import { IoMicOutline } from "react-icons/io5";
import { AiOutlinePlus } from "react-icons/ai";
import { useState, useEffect } from 'react';

export default function Kira() {
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const sendMessage = async (message) => {
    setChatHistory(prev => [...prev, { user: 'User', message }]);
    setUserInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:11434/api/chat', {
        model: 'qwen3:4b',
        messages: [
          ...chatHistory.map(chat => ({
            role: chat.user.toLowerCase(),
            content: chat.message
          })),
          { role: 'user', content: message }
        ],
        stream: false
      });

      const reply = response.data.message?.content ?? 'No response content.';
      setChatHistory(prev => [...prev, { user: 'Kira', message: reply }]);
    } catch (err) {
      setError('Error during chat: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => setUserInput(e.target.value);
  const handleSubmit = e => {
    e.preventDefault();
    if (userInput.trim()) sendMessage(userInput);
  };

  return (
    <section className='kira-section-wrapper'>
      <img className='kira-voice' src='/images/voice2.gif' alt="Kira Voice" />
      <section className='kira-section'>
        <div className='lp-d-chat-container'>
          <div className="lp-d-chat-history">
            {chatHistory.map((chat, i) => (
              <div
                key={i}
                className={`lp-d-chat-message ${chat.user === 'Kira' ? 'kira-message' : 'user-message'}`}
              >
                {chat.message}
              </div>
            ))}
            {loading && <div className="loading-message">Kira is typing...</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
        <div className='lp-d-chat-input-wrapper'>
          <div className='lp-d-chat-input-container'>
            <AiOutlinePlus size={25} opacity={0.85} />
            <form onSubmit={handleSubmit}>
              <input
                className='lp-d-chat-input'
                placeholder='Type a message...'
                value={userInput}
                onChange={handleInputChange}
              />
            </form>
            <IoMicOutline size={25} opacity={0.85} />
          </div>
        </div>
      </section>
    </section>
  );
}
