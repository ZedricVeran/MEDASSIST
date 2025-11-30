//const chatbox = document.getElementById("chatbox");
//const sendBtn = document.getElementById("sendBtn");
//const userInput = document.getElementById("userInput");
//
//sendBtn.onclick = sendMessage;
//userInput.addEventListener("keypress", (e) => {
//  if (e.key === "Enter") sendMessage();
//});
//
//function appendMessage(sender, text) {
//  const bubble = document.createElement("div");
//  bubble.className = sender === "user"
//    ? "bg-blue-600 text-white p-3 rounded-lg mb-2 self-end max-w-[80%] ml-auto"
//    : "bg-gray-200 text-gray-900 p-3 rounded-lg mb-2 max-w-[80%]";
//
//  bubble.textContent = text;
//  chatbox.appendChild(bubble);
//  chatbox.scrollTop = chatbox.scrollHeight;
//}
//
//async function sendMessage() {
//  const text = userInput.value.trim();
//  if (!text) return;
//
//  appendMessage("user", text);
//  userInput.value = "";
//
//  // Loading bubble
//  const loading = document.createElement("div");
//  loading.className = "bg-gray-300 text-gray-700 p-3 rounded-lg mb-2 max-w-[80%]";
//  loading.textContent = "MediAssist is thinking...";
//  chatbox.appendChild(loading);
//  chatbox.scrollTop = chatbox.scrollHeight;
//
//  try {
//    const res = await fetch("http://127.0.0.1:8000/chat", {
//      method: "POST",
//      headers: { "Content-Type": "application/json" },
//      body: JSON.stringify({ question: text })
//    });
//
//    const data = await res.json();
//    loading.remove();
//    appendMessage("bot", data.answer);
//
//  } catch (err) {
//    loading.remove();
//    appendMessage("bot", "Error: Cannot connect to the server.");
//  }
//}

    const chatbox = document.getElementById("chatbox");
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("userInput");
    const clearBtn = document.getElementById("clearBtn");
    const memoryToggle = document.getElementById("memoryToggle");
    const memoryIndicator = document.getElementById("memoryIndicator");

    const API_URL = "http://127.0.0.1:8000";
    let messageCount = 0;

    sendBtn.onclick = sendMessage;
    clearBtn.onclick = clearHistory;

    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !sendBtn.disabled) sendMessage();
    });

    function appendMessage(sender, text, confidence = null) {
      const bubble = document.createElement("div");
      bubble.className = sender === "user"
        ? "bg-blue-600 text-white p-3 rounded-lg self-end max-w-[80%] ml-auto break-words"
        : "bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[80%] break-words";

      bubble.textContent = text;
      chatbox.appendChild(bubble);
      chatbox.scrollTop = chatbox.scrollHeight;

      // Update memory indicator
      if (sender === "bot") {
        messageCount += 2;
        updateMemoryIndicator();
      }
    }

    function appendLoadingBubble() {
      const loading = document.createElement("div");
      loading.id = "loadingBubble";
      loading.className = "bg-gray-300 text-gray-700 p-3 rounded-lg max-w-[80%] animate-pulse";
      loading.textContent = "🤔 MediAssist is thinking...";
      chatbox.appendChild(loading);
      chatbox.scrollTop = chatbox.scrollHeight;
      return loading;
    }

    function updateMemoryIndicator() {
      memoryIndicator.textContent = `Memory: ${messageCount} messages`;
    }



    async function sendMessage() {
      const text = userInput.value.trim();
      if (!text) return;

      sendBtn.disabled = true;
      appendMessage("user", text);
      userInput.value = "";

      const loading = appendLoadingBubble();

      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: text,
            use_memory: memoryToggle.checked
          })
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        loading.remove();

        appendMessage("bot", data.answer, data.confidence);

      } catch (err) {
        loading.remove();
        appendMessage("bot", "⚠️ Error: Cannot connect to the server. Make sure the backend is running on http://127.0.0.1:8000");
        console.error(err);
      } finally {
        sendBtn.disabled = false;
        userInput.focus();
      }
    }

    async function clearHistory() {
      if (!confirm("Clear conversation history? This cannot be undone.")) return;

      try {
        const res = await fetch(`${API_URL}/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });

        if (res.ok) {
          chatbox.innerHTML = '<div class="text-center text-gray-500 text-sm py-4">👋 Conversation cleared. Start fresh!</div>';
          sourcePanel.classList.add("hidden");
          confidenceBar.classList.add("hidden");
          messageCount = 0;
          updateMemoryIndicator();
        }
      } catch (err) {
        alert("Error clearing history");
        console.error(err);
      }
    }