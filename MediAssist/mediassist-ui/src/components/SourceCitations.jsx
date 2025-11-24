import React, { useState } from 'react';

function SourceCitations({ sources }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSources = () => {
    setIsExpanded(!isExpanded);
  };

  if (!sources || sources.length === 0) {
    return null; 
  }

  return (
    <div className="source-citations-container">
      <button 
        className="source-toggle-button" 
        onClick={toggleSources}
        aria-expanded={isExpanded}
      >
        <small>{sources.length} Source{sources.length !== 1 ? 's' : ''} Cited</small>
        <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <ul className="source-list">
          {sources.map((source, index) => (
            <li key={index} className="source-item">
              <span className="source-filename">📄 {source.filename}</span>
              <span className="source-page"> (p. {source.page})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SourceCitations;