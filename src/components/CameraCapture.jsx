/**
 * CameraCapture Component
 * Live camera preview with capture functionality
 */

import { useCamera } from '../hooks/useCamera';
import './CameraCapture.css';

export function CameraCapture({ onCapture, onCancel }) {
  const {
    videoRef,
    isActive,
    error,
    hasMultipleCameras,
    startCamera,
    stopCamera,
    switchCamera,
    capture
  } = useCamera();

  const handleCapture = () => {
    const canvas = capture();
    if (canvas) {
      stopCamera();
      onCapture(canvas);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  if (error) {
    return (
      <div className="camera-capture">
        <div className="camera-error">
          <p>{error}</p>
          <button onClick={onCancel} className="btn btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="camera-capture">
        <div className="camera-start">
          <p>Position the sudoku puzzle within the frame</p>
          <button onClick={startCamera} className="btn btn-primary">
            Start Camera
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-capture">
      <div className="camera-preview">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
        />
        <div className="camera-overlay">
          <div className="alignment-guide"></div>
        </div>
      </div>

      <div className="camera-controls">
        {hasMultipleCameras && (
          <button onClick={switchCamera} className="btn btn-icon" title="Switch Camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M7 12a5 5 0 0 1 5-5M17 12a5 5 0 0 1-5 5"/>
            </svg>
          </button>
        )}

        <button onClick={handleCapture} className="btn btn-capture" title="Capture">
          <span className="capture-ring"></span>
        </button>

        <button onClick={handleCancel} className="btn btn-icon" title="Cancel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
