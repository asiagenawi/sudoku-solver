/**
 * SudokuCell Component
 * Individual cell in the sudoku grid
 */

import './SudokuCell.css';

export function SudokuCell({ value, isOriginal, row, col }) {
  const isBoxBorderRight = col === 2 || col === 5;
  const isBoxBorderBottom = row === 2 || row === 5;

  const classNames = [
    'sudoku-cell',
    isOriginal ? 'original' : 'solved',
    isBoxBorderRight ? 'box-border-right' : '',
    isBoxBorderBottom ? 'box-border-bottom' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {value !== 0 ? value : ''}
    </div>
  );
}
