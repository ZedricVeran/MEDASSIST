import React, { useState } from 'react';

function InputBox({ onSendMessage, isDisabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === '' || isDisabled) return;

    onSendMessage(input);
    setInput('');
  };

  return (

    <form onSubmit={handleSubmit} className="input-box-form">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isDisabled ? "Please wait for MediAssist's response..." : "Type here..."}
        disabled={isDisabled}
        className="input-field"
      />
      <button 
        type="submit" 
        disabled={isDisabled}
        className="submit-button"
      >
        <span role="img" aria-label="send">➡️</span> 
      </button>
    </form>
  );
}

export default InputBox;