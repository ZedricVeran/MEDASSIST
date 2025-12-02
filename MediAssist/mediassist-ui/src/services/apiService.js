// src/services/apiService.js

const API_URL = "http://127.0.0.1:8000"; // FastAPI backend URL

/**
 * Send a question to the backend RAG pipeline
 * @param {string} query - User's question
 * @param {number} top_k - Number of documents to retrieve (optional)
 * @param {boolean} useMemory - Whether to use conversation memory (default: true)
 * @returns {Promise<{answer: string, sources: Array}>}
 */
export const sendChatQuery = async (query, top_k = 6, useMemory = true) => {
  const payload = {
    question: String(query),
    top_k: Number(top_k) || 6,   // <-- ensure it's always a number
    use_memory: Boolean(useMemory)
  };

  console.log("Sending payload to backend:", payload); // Debug

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend returned error:", errorData);
      throw new Error(errorData.detail || "Error communicating with backend");
    }

    const data = await response.json();
    console.log("Backend response:", data); // Debug
    return {
      answer: data.answer || "No answer returned",
      sources: data.sources || []
    };
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

/**
 * Fetch conversation history from backend
 * @returns {Promise<Array>} - Array of message objects
 */
export const getHistory = async () => {
  try {
    const response = await fetch(`${API_URL}/api/history`);
    if (!response.ok) throw new Error("Failed to fetch history");

    const data = await response.json();
    return Array.isArray(data.history) ? data.history : [];
  } catch (error) {
    console.error("History API Error:", error);
    return [];
  }
};

/**
 * Clear conversation memory on backend
 * @returns {Promise<{status: string}>}
 */
export const clearMemory = async () => {
  try {
    const response = await fetch(`${API_URL}/api/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (!response.ok) throw new Error("Failed to clear memory");

    return await response.json();
  } catch (error) {
    console.error("Clear Memory API Error:", error);
    return { status: "error" };
  }
};
