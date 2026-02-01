/**
 * ProcessingStatus Component
 * Shows loading/progress indicator during image processing
 */

import './ProcessingStatus.css';

const STAGE_LABELS = {
  preprocessing: 'Preprocessing image...',
  extracting: 'Extracting cells...',
  ocr: 'Recognizing digits...',
  recognizing: 'Recognizing digits...',
  solving: 'Solving puzzle...'
};

export function ProcessingStatus({ stage, percent }) {
  const label = STAGE_LABELS[stage] || 'Processing...';
  const progressPercent = Math.round((percent || 0) * 100);

  return (
    <div className="processing-status">
      <div className="spinner"></div>
      <p className="status-label">{label}</p>
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
