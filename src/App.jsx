/**
 * Sudoku Solver App
 * Main application component
 */

import { useCallback, useRef } from 'react';
import { SudokuProvider, useSudoku } from './context/SudokuContext';
import { ImageUpload } from './components/ImageUpload';
import { SudokuGrid } from './components/SudokuGrid';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ErrorMessage } from './components/ErrorMessage';
import { HowItWorks } from './components/HowItWorks';
import { History } from './components/History';
import { preprocessImage } from './services/imagePreprocessing';
import { extractCells, processCells } from './services/gridDetection';
import { initializeOCR, recognizeGrid, terminateOCR } from './services/ocrService';
import { solve, validateGrid } from './services/sudokuSolver';
import { saveEntry } from './services/historyStorage';
import './App.css';

function AppContent() {
  const {
    status,
    originalGrid,
    solvedGrid,
    progress,
    error,
    startProcessing,
    updateProgress,
    setOriginalGrid,
    setSolvedGrid,
    setError,
    reset,
    loadHistoryEntry
  } = useSudoku();

  /**
   * Process captured/uploaded image through the full pipeline
   */
  const solveStartRef = useRef(null);

  const processImage = useCallback(async (canvas) => {
    solveStartRef.current = Date.now();
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

      // Step 4: Validate detected grid
      const givens = grid.flat().filter(n => n !== 0).length;
      if (givens < 17) {
        setError(
          givens === 0
            ? 'No numbers were detected. Please try a clearer image with better lighting.'
            : `Only ${givens} numbers were detected — a valid sudoku needs at least 17. Try a clearer image.`
        );
        await terminateOCR();
        return;
      }

      const validation = validateGrid(grid);
      if (!validation.valid) {
        const friendly = validation.error
          .replace(/^Duplicate (\d) in row (\d+)$/, 'Duplicate $1 found in row $2 — the image may have been misread.')
          .replace(/^Duplicate (\d) in column (\d+)$/, 'Duplicate $1 found in column $2 — the image may have been misread.')
          .replace(/^Duplicate (\d) in box (\d+)$/, 'Duplicate $1 found in box $2 — the image may have been misread.')
          .replace(/^Invalid value at row (\d+), column (\d+)$/, 'An invalid value was detected at row $1, column $2.');
        setError(friendly + ' Please try a clearer photo.');
        await terminateOCR();
        return;
      }

      // Step 5: Solve
      updateProgress({ stage: 'solving', percent: 0 });
      const result = solve(grid);

      if (result.success) {
        setSolvedGrid(result.solution);
        const solveTimeMs = Date.now() - solveStartRef.current;
        saveEntry({ originalGrid: grid, solvedGrid: result.solution, timestamp: Date.now(), solveTimeMs });
      } else {
        setError('This puzzle has no valid solution. The detected numbers may be incorrect — please try a clearer image.');
      }

      // Cleanup
      await terminateOCR();
    } catch (err) {
      console.error('Processing error:', err);
      setError('An error occurred while processing the image. Please try again.');
      await terminateOCR();
    }
  }, [startProcessing, updateProgress, setOriginalGrid, setSolvedGrid, setError]);

  const handleUpload = useCallback((canvas) => {
    processImage(canvas);
  }, [processImage]);

  const handleUploadError = useCallback((message) => {
    setError(message);
  }, [setError]);

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
          {originalGrid && (
            <>
              <p className="detected-grid-label">Detected grid:</p>
              <SudokuGrid originalGrid={originalGrid} solvedGrid={null} />
            </>
          )}
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
        <a href="https://github.com/asiagenawi" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          asiagenawi
        </a>
        <div className="header-title">
          <div className="header-grid-icon" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => <div key={i} className="header-grid-cell" />)}
          </div>
          <h1>Sudoku Solver</h1>
        </div>
      </header>
      <main className="app-main">
        <div className="input-options">
          <ImageUpload onUpload={handleUpload} onError={handleUploadError} />
        </div>
        <HowItWorks />
        <History onViewEntry={loadHistoryEntry} />
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
