const chatbox = document.getElementById("chatbox");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");

sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function appendMessage(sender, text) {
  const messageWrapper = document.createElement("div");
  messageWrapper.className = "flex gap-3 mb-4 " + (sender === "user" ? "justify-end" : "");

  if (sender === "bot") {
    // Bot avatar
    const avatar = document.createElement("div");
    avatar.className = "flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center";
    avatar.innerHTML = `
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    `;
    messageWrapper.appendChild(avatar);
  }

  // Message bubble
  const bubble = document.createElement("div");
  bubble.className = sender === "user"
    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-sm max-w-md"
    : "bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 max-w-md";

  const textContent = document.createElement("p");
  textContent.className = "text-sm leading-relaxed";
  textContent.textContent = text;
  bubble.appendChild(textContent);

  // Timestamp
  const timestamp = document.createElement("span");
  timestamp.className = "text-xs mt-1 block " + (sender === "user" ? "text-blue-100" : "text-gray-400");
  timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  bubble.appendChild(timestamp);

  messageWrapper.appendChild(bubble);

  if (sender === "user") {
    // User avatar
    const userAvatar = document.createElement("div");
    userAvatar.className = "flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center";
    userAvatar.innerHTML = `
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    `;
    messageWrapper.appendChild(userAvatar);
  }

  chatbox.appendChild(messageWrapper);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function showTypingIndicator() {
  const typingWrapper = document.createElement("div");
  typingWrapper.className = "flex gap-3 mb-4";
  typingWrapper.id = "typing-indicator";

  // Bot avatar
  const avatar = document.createElement("div");
  avatar.className = "flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center";
  avatar.innerHTML = `
    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
  `;
  typingWrapper.appendChild(avatar);

  // Typing animation
  const typingBubble = document.createElement("div");
  typingBubble.className = "bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-1";
  typingBubble.innerHTML = `
    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
  `;
  typingWrapper.appendChild(typingBubble);

  chatbox.appendChild(typingWrapper);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) indicator.remove();
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Disable input while sending
  sendBtn.disabled = true;
  userInput.disabled = true;
  sendBtn.classList.add("opacity-50", "cursor-not-allowed");

  appendMessage("user", text);
  userInput.value = "";

  showTypingIndicator();

  try {
    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text })
    });

    const data = await res.json();
    removeTypingIndicator();
    appendMessage("bot", data.answer);

  } catch (err) {
    removeTypingIndicator();
    appendMessage("bot", "I'm having trouble connecting to the server right now. Please try again in a moment.");
    console.error("Connection error:", err);
  } finally {
    // Re-enable input
    sendBtn.disabled = false;
    userInput.disabled = false;
    sendBtn.classList.remove("opacity-50", "cursor-not-allowed");
    userInput.focus();
  }
}