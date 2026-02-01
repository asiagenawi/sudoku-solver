/**
 * Grid Detection Service
 * Extracts 81 individual cell images from a sudoku grid image
 */

/**
 * Divide a preprocessed sudoku image into 81 cell canvases
 */
export function extractCells(canvas, options = {}) {
  const {
    padding = 0.18, // 18% padding to avoid grid lines
    cellSize = 64
  } = options;

  const width = canvas.width;
  const height = canvas.height;

  const cellWidth = width / 9;
  const cellHeight = height / 9;

  const padX = cellWidth * padding;
  const padY = cellHeight * padding;

  const cells = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const srcX = col * cellWidth + padX;
      const srcY = row * cellHeight + padY;
      const srcW = cellWidth - 2 * padX;
      const srcH = cellHeight - 2 * padY;

      const cellCanvas = document.createElement('canvas');
      cellCanvas.width = cellSize;
      cellCanvas.height = cellSize;
      const cellCtx = cellCanvas.getContext('2d');

      // White background
      cellCtx.fillStyle = 'white';
      cellCtx.fillRect(0, 0, cellSize, cellSize);

      // Draw cell content
      cellCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, cellSize, cellSize);

      cells.push(cellCanvas);
    }
  }

  return cells;
}

/**
 * Check if cell has content
 */
export function cellHasContent(cellCanvas, threshold = 0.02) {
  const ctx = cellCanvas.getContext('2d');
  const w = cellCanvas.width;
  const h = cellCanvas.height;

  // Only check center region
  const margin = Math.floor(w * 0.15);
  const imageData = ctx.getImageData(margin, margin, w - margin * 2, h - margin * 2);
  const data = imageData.data;

  let darkPixels = 0;
  const totalPixels = (w - margin * 2) * (h - margin * 2);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 128) darkPixels++;
  }

  return (darkPixels / totalPixels) > threshold;
}

/**
 * Center the digit by finding bounding box
 */
export function centerDigit(cellCanvas) {
  const ctx = cellCanvas.getContext('2d');
  const width = cellCanvas.width;
  const height = cellCanvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width, maxX = 0, minY = height, maxY = 0;
  let hasDark = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] < 128) {
        hasDark = true;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!hasDark) return cellCanvas;

  const digitW = maxX - minX + 1;
  const digitH = maxY - minY + 1;

  // Add some margin around the digit
  const margin = 4;
  const newSize = Math.max(digitW, digitH) + margin * 2;

  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  const newCtx = newCanvas.getContext('2d');

  newCtx.fillStyle = 'white';
  newCtx.fillRect(0, 0, width, height);

  // Center the digit
  const scale = Math.min((width - margin * 2) / digitW, (height - margin * 2) / digitH, 1.5);
  const destW = digitW * scale;
  const destH = digitH * scale;
  const destX = (width - destW) / 2;
  const destY = (height - destH) / 2;

  newCtx.drawImage(cellCanvas, minX, minY, digitW, digitH, destX, destY, destW, destH);

  return newCanvas;
}

/**
 * Process all cells
 */
export function processCells(cells) {
  return cells.map(cell => {
    const hasContent = cellHasContent(cell);
    const canvas = hasContent ? centerDigit(cell) : cell;
    return { canvas, hasContent };
  });
}
