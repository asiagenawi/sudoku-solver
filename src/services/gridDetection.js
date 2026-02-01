/**
 * Grid Detection Service
 * Extracts 81 individual cell images from a sudoku grid image
 */

/**
 * Divide a preprocessed sudoku image into 81 cell canvases
 * @param {HTMLCanvasElement} canvas - Preprocessed sudoku image
 * @param {Object} options - Options for cell extraction
 * @returns {HTMLCanvasElement[]} - Array of 81 cell canvases (row-major order)
 */
export function extractCells(canvas, options = {}) {
  const {
    padding = 0.15, // Percentage of cell size to pad (avoid grid lines)
    cellSize = 60   // Output cell size in pixels
  } = options;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Calculate cell dimensions in source image
  const cellWidth = width / 9;
  const cellHeight = height / 9;

  // Padding in pixels
  const padX = cellWidth * padding;
  const padY = cellHeight * padding;

  const cells = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Calculate source region with padding
      const srcX = col * cellWidth + padX;
      const srcY = row * cellHeight + padY;
      const srcW = cellWidth - 2 * padX;
      const srcH = cellHeight - 2 * padY;

      // Create cell canvas
      const cellCanvas = document.createElement('canvas');
      cellCanvas.width = cellSize;
      cellCanvas.height = cellSize;
      const cellCtx = cellCanvas.getContext('2d');

      // Fill with white background
      cellCtx.fillStyle = 'white';
      cellCtx.fillRect(0, 0, cellSize, cellSize);

      // Draw the cell content
      cellCtx.drawImage(
        canvas,
        srcX, srcY, srcW, srcH,
        0, 0, cellSize, cellSize
      );

      cells.push(cellCanvas);
    }
  }

  return cells;
}

/**
 * Check if a cell canvas contains a digit (has significant dark pixels)
 * @param {HTMLCanvasElement} cellCanvas - Cell canvas to check
 * @param {number} threshold - Minimum percentage of dark pixels (0-1)
 * @returns {boolean} - True if cell likely contains a digit
 */
export function cellHasContent(cellCanvas, threshold = 0.03) {
  const ctx = cellCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, cellCanvas.width, cellCanvas.height);
  const data = imageData.data;

  let darkPixels = 0;
  const totalPixels = cellCanvas.width * cellCanvas.height;

  // Count pixels that are significantly dark
  for (let i = 0; i < data.length; i += 4) {
    // Check if pixel is dark (below 128 brightness)
    if (data[i] < 128) {
      darkPixels++;
    }
  }

  const ratio = darkPixels / totalPixels;
  return ratio > threshold;
}

/**
 * Center the digit in a cell canvas by finding the bounding box
 * @param {HTMLCanvasElement} cellCanvas - Cell canvas with digit
 * @returns {HTMLCanvasElement} - New canvas with centered digit
 */
export function centerDigit(cellCanvas) {
  const ctx = cellCanvas.getContext('2d');
  const width = cellCanvas.width;
  const height = cellCanvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Find bounding box of dark pixels
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let hasDarkPixels = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] < 128) {
        hasDarkPixels = true;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!hasDarkPixels) {
    return cellCanvas;
  }

  // Extract and center the digit
  const digitWidth = maxX - minX + 1;
  const digitHeight = maxY - minY + 1;

  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  const newCtx = newCanvas.getContext('2d');

  // Fill with white
  newCtx.fillStyle = 'white';
  newCtx.fillRect(0, 0, width, height);

  // Calculate position to center the digit
  const destX = Math.floor((width - digitWidth) / 2);
  const destY = Math.floor((height - digitHeight) / 2);

  // Draw the digit centered
  newCtx.drawImage(
    cellCanvas,
    minX, minY, digitWidth, digitHeight,
    destX, destY, digitWidth, digitHeight
  );

  return newCanvas;
}

/**
 * Process all cells - center digits and check for content
 * @param {HTMLCanvasElement[]} cells - Array of cell canvases
 * @returns {{ canvas: HTMLCanvasElement, hasContent: boolean }[]}
 */
export function processCells(cells) {
  return cells.map(cell => {
    const hasContent = cellHasContent(cell);
    const canvas = hasContent ? centerDigit(cell) : cell;
    return { canvas, hasContent };
  });
}

/**
 * Create a debug visualization of the extracted cells
 * @param {HTMLCanvasElement[]} cells - Array of 81 cell canvases
 * @param {number} cellSize - Size of each cell in output
 * @returns {HTMLCanvasElement} - Debug grid visualization
 */
export function createDebugGrid(cells, cellSize = 50) {
  const canvas = document.createElement('canvas');
  canvas.width = cellSize * 9;
  canvas.height = cellSize * 9;
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw cells
  cells.forEach((cell, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    ctx.drawImage(cell, col * cellSize, row * cellSize, cellSize, cellSize);
  });

  // Draw grid lines
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  for (let i = 1; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }

  // Draw thick lines for 3x3 boxes
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize * 3, 0);
    ctx.lineTo(i * cellSize * 3, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize * 3);
    ctx.lineTo(canvas.width, i * cellSize * 3);
    ctx.stroke();
  }

  return canvas;
}
