/**
 * SudokuContext
 * Global state management for the sudoku solver app
 */

import { createContext, useContext, useReducer, useCallback } from 'react';

// Status flow: idle → capturing → preprocessing → ocr → solving → complete | error
const initialState = {
  status: 'idle', // 'idle' | 'capturing' | 'preprocessing' | 'ocr' | 'solving' | 'complete' | 'error'
  originalGrid: null,
  solvedGrid: null,
  progress: { stage: null, percent: 0 },
  error: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'START_CAPTURE':
      return {
        ...state,
        status: 'capturing',
        error: null
      };

    case 'START_PROCESSING':
      return {
        ...state,
        status: 'preprocessing',
        progress: { stage: 'preprocessing', percent: 0 },
        error: null
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        status: action.payload.stage === 'solving' ? 'solving' :
                action.payload.stage === 'ocr' || action.payload.stage === 'recognizing' ? 'ocr' :
                state.status,
        progress: action.payload
      };

    case 'SET_ORIGINAL_GRID':
      return {
        ...state,
        originalGrid: action.payload,
        status: 'solving',
        progress: { stage: 'solving', percent: 0 }
      };

    case 'SET_SOLVED_GRID':
      return {
        ...state,
        solvedGrid: action.payload,
        status: 'complete',
        progress: { stage: null, percent: 0 }
      };

    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        progress: { stage: null, percent: 0 }
      };

    case 'RESET':
      return initialState;

    case 'LOAD_HISTORY_ENTRY':
      return {
        ...state,
        status: 'complete',
        originalGrid: action.payload.originalGrid,
        solvedGrid: action.payload.solvedGrid,
        error: null,
        progress: { stage: null, percent: 0 }
      };

    case 'CANCEL_CAPTURE':
      return {
        ...state,
        status: 'idle'
      };

    default:
      return state;
  }
}

const SudokuContext = createContext(null);

export function SudokuProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startCapture = useCallback(() => {
    dispatch({ type: 'START_CAPTURE' });
  }, []);

  const cancelCapture = useCallback(() => {
    dispatch({ type: 'CANCEL_CAPTURE' });
  }, []);

  const startProcessing = useCallback(() => {
    dispatch({ type: 'START_PROCESSING' });
  }, []);

  const updateProgress = useCallback((progress) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
  }, []);

  const setOriginalGrid = useCallback((grid) => {
    dispatch({ type: 'SET_ORIGINAL_GRID', payload: grid });
  }, []);

  const setSolvedGrid = useCallback((grid) => {
    dispatch({ type: 'SET_SOLVED_GRID', payload: grid });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const loadHistoryEntry = useCallback((entry) => {
    dispatch({ type: 'LOAD_HISTORY_ENTRY', payload: entry });
  }, []);

  const value = {
    ...state,
    startCapture,
    cancelCapture,
    startProcessing,
    updateProgress,
    setOriginalGrid,
    setSolvedGrid,
    setError,
    reset,
    loadHistoryEntry
  };

  return (
    <SudokuContext.Provider value={value}>
      {children}
    </SudokuContext.Provider>
  );
}

export function useSudoku() {
  const context = useContext(SudokuContext);
  if (!context) {
    throw new Error('useSudoku must be used within a SudokuProvider');
  }
  return context;
}
