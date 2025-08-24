import './LandingPageD.css'
import { IoMicOutline } from "react-icons/io5";
import { AiOutlinePlus } from "react-icons/ai";

export default function LandingPageD (){

  const chatModels = [
    { name: 'OpenAI', description: 'OpenAI\'s powerful language model' },
    { name: 'Claude', description: 'Anthropic\'s advanced AI assistant' },
  ]

  const mockChatHistory = [
    { user: 'User', message: 'Hello, Kira! How can you help me today?' },
    { user: 'Kira', message: 'Hi there! I can assist you with coding, debugging, and more. What do you need help with?' },
    { user: 'User', message: 'Can you show me how to create a React component?' },
    { user: 'Kira', message: 'Sure!' },
    { user: 'User', message: 'That\'s great! Can you also help me with debugging?' },
    { user: 'Kira', message: 'Absolutely! Just share your code and I can help you find the issue.' },
  ];

  return (
    <section className='lp-d-section'>
      {/* Chat Window */}
      <div className='lp-d-chat-container'>
        <div className='lp-d-chat-history'>
          {mockChatHistory.map((chat, index) => (
            <div 
              key={index} 
              className={`lp-d-chat-message ${chat.user === 'Kira' ? 'kira-message' : 'user-message'}`}
            >
             {chat.message}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className='lp-d-chat-input-wrapper'>
        <div className='lp-d-chat-input-container'>
          <AiOutlinePlus size={25} opacity={0.85}/>
          <input className='lp-d-chat-input' placeholder='Type a message...' />
          <IoMicOutline size={25} opacity={0.85}/>
        </div>
      </div>
    </section>
  )
}
