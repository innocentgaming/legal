import { useState, useCallback } from 'react';
import { chatService } from '../services/contractService';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (queryText) => {
    if (!queryText.trim() || thinking) return;

    const userMessage = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setThinking(true);
    setError(null);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const response = await chatService.sendQuery(queryText, history);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        citations: response.citations || [],
        provider: response.provider || 'Clarity',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage;
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}`, citations: [] },
      ]);
    } finally {
      setThinking(false);
    }
  }, [messages, thinking]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    thinking,
    error,
    sendMessage,
    clearChat,
  };
}
