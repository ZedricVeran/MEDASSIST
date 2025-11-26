import React, { useState, useEffect } from "react";
import "./App.css";

import InputBox from "./components/InputBox";
import MedicalDisclaimer from "./components/MedicalDisclaimer";

import { sendChatQuery, getHistory, clearMemory } from "./services/apiService";

function App() {
  const [messages, setMessages] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistory(); 
        setMessages(history);
      } catch (err) {
        console.error("Error fetching history:", err);
        setMessages([]);
      }
    };
    fetchHistory();
  }, []);

  const handleSendMessage = async (query) => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setIsDisabled(true);
    setIsThinking(true);

    try {
      const response = await sendChatQuery(query, 6, true);

      const botMessage = {
        role: "bot",
        content: response.answer,
        sources: response.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error sending chat query:", err);
      const errorMessage = { role: "bot", content: "Sorry, something went wrong. Please check the network." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsDisabled(false);
      setIsThinking(false);
    }
  };

  const handleClearMemory = async () => {
    try {
      await clearMemory();
      setMessages([]);
    } catch (err) {
      console.error("Error clearing memory:", err);
    }
  };

  const sidebarClass = `sidebar-container ${isSidebarOpen ? 'sidebar-open' : ''}`;

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

          <button 
            className="sidebar-toggle-button"
            onClick={() => setIsSidebarOpen(prev => !prev)}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? '❮' : '❯'} 
          </button>

          <button className="new-chat-button sidebar-nav-item" onClick={handleClearMemory}>
            <span className="nav-icon">➕</span>
            <span className="sidebar-nav-text text-hidden-on-collapse">NEW CHAT</span>
          </button>
          
          {isSidebarOpen && (
            <>
              <h4 className="history-title text-hidden-on-collapse">CONVERSATION HISTORY</h4>
              <ul className="chat-list">
                {Array.isArray(messages) &&
                  messages.map((msg, idx) => (
                    
                    <li key={idx} className="chat-item" title={msg.content}>
                      {msg.role === "user" ? "You: " : "MediAssist: "} {msg.content.substring(0, 30)}...
                    </li>
                  ))}
              </ul>
            </>
          )}
        </aside>

        <div className="main-content-wrapper">
          
          <main className="main-chat-section">
            <div className="chat-container">
              {messages.length === 0 && (
                <div className="welcome-screen">
                  <h1>Welcome to MediAssist!</h1>
                  <p>
                    Ask a health-related question to get started. All answers are sourced from WHO/DOH guidelines.
                  </p>
                </div>
              )}

              {Array.isArray(messages) &&
                messages.map((msg, idx) => (
                  <div key={idx} className={`message-row ${msg.role === "user" ? "user-row" : "assistant-row"}`}>
                    <div className={`message-bubble message-bubble-${msg.role}`}>
                        {msg.content}
                    </div>
                  </div>
                ))}
                
              
              {isThinking && (
                <div className="message-row assistant-row">
                    <div className="message-bubble message-bubble-assistant thinking-bubble">
                        MediAssist is thinking...
                    </div>
                </div>
              )}

            </div>
          </main>

          
          <div className="fixed-bottom-bar">
            <InputBox onSendMessage={handleSendMessage} isDisabled={isDisabled || isThinking} />
            <MedicalDisclaimer />
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Disclaimer: This tool is NOT a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
}

export default App;