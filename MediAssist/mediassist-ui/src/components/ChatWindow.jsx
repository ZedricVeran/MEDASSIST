import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

function ChatWindow({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="chat-window">

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && (
        <MessageBubble 
          message={{ 
            id: 'loading', 
            text: 'MediAssist is retrieving and compiling data...', 
            role: 'assistant', 
            sources: [] 
          }} 
          isPending={true}
        />
      )}


      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatWindow; 