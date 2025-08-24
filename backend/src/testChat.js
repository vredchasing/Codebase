// /backend/src/testChat.js
import sendMessage from './services/kiraService.js';

const testChat = async () => {
  console.log('test chat starting');
  try {
    const response = await sendMessage('Hello Kira!');
    console.log('Chat response:', response);
  } catch (error) {
    console.error('Error during chat test:', error);
  }
};

testChat();
