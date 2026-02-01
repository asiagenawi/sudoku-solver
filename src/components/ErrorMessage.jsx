/**
 * ErrorMessage Component
 * Displays error messages with retry option
 */

import './ErrorMessage.css';

export function ErrorMessage({ message, onRetry, onDismiss }) {
  return (
    <div className="error-message">
      <div className="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="error-text">{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="btn btn-secondary">
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
