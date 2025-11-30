import React from 'react';
import SourceCitations from './SourceCitations';

function MessageBubble({ message, isPending = false }) {
  const isUser = message.role === 'user';
  
  const bubbleClass = isUser ? 'message-bubble-user' : 'message-bubble-assistant';
  const contentClass = isUser ? 'message-content-user' : 'message-content-assistant';

  return (
    <div className={`message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      <div className={`message-bubble ${bubbleClass}`}>
        
        <div className={`message-content ${contentClass}`}>
          {isPending ? '...' : message.text}
        </div>
        
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceCitations sources={message.sources} />
        )}
        
        
        {isPending && (
          <div className="loading-indicator">
            <span className="spinner"></span> 
            <small>Retrieving data...</small>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default MessageBubble; 