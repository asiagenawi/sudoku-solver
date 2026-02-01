/**
 * Sudoku Solver using Backtracking Algorithm
 */

/**
 * Check if placing a number at a specific position is valid
 * @param {number[][]} board - 9x9 sudoku grid (0 = empty)
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} num - Number to place (1-9)
 * @returns {boolean} - True if placement is valid
 */
export function isValidPlacement(board, row, col, num) {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) {
      return false;
    }
  }

  // Check 3x3 box
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;
  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      if (board[r][c] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Find the next empty cell in the grid
 * @param {number[][]} board - 9x9 sudoku grid
 * @returns {[number, number] | null} - [row, col] or null if no empty cell
 */
function findEmptyCell(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

/**
 * Solve the sudoku puzzle using backtracking
 * @param {number[][]} board - 9x9 sudoku grid (0 = empty), modified in place
 * @returns {boolean} - True if puzzle is solvable
 */
export function solveSudoku(board) {
  const emptyCell = findEmptyCell(board);

  // No empty cells means puzzle is solved
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;

  // Try numbers 1-9
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;

      if (solveSudoku(board)) {
        return true;
      }

      // Backtrack
      board[row][col] = 0;
    }
  }

  return false;
}

/**
 * Validate that a grid has no duplicate values in rows, columns, or boxes
 * @param {number[][]} grid - 9x9 sudoku grid
 * @returns {{ valid: boolean, error?: string }} - Validation result
 */
export function validateGrid(grid) {
  // Check grid dimensions
  if (!grid || grid.length !== 9) {
    return { valid: false, error: 'Grid must have 9 rows' };
  }

  for (let i = 0; i < 9; i++) {
    if (!grid[i] || grid[i].length !== 9) {
      return { valid: false, error: `Row ${i + 1} must have 9 columns` };
    }
  }

  // Check for invalid values
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = grid[row][col];
      if (typeof val !== 'number' || val < 0 || val > 9 || !Number.isInteger(val)) {
        return { valid: false, error: `Invalid value at row ${row + 1}, column ${col + 1}` };
      }
    }
  }

  // Check rows for duplicates
  for (let row = 0; row < 9; row++) {
    const seen = new Set();
    for (let col = 0; col < 9; col++) {
      const val = grid[row][col];
      if (val !== 0) {
        if (seen.has(val)) {
          return { valid: false, error: `Duplicate ${val} in row ${row + 1}` };
        }
        seen.add(val);
      }
    }
  }

  // Check columns for duplicates
  for (let col = 0; col < 9; col++) {
    const seen = new Set();
    for (let row = 0; row < 9; row++) {
      const val = grid[row][col];
      if (val !== 0) {
        if (seen.has(val)) {
          return { valid: false, error: `Duplicate ${val} in column ${col + 1}` };
        }
        seen.add(val);
      }
    }
  }

  // Check 3x3 boxes for duplicates
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set();
      for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
        for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
          const val = grid[r][c];
          if (val !== 0) {
            if (seen.has(val)) {
              return { valid: false, error: `Duplicate ${val} in box ${boxRow * 3 + boxCol + 1}` };
            }
            seen.add(val);
          }
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Create a deep copy of the grid
 * @param {number[][]} grid - 9x9 sudoku grid
 * @returns {number[][]} - Deep copy of the grid
 */
export function copyGrid(grid) {
  return grid.map(row => [...row]);
}

/**
 * Solve a sudoku puzzle and return the solution
 * @param {number[][]} grid - 9x9 sudoku grid (0 = empty)
 * @returns {{ success: boolean, solution?: number[][], error?: string }}
 */
export function solve(grid) {
  // Validate first
  const validation = validateGrid(grid);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Work on a copy
  const solution = copyGrid(grid);

  if (solveSudoku(solution)) {
    return { success: true, solution };
  }

  return { success: false, error: 'No solution exists for this puzzle' };
}
