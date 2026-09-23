import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Bookmark, 
  ExternalLink, 
  CornerDownRight, 
  CheckCircle2, 
  ShieldAlert, 
  FileText
} from 'lucide-react';

export default function QAPanel({
  messages = [],
  thinking = false,
  onSendMessage,
  onJumpToClause,
  documentId = null,
}) {
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || thinking) return;
    onSendMessage(inputQuery, documentId);
    setInputQuery('');
  };

  const samplePrompts = [
    'Should I sign this?',
    'Can my landlord raise rent mid-lease?',
    'What is the aggregate liability cap?',
    'What are the termination notice and cure periods?',
    'Is the indemnification mutual or one-sided?',
  ];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Messages area */}
      <div 
        role="log"
        aria-live="polite"
        aria-label="Contract Q&A message history"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: '20px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <Bot size={24} color="#818cf8" />
            </div>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Grounded Document Q&A
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: '1.45', marginBottom: '16px' }}>
              Ask questions about your uploaded document. Answers are strictly grounded in retrieved clauses with exact citations.
            </p>

            {/* Grounding guarantee badge */}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '380px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', textAlign: 'left', letterSpacing: '0.04em' }}>
                Suggested Questions:
              </div>
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(p, documentId)}
                  className="btn-secondary"
                  style={{ textAlign: 'left', padding: '7px 11px', fontSize: '0.75rem', justifyContent: 'flex-start', lineHeight: '1.35' }}
                >
                  <CornerDownRight size={12} color="#818cf8" />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                flexShrink: 0,
                background: msg.role === 'user' ? '#3b82f6' : msg.guardrailRefusal ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                {msg.role === 'user' ? (
                  <User size={15} color="#fff" />
                ) : msg.guardrailRefusal ? (
                  <ShieldAlert size={15} color="#fff" />
                ) : (
                  <Bot size={15} color="#fff" />
                )}
              </div>

              {/* Message Content Container */}
              <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

                {/* Bubble */}
                <div className="glass-panel" style={{
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
                      : '1px solid var(--border-subtle)',
                }}>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
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
                      {msg.citations.map((c, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => onJumpToClause && onJumpToClause(c.clause_id)}
                          className="btn-secondary"
                          title={c.quoted_source ? `Quoted Source: "${c.quoted_source}"` : undefined}
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
                              {c.clause_number ? `Clause ${c.clause_number}` : (c.clause_id || 'Clause')}
                            </span>
                            {c.page && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                                • Page {c.page}
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

        {thinking && (
          <div role="status" aria-label="Query processing and grounded retrieval in progress" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={15} color="#fff" aria-hidden="true" />
            </div>
            <div className="glass-panel" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} color="#818cf8" className="pulsing-radar" aria-hidden="true" />
              <span>Query processing & grounded retrieval in progress...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        aria-label="Document question form"
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Ask a question about your uploaded document..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={thinking}
          aria-label="Ask a question about your uploaded document"
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            outline: 'none',
          }}
        />
        <button 
          type="submit" 
          disabled={!inputQuery.trim() || thinking} 
          className="btn-primary" 
          aria-label="Send question"
          style={{ padding: '0 14px' }}
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
