import React, { useState } from 'react';
import { sendChatQuery } from '../services/apiService';
import ChatWindow from './ChatWindow'; 
import InputBox from './InputBox';

function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text) => {
  const trimmedText = text.trim();
  if (!trimmedText || isLoading) return;

  // Add user's message
  const userMessage = { 
    id: Date.now(), 
    text: trimmedText, 
    role: 'user', 
    timestamp: new Date() 
  };
  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  try {
    // Always pass valid top_k and useMemory
    const botResponseData = await sendChatQuery(trimmedText, 6, true);

    const botMessage = {
      id: Date.now() + 1, 
      text: botResponseData.answer, 
      role: 'assistant', 
      sources: botResponseData.sources || [],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);

  } catch (error) {
    console.error("Chat API Error:", error);
    const errorMessage = {
      id: Date.now() + 2,
      text: "I am having trouble connecting to the service. Please try again later.",
      role: 'assistant',
      sources: []
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="chat-container">
      {messages.length === 0 && (
        <div className="welcome-screen">
          <h1>Welcome to MediAssist!</h1>
          <p>Ask a health-related question to get started. All answers are sourced from WHO/DOH guidelines.</p>
        </div>
      )}
      
      <ChatWindow messages={messages} isLoading={isLoading} />
      <InputBox onSendMessage={handleSendMessage} isDisabled={isLoading} />
    </div>
  );
}

export default ChatContainer;
