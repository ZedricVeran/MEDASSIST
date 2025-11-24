import React, { useState } from 'react';
import './App.css'; 
function App() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  const sidebarClass = isSidebarOpen ? 'sidebar-container sidebar-open' : 'sidebar-container';

  return (
    <div className="app-layout">
      
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-big">LOGO</span>
          <span className="app-name-header">MediAssist</span>
        </div>
      </header>
      
      <div className="content-area">
        
        <aside className={sidebarClass}>
          
          <button className="sidebar-toggle-button" onClick={toggleSidebar} aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}>
            {isSidebarOpen ? '◀' : '▶'} 
          </button>

          <button className="new-chat-button">
            <span>➕</span> 
            <span className="text-hidden-on-collapse">NEW CHAT</span>
          </button>
          

          <h4 className="history-title text-hidden-on-collapse">CONVERSATION HISTORY</h4>

          <ul className="chat-list">
            <li className="chat-item text-hidden-on-collapse">Chat about vaccines</li>
            <li className="chat-item text-hidden-on-collapse">DC guidelines Q&A</li>
            <li className="chat-item text-hidden-on-collapse">Abx resistance</li>
          </ul>

        </aside>

        <main className="main-chat-section">
          <div className="chat-container">
            <div className="welcome-screen">
              <h1>Welcome to MediAssist!</h1>
              <p>Ask a health-related question to get started. All answers are sourced from WHO/DOH guidelines.</p>
            </div>
          </div>
          

          <form className="input-box-form">
            <input type="text" placeholder="Type here..." className="input-field" />
            <button type="submit" className="submit-button">
 
              <span style={{ fontSize: '1.2em' }}>➔</span>
            </button>
          </form>
          
         
          <div className="medical-disclaimer-container">
              <p>⚠️ Disclaimer: This tool is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider.</p>
          </div>
        </main>
      </div>
      
      <footer className="app-footer">
          <p>Footer herrreee</p>
      </footer>
    </div>
  );
}

export default App;