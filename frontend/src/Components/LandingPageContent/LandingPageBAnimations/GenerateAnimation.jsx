import { useState, useEffect } from 'react';
import { AiOutlineOpenAI } from "react-icons/ai";
import { RiClaudeFill } from "react-icons/ri";
import { RiGeminiFill } from "react-icons/ri";
import { FaMeta } from "react-icons/fa6";

import './generateAnimation.css';

const MODELS = [
  { icon: AiOutlineOpenAI, name: 'GPT-5' },
  { icon: RiClaudeFill, name: 'Claude Sonnet 4.5' },
  { icon: RiGeminiFill, name: 'Gemini 2.5 Pro' },
  { icon: FaMeta, name: 'Meta Llama 3.1 405b' }
];

export default function GenerateAnimation() {
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeoutId1;
    let timeoutId2;
    
    const cycleModels = () => {
      // Fade out current model
      setIsVisible(false);
      
      // After fade out completes, switch to next model and fade in
      timeoutId1 = setTimeout(() => {
        setCurrentModelIndex((prev) => (prev + 1) % MODELS.length);
        setIsVisible(true);
        
        // Schedule next cycle after 2 seconds of being visible
        timeoutId2 = setTimeout(cycleModels, 2000);
      }, 500); // Fade out duration
    };

    // Start first cycle after 2 seconds
    timeoutId2 = setTimeout(cycleModels, 2000);

    return () => {
      if (timeoutId1) clearTimeout(timeoutId1);
      if (timeoutId2) clearTimeout(timeoutId2);
    };
  }, []);

  const CurrentIcon = MODELS[currentModelIndex].icon;
  const currentModelName = MODELS[currentModelIndex].name;

  return (
    <div className='generate-animation-wrapper'>
      <div className={`generate-model-container ${isVisible ? 'visible' : 'hidden'}`}>
        <div className="generate-model-icon">
          <CurrentIcon size={100} />
        </div>
        <div className="generate-model-name">
          {currentModelName}
        </div>
      </div>
    </div>
  );
}
