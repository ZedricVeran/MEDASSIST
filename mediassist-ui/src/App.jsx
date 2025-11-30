import React, { useState, useEffect } from "react";
import "./App.css";

// Components
// Removed import Sidebar, as its content is now merged or adapted here.
import InputBox from "./components/InputBox";
import MedicalDisclaimer from "./components/MedicalDisclaimer";

// Services
import { sendChatQuery, getHistory, clearMemory } from "./services/apiService";

function App() {
  const [messages, setMessages] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);
  // NEW STATE: Control the sidebar's expanded/collapsed state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load conversation history on first render
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

    try {
      // Assuming a simple API call structure for the example
      const response = await sendChatQuery(query, 6, true);

      const botMessage = {
        role: "bot",
        content: response.answer,
        sources: response.sources
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error sending chat query:", err);
      const errorMessage = { role: "bot", content: "Sorry, something went wrong." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsDisabled(false);
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

  // Function to determine the sidebar class string
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
        {/* ASIDE: Added isSidebarOpen class to enable CSS transitions */}
        <aside className={sidebarClass}>

          {/* NEW: Toggle button for the sidebar */}
          <button 
            className="sidebar-toggle-button"
            onClick={() => setIsSidebarOpen(prev => !prev)}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {/* Using basic arrows for visual indication */}
            {isSidebarOpen ? '❮' : '❯'} 
          </button>

          {/* NEW CHAT Button - Now styled for collapsed state */}
          <button className="new-chat-button sidebar-nav-item" onClick={handleClearMemory}>
            {/* Icon placeholder for the collapsed state */}
            <span className="nav-icon">➕</span>
            {/* Text only visible in the expanded state */}
            <span className="sidebar-nav-text text-hidden-on-collapse">NEW CHAT</span>
          </button>
          
          {/* CONFIG Link - REMOVED */}
          {/* MONITOR Link - REMOVED */}
          
          {/* HISTORY SECTION: Adjusted to be part of the conditional rendering */}
          {isSidebarOpen && (
            <>
              <h4 className="history-title text-hidden-on-collapse">CONVERSATION HISTORY</h4>
              <ul className="chat-list">
                {Array.isArray(messages) &&
                  messages.map((msg, idx) => (
                    // Truncating content for better sidebar display
                    <li key={idx} className="chat-item">
                      {msg.role === "user" ? "You: " : "MediAssist: "} {msg.content.substring(0, 30)}...
                    </li>
                  ))}
              </ul>
            </>
          )}
        </aside>

        <main className="main-chat-section">
          {/* ... (Rest of your chat content) ... */}
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
                  {/* Assuming you have a MessageBubble component or similar, simplified here */}
                  <div className={`message-bubble message-bubble-${msg.role}`}>
                      {msg.content}
                  </div>
                </div>
              ))}
          </div>

          <InputBox onSendMessage={handleSendMessage} isDisabled={isDisabled} />
          <MedicalDisclaimer />
        </main>
      </div>

      <footer className="app-footer">
        <p>Disclaimer: This tool is NOT a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
}

export default App;