import { useState, useEffect } from 'react';
import { loadHistory, clearHistory } from '../services/historyStorage';
import './History.css';

function GridThumbnail({ grid }) {
  return (
    <div className="history-thumb" aria-hidden="true">
      {grid.flat().map((cell, i) => (
        <div key={i} className={cell ? 'thumb-filled' : 'thumb-empty'} />
      ))}
    </div>
  );
}

function formatTime(ms) {
  if (!ms) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function History({ onViewEntry }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  const isEmpty = entries.length === 0;

  return (
    <section className="history">
      <div className="history-header">
        <h2 className="history-title">Past Solves</h2>
        {!isEmpty && (
          <button className="history-clear" onClick={handleClear} title="Clear history">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
      {isEmpty ? (
        <p className="history-empty">No solves yet. Upload a puzzle to get started!</p>
      ) : (
        <ul className="history-list">
          {entries.map((entry, i) => (
            <li key={entry.timestamp ?? i} className="history-card" onClick={() => onViewEntry(entry)}>
              <GridThumbnail grid={entry.originalGrid} />
              <div className="history-info">
                <span className="history-date">{formatDate(entry.timestamp)}</span>
                <div className="history-meta">
                  {entry.difficulty && (
                    <span className={`history-difficulty difficulty-${entry.difficulty.toLowerCase()}`}>
                      {entry.difficulty}
                    </span>
                  )}
                  <span className="history-time">{formatTime(entry.solveTimeMs)}</span>
                </div>
              </div>
              <svg className="history-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
