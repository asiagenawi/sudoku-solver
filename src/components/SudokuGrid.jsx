/**
 * SudokuGrid Component
 * 9x9 grid display for sudoku puzzle
 */

import { SudokuCell } from './SudokuCell';
import './SudokuGrid.css';

export function SudokuGrid({ originalGrid, solvedGrid }) {
  // Use solved grid if available, otherwise original
  const displayGrid = solvedGrid || originalGrid;

  if (!displayGrid) {
    return (
      <div className="sudoku-grid-placeholder">
        <p>Capture or upload a sudoku puzzle to get started</p>
      </div>
    );
  }

  return (
    <div className="sudoku-grid-container">
      <div className="sudoku-grid">
        {displayGrid.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            // Check if this cell was in the original puzzle
            const isOriginal = originalGrid && originalGrid[rowIndex][colIndex] !== 0;

            return (
              <SudokuCell
                key={`${rowIndex}-${colIndex}`}
                value={value}
                isOriginal={isOriginal}
                row={rowIndex}
                col={colIndex}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
