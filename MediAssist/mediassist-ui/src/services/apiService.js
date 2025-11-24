export const sendChatQuery = async (query, sessionId) => {
  await new Promise(resolve => setTimeout(resolve, 1500)); 
  return {
    answer: `Based on your query regarding '${query}', the WHO states that vaccination protocols...`,
    sources: [
      { filename: 'WHO-Protocol-v2.pdf', page: 7, snippet: '...' },
      { filename: 'DOH-Guidelines-Q3.pdf', page: 14, snippet: '...' }
    ],
    session_id: sessionId || 'mock-session-12345',
  };
};