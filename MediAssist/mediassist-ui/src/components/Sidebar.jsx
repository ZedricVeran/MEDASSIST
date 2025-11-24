import React from 'react';

function Sidebar() {
  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <span className="logo-text">LOGO</span> 
        <span className="app-name">MediAssist</span>
      </div>

 
      <div className="new-chat-section">
        <button className="new-chat-button">+ NEW CHAT</button>
      </div>


      <div className="history-section">
        <h3 className="history-title">CONVERSATION HISTORY</h3>
        <ul className="chat-list">
          <li className="chat-item">Chat about vaccines...</li>
          <li className="chat-item">DOH guidelines Q&A</li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;