import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Bookmark, 
  CornerDownRight, 
  ExternalLink, 
  CheckCircle2, 
  ShieldAlert,
  FileText
} from 'lucide-react';

export default function ChatDrawer({ 
  onSendMessage, 
  messages, 
  isThinking, 
  onJumpToClause,
  documentId = null
}) {
  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isThinking) return;
    onSendMessage(inputQuery, documentId);
    setInputQuery("");
  };

  const handleSuggestedPrompt = (promptText) => {
    if (isThinking) return;
    onSendMessage(promptText, documentId);
  };

  const suggestedQuestions = [
    "Should I sign this?",
    "Can my landlord raise rent mid-lease?",
    "What is the liability cap and are damages limited?",
    "Does this contract have any non-compete or exclusivity restrictions?",
    "What are the termination notice and cure periods?",
  ];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <Bot size={24} color="#818cf8" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
              Legal Co-Pilot Assistant
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: '1.4', marginBottom: '14px' }}>
              Ask any question regarding contract clauses, terms, or legal liability. Every answer is grounded with citations.
            </p>

            {/* Grounding Label */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '0.72rem',
              fontWeight: 600,
              marginBottom: '18px'
            }}>
              <CheckCircle2 size={13} />
              <span>Answer based on your uploaded document</span>
            </div>

            {/* Suggested Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '380px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', textAlign: 'left' }}>
                Suggested Inquiries:
              </div>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedPrompt(q)}
                  className="btn-secondary"
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    justifyContent: 'flex-start',
                    lineHeight: '1.3'
                  }}
                >
                  <CornerDownRight size={13} color="#818cf8" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                flexShrink: 0,
                background: msg.role === 'user' 
                  ? '#3b82f6' 
                  : msg.guardrailRefusal 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                    : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {msg.role === 'user' ? (
                  <User size={16} color="#fff" />
                ) : msg.guardrailRefusal ? (
                  <ShieldAlert size={16} color="#fff" />
                ) : (
                  <Bot size={16} color="#fff" />
                )}
              </div>

              {/* Message Bubble & Sources */}
              <div style={{
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {/* Grounding Label Header for Assistant */}
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    {msg.guardrailRefusal ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        fontSize: '0.68rem',
                        fontWeight: 600
                      }}>
                        <ShieldAlert size={11} />
                        Legal Signing Advice Guardrail
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#34d399',
                        fontSize: '0.68rem',
                        fontWeight: 600
                      }}>
                        <CheckCircle2 size={11} />
                        Answer based on your uploaded document
                      </span>
                    )}
                  </div>
                )}

                <div
                  className="glass-panel"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: msg.role === 'user' 
                      ? 'rgba(59, 130, 246, 0.15)' 
                      : msg.guardrailRefusal 
                        ? 'rgba(245, 158, 11, 0.08)' 
                        : 'rgba(30, 41, 59, 0.7)',
                    border: msg.role === 'user' 
                      ? '1px solid rgba(59, 130, 246, 0.4)' 
                      : msg.guardrailRefusal 
                        ? '1px solid rgba(245, 158, 11, 0.3)' 
                        : '1px solid var(--border-subtle)'
                  }}
                >
                  <p style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-main)',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    margin: 0
                  }}>
                    {msg.content}
                  </p>
                </div>

                {/* Sources & Citations Section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{
                    marginTop: '4px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      color: 'var(--text-muted)', 
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      <Bookmark size={12} color="#818cf8" />
                      <span>Sources:</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {msg.citations.map((cite, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => onJumpToClause(cite.clause_id)}
                          className="btn-secondary"
                          title={cite.quoted_source ? `Quoted Source: "${cite.quoted_source}"` : undefined}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '5px 8px',
                            fontSize: '0.72rem',
                            background: 'rgba(99, 102, 241, 0.12)',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            color: '#a5b4fc',
                            borderRadius: '6px',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            <FileText size={12} color="#818cf8" />
                            <span style={{ fontWeight: 600, color: '#e0e7ff' }}>
                              {cite.clause_number ? `Clause ${cite.clause_number}` : (cite.clause_id || 'Clause')}
                            </span>
                            {cite.page && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                                • Page {cite.page}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.65rem', color: '#818cf8' }}>Highlight</span>
                            <ExternalLink size={10} color="#818cf8" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={16} color="#fff" />
            </div>
            <div className="glass-panel" style={{ padding: '8px 14px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Sparkles size={14} className="pulsing-radar" color="#818cf8" />
                <span>Searching clauses & retrieving exact citations...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          placeholder="Ask a question about this contract..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={isThinking}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--text-main)',
            fontSize: '0.84rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isThinking}
          className="btn-primary"
          style={{ padding: '0 16px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
