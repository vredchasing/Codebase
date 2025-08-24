// /backend/src/services/kiraService.js
import axios from 'axios';

async function sendMessage(prompt, history = []) {
  const messages = [
    ...history.map(({ user, message }) => ({
      role: user.toLowerCase(),
      content: message
    })),
    { role: 'user', content: prompt }
  ];

  const body = {
    model: 'qwen3:4b',
    messages,
    stream: false
  };

  try {
    const { data } = await axios.post('http://localhost:11434/api/chat', body, {
      headers: { 'Content-Type': 'application/json' }
    });
    return data;
  } catch (error) {
    console.error('Error sending message to Kira:', error);
    throw error;
  }
}

export default sendMessage;
