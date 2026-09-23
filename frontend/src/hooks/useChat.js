import { useState, useCallback } from 'react';
import { chatService } from '../services/contractService';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (queryText, docId = null) => {
    if (!queryText.trim() || thinking) return;

    const userMessage = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setThinking(true);
    setError(null);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const response = await chatService.askQA(queryText, docId);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        citations: response.citations || [],
        provider: response.provider || 'Clarity',
        grounded: response.grounded !== undefined ? response.grounded : true,
        guardrailRefusal: response.guardrail_refusal || false,
        confidence: response.confidence,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage;
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}`, citations: [], grounded: false },
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
