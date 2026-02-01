/**
 * Sudoku Solver App
 * Main application component
 */

import { useCallback } from 'react';
import { SudokuProvider, useSudoku } from './context/SudokuContext';
import { CameraCapture } from './components/CameraCapture';
import { ImageUpload } from './components/ImageUpload';
import { SudokuGrid } from './components/SudokuGrid';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ErrorMessage } from './components/ErrorMessage';
import { preprocessImage } from './services/imagePreprocessing';
import { extractCells, processCells } from './services/gridDetection';
import { initializeOCR, recognizeGrid, terminateOCR } from './services/ocrService';
import { solve } from './services/sudokuSolver';
import './App.css';

function AppContent() {
  const {
    status,
    originalGrid,
    solvedGrid,
    progress,
    error,
    startCapture,
    cancelCapture,
    startProcessing,
    updateProgress,
    setOriginalGrid,
    setSolvedGrid,
    setError,
    reset
  } = useSudoku();

  /**
   * Process captured/uploaded image through the full pipeline
   */
  const processImage = useCallback(async (canvas) => {
    startProcessing();

    try {
      // Step 1: Preprocess image
      updateProgress({ stage: 'preprocessing', percent: 0 });
      const preprocessed = await preprocessImage(canvas.toDataURL());
      updateProgress({ stage: 'preprocessing', percent: 1 });

      // Step 2: Extract cells
      updateProgress({ stage: 'extracting', percent: 0 });
      const cells = extractCells(preprocessed);
      const processedCells = processCells(cells);
      updateProgress({ stage: 'extracting', percent: 1 });

      // Step 3: OCR
      updateProgress({ stage: 'ocr', percent: 0 });
      await initializeOCR();
      const grid = await recognizeGrid(processedCells, (percent) => {
        updateProgress({ stage: 'ocr', percent });
      });
      setOriginalGrid(grid);

      // Step 4: Solve
      updateProgress({ stage: 'solving', percent: 0 });
      const result = solve(grid);

      if (result.success) {
        setSolvedGrid(result.solution);
      } else {
        setError(result.error || 'Could not solve the puzzle. Please try a clearer image.');
      }

      // Cleanup
      await terminateOCR();
    } catch (err) {
      console.error('Processing error:', err);
      setError('An error occurred while processing the image. Please try again.');
      await terminateOCR();
    }
  }, [startProcessing, updateProgress, setOriginalGrid, setSolvedGrid, setError]);

  const handleCapture = useCallback((canvas) => {
    processImage(canvas);
  }, [processImage]);

  const handleUpload = useCallback((canvas) => {
    processImage(canvas);
  }, [processImage]);

  const handleUploadError = useCallback((message) => {
    setError(message);
  }, [setError]);

  // Render camera capture mode
  if (status === 'capturing') {
    return (
      <div className="app">
        <CameraCapture onCapture={handleCapture} onCancel={cancelCapture} />
      </div>
    );
  }

  // Render processing status
  if (['preprocessing', 'ocr', 'solving'].includes(status)) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Sudoku Solver</h1>
        </header>
        <main className="app-main">
          <ProcessingStatus stage={progress.stage} percent={progress.percent} />
        </main>
      </div>
    );
  }

  // Render error state
  if (status === 'error') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Sudoku Solver</h1>
        </header>
        <main className="app-main">
          <ErrorMessage
            message={error}
            onRetry={reset}
          />
        </main>
      </div>
    );
  }

  // Render results
  if (status === 'complete') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Sudoku Solver</h1>
        </header>
        <main className="app-main">
          <SudokuGrid originalGrid={originalGrid} solvedGrid={solvedGrid} />
          <div className="result-actions">
            <button onClick={reset} className="btn btn-primary">
              Solve Another
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Render idle state (input options)
  return (
    <div className="app">
      <header className="app-header">
        <h1>Sudoku Solver</h1>
        <p className="app-subtitle">Scan or upload a sudoku puzzle to solve it instantly</p>
      </header>
      <main className="app-main">
        <div className="input-options">
          <button onClick={startCapture} className="btn btn-primary btn-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Use Camera
          </button>
          <div className="divider">
            <span>or</span>
          </div>
          <ImageUpload onUpload={handleUpload} onError={handleUploadError} />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <SudokuProvider>
      <AppContent />
    </SudokuProvider>
  );
}

export default App;
