import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: isSuccess ? '#064e3b' : '#7f1d1d',
        color: isSuccess ? '#a7f3d0' : '#fecaca',
        border: `1px solid ${isSuccess ? '#059669' : '#dc2626'}`,
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        fontSize: '0.84rem',
        fontWeight: 600,
        maxWidth: '380px',
        animation: 'slideUp 0.25s ease-out forwards',
      }}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} color="#34d399" aria-hidden="true" />
      ) : (
        <AlertCircle size={18} color="#f87171" aria-hidden="true" />
      )}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
