/**
 * ProcessingStatus Component
 * Shows loading/progress indicator during image processing
 */

import './ProcessingStatus.css';

const STAGE_LABELS = {
  preprocessing: 'Scanning your puzzle...',
  extracting: 'Finding every cell...',
  ocr: 'Reading the numbers...',
  recognizing: 'Reading the numbers...',
  solving: 'Crunching the solution...'
};

const STAGE_QUIPS = {
  preprocessing: 'Squinting at pixels',
  extracting: 'Drawing the grid lines',
  ocr: 'This is the hard part',
  recognizing: 'This is the hard part',
  solving: 'Almost there...'
};

/** Animated 4x4 mini grid that fills in with numbers */
function SolvingAnimation() {
  const nums = [5, 3, 0, 7, 6, 0, 1, 9, 0, 9, 8, 0, 0, 6, 0, 2, 8, 0];
  return (
    <div className="solving-anim" aria-hidden="true">
      {nums.map((n, i) => (
        <div key={i} className={`solving-cell ${n === 0 ? 'solving-cell-empty' : ''}`}>
          {n !== 0 && <span style={{ animationDelay: `${i * 0.12}s` }}>{n}</span>}
          {n === 0 && <span className="solving-cell-fill" style={{ animationDelay: `${0.8 + i * 0.2}s` }}>?</span>}
        </div>
      ))}
    </div>
  );
}

export function ProcessingStatus({ stage, percent }) {
  const label = STAGE_LABELS[stage] || 'Processing...';
  const quip = STAGE_QUIPS[stage] || '';
  const progressPercent = Math.round((percent || 0) * 100);

  return (
    <div className="processing-status">
      <SolvingAnimation />
      <p className="status-label">{label}</p>
      {quip && <p className="status-quip">{quip}</p>}
      {percent !== undefined && percent > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="progress-text">{progressPercent}%</span>
        </div>
      )}
    </div>
  );
}
