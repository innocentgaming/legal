import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Bookmark, ExternalLink, CornerDownRight } from 'lucide-react';

export default function QAPanel({
  messages = [],
  thinking = false,
  onSendMessage,
  onJumpToClause,
}) {
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || thinking) return;
    onSendMessage(inputQuery);
    setInputQuery('');
  };

  const samplePrompts = [
    'What is the aggregate liability cap?',
    'Are there restrictive non-compete covenants?',
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
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
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
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <Bot size={22} color="#818cf8" />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
              Citation-Grounded Legal Q&A
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.4', marginBottom: '16px' }}>
              Ask questions regarding contract terms, liabilities, or obligations. Answers cite specific clauses.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '360px' }}>
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(p)}
                  className="btn-secondary"
                  style={{ textAlign: 'left', padding: '6px 10px', fontSize: '0.74rem', justifyContent: 'flex-start' }}
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
                gap: '8px',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                flexShrink: 0,
                background: msg.role === 'user' ? '#3b82f6' : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {msg.role === 'user' ? <User size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
              </div>

              <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="glass-panel" style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.7)',
                  border: msg.role === 'user' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-subtle)',
                }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </p>
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {msg.citations.map((c, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => onJumpToClause && onJumpToClause(c.clause_id)}
                        className="btn-secondary"
                        style={{ padding: '1px 6px', fontSize: '0.68rem', color: '#a5b4fc' }}
                      >
                        <Bookmark size={10} color="#818cf8" />
                        <span>{c.title || c.clause_id}</span>
                        <ExternalLink size={9} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {thinking && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={14} color="#fff" />
            </div>
            <div className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Retrieving grounded citations...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Ask a grounded question about this contract..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={thinking}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            outline: 'none',
          }}
        />
        <button type="submit" disabled={!inputQuery.trim() || thinking} className="btn-primary" style={{ padding: '0 12px' }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
