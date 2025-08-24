import React, { useRef, useEffect, useState } from 'react';
import './LandingPageE.css';
import { MdOutlineKeyboardArrowDown } from "react-icons/md";

function LandingPageE() {
  const sectionRef = useRef();
  const [selectedModel, setSelectedModel] = useState('Kira');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

  const models = ['Kira', 'Claude', 'GPT-4', 'PaLM 2'];

  return (
    <section className="lp-e-section" ref={sectionRef}>
      <div className='lp-e-kira-animation-wrapper'>
        <div className='cursor2-wrapper'>
          <img className='cursor2' src='/public/images/cursor2.svg' alt="cursor" />
        </div>

        <div className='lp-e-kira-wrapper'>
          <div className='lp-e-kira-content-wrapper'>
            <div className='lp-e-kira-nav-wrapper'>
              <div className='kira-models-dropdown' ref={dropdownRef}>
                <div
                  className='kira-model-row'
                  onClick={() => setDropdownOpen(prev => !prev)}
                >
                  <img
                    className='kira-claude-logo'
                    src='/public/images/kira-images/claude.svg'
                    alt="model logo"
                  />
                  <h1 className='kira-model-name'>{selectedModel}</h1>
                  <MdOutlineKeyboardArrowDown size={20} />
                </div>
                {dropdownOpen && (
                  <ul className="kira-model-options">
                    {models.map(model => (
                      <li
                        key={model}
                        className={`kira-model-option ${model === selectedModel ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedModel(model);
                          setDropdownOpen(false);
                        }}
                      >
                        {model}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="lp-e-kira-chat-wrapper">
              <div className="lp-e-chat-message user-message2">
                <p>Hi {selectedModel}! Can you help me write some code?</p>
              </div>
              <div className="lp-e-chat-message kira-message2">
                <p>Of course! What language are you working with?</p>
              </div>
              <div className="lp-e-chat-message user-message2">
                <p>React, I'm trying to animate a slider.</p>
              </div>
              <div className="lp-e-chat-message kira-message2">
                <p>Awesome! I can generate a mock component for that animation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingPageE;
