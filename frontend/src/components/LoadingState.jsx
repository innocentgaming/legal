import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = "Processing legal data...", size = "medium" }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      textAlign: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: size === 'large' ? '54px' : '40px',
        height: size === 'large' ? '54px' : '40px',
        borderRadius: '12px',
        background: 'rgba(99, 102, 241, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(99, 102, 241, 0.3)',
      }}>
        <Loader2 size={size === 'large' ? 28 : 20} color="#818cf8" style={{ animation: 'spin 1.5s linear infinite' }} />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {message}
      </div>
    </div>
  );
}

export function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div style={{
      margin: '12px 20px 0 20px',
      padding: '10px 16px',
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.82rem',
      color: '#fca5a5',
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#fca5a5',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0 4px',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
