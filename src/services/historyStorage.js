const STORAGE_KEY = 'sudoku-solver-history';
const MAX_ENTRIES = 20;

export function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEntry({ originalGrid, solvedGrid, timestamp, solveTimeMs }) {
  try {
    const givens = originalGrid.flat().filter(n => n !== 0).length;
    const difficulty = givens >= 36 ? 'Easy' : givens >= 28 ? 'Medium' : 'Hard';
    const history = loadHistory();
    history.unshift({ originalGrid, solvedGrid, timestamp, solveTimeMs, difficulty });
    if (history.length > MAX_ENTRIES) {
      history.length = MAX_ENTRIES;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently fail (e.g. private browsing)
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
