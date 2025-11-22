import { useState, useEffect, useRef } from 'react';
import './planAnimation.css';
import { RiClaudeFill } from "react-icons/ri";
import { BsCardImage } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { GoArrowUp } from "react-icons/go";

const QUERY_TEXT = "How can I implement user authentication in my React app?";
const MOCK_RESPONSE = "I'll help you implement user authentication. Based on your codebase, I can see you're using React with a Node.js backend. Here's a step-by-step plan:\n\n1. Set up authentication routes in your backend\n2. Create login and signup components\n3. Implement JWT token management\n4. Add protected routes middleware\n5. Create an auth context for state management";

const THINKING_MESSAGES = [
  "Thinking...",
  "Reading files",
  "Analyzing codebase",
  "Planning next steps"
];

export default function PlanAnimation() {
  const [animationPhase, setAnimationPhase] = useState('typing'); // 'typing', 'thinking', 'response'
  const [typedText, setTypedText] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [shownThinkingMessages, setShownThinkingMessages] = useState([]);
  const textareaRef = useRef(null);

  const [isPaused, setIsPaused] = useState(false);

  // Generate organic typing delay with variance, pauses, and speed changes
  const getTypingDelay = (char, index, text) => {
    // Base delay - faster overall
    let baseDelay = 20 + Math.random() * 30; // 20-50ms base
    
    // Spaces are faster
    if (char === ' ') {
      baseDelay = 10 + Math.random() * 15; // 10-25ms
    }
    // Punctuation has pause
    else if (char === '.' || char === ',' || char === '?' || char === '!') {
      baseDelay = 80 + Math.random() * 40; // 80-120ms
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), baseDelay);
    }
    
    // Occasional longer pauses (less frequent, every 15-25 characters)
    if (index > 0 && index % Math.floor(15 + Math.random() * 10) === 0) {
      const pauseDuration = 150 + Math.random() * 100; // 150-250ms pause
      baseDelay += pauseDuration;
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), pauseDuration);
    }
    
    return baseDelay;
  };

  useEffect(() => {
    if (animationPhase === 'typing') {
      setTypedText('');
      setShownThinkingMessages([]);
      setShowResponse(false);
      setResponseText('');
      
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < QUERY_TEXT.length) {
          setTypedText(QUERY_TEXT.slice(0, currentIndex + 1));
          currentIndex++;
          
          const delay = getTypingDelay(QUERY_TEXT[currentIndex - 1], currentIndex - 1, QUERY_TEXT);
          setTimeout(typeNextChar, delay);
        } else {
          // Wait a bit before moving to next phase
          setTimeout(() => {
            setShowInput(false);
            setTimeout(() => {
              setAnimationPhase('thinking');
            }, 500);
          }, 1000);
        }
      };
      
      typeNextChar();

      return () => {}; // Cleanup handled by recursive timeout
    }
  }, [animationPhase]);

  useEffect(() => {
    if (animationPhase === 'thinking') {
      setShownThinkingMessages([]);
      
      // Add messages one by one, stacking them
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        if (messageIndex < THINKING_MESSAGES.length) {
          setShownThinkingMessages((prev) => [...prev, THINKING_MESSAGES[messageIndex]]);
          messageIndex++;
        } else {
          clearInterval(messageInterval);
        }
      }, 800); // Add new message every 800ms

      // Show thinking for longer to accommodate more messages
      const thinkingTimeout = setTimeout(() => {
        clearInterval(messageInterval);
        setAnimationPhase('response');
      }, THINKING_MESSAGES.length * 800 + 500); // Time for all messages + buffer

      return () => {
        clearInterval(messageInterval);
        clearTimeout(thinkingTimeout);
      };
    }
  }, [animationPhase]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [typedText]);

  useEffect(() => {
    if (animationPhase === 'response') {
      setShowResponse(true);
      setResponseText('');
      let currentIndex = 0;
      // Response generation - faster speed
      const typeResponseChar = () => {
        if (currentIndex < MOCK_RESPONSE.length) {
          setResponseText(MOCK_RESPONSE.slice(0, currentIndex + 1));
          currentIndex++;
          
          // Variable delay: 8-20ms base (much faster)
          let delay = 8 + Math.random() * 12; // 8-20ms base
          
          // Small pause after periods or newlines
          if (MOCK_RESPONSE[currentIndex - 1] === '.' || MOCK_RESPONSE[currentIndex - 1] === '\n') {
            delay += 20 + Math.random() * 20; // 20-40ms extra pause
          }
          
          setTimeout(typeResponseChar, delay);
        } else {
          // Wait a bit before restarting the animation
          setTimeout(() => {
            setShowInput(true);
            setShowResponse(false);
            setAnimationPhase('typing');
          }, 3000); // Wait 3 seconds before restarting
        }
      };
      
      typeResponseChar();

      return () => {}; // Cleanup handled by recursive timeout
    }
  }, [animationPhase]);

  
  return (
    <div className='plan-animation-wrapper'>
      {showInput && (
        <div className="plan-chat-input-wrapper">
          <form className="plan-chat-input-inner">
            <div className="plan-chat-top">
              <div className="plan-chat-top-inner">
                <div className="plan-add-context-container">
                  <span className="plan-add-context-button">@</span>
                </div>
              </div>
            </div>

            <div className="plan-input-container">
              <textarea
                ref={textareaRef}
                className="plan-chat-input"
                placeholder="Plan, search, build anything"
                value={typedText}
                readOnly
                rows={1}
              />
              {animationPhase === 'typing' && (
                <div className="plan-input-cursor-wrapper" data-text={typedText}>
                  <span className={`plan-input-cursor ${isPaused ? 'blinking' : ''}`}>|</span>
                </div>
              )}
            </div>

            <div className="plan-chat-bottom">
              <div className="plan-chat-bottom-inner">
                <div className="plan-current-mode-container">
                  <span className="plan-current-mode">
                    <RiClaudeFill /> Agent
                    <MdOutlineKeyboardArrowDown size={14} />
                  </span>
                </div>
                <div className="plan-chat-bottom-right">
                  <div className="plan-upload-photo-container">
                    <BsCardImage color="gray" />
                  </div>
                  <div className="plan-send-message-container">
                    <GoArrowUp size={15} color="#141414f2" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {animationPhase === 'thinking' && (
        <div className="plan-thinking-indicator">
          <div className="plan-thinking-messages-container">
            {THINKING_MESSAGES.map((message, index) => (
              <div 
                key={index} 
                className={`plan-thinking-text ${shownThinkingMessages.includes(message) ? 'visible' : 'hidden'}`}
              >
                {message}
              </div>
            ))}
          </div>
        </div>
      )}

      {showResponse && (
        <div className="plan-response-wrapper">
          <div className="plan-response-bubble">
            {responseText}
          </div>
        </div>
      )}
    </div>
  );
}
