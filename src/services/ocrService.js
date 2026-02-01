/**
 * OCR Service using Tesseract.js
 * Recognizes digits from sudoku cell images
 */

import Tesseract from 'tesseract.js';

let worker = null;

/**
 * Initialize the Tesseract worker
 */
export async function initializeOCR() {
  if (worker) {
    return;
  }

  worker = await Tesseract.createWorker('eng', 1, {
    legacyCore: true,
    legacyLang: true,
  });

  await worker.setParameters({
    tessedit_char_whitelist: '123456789',
    tessedit_pageseg_mode: '10', // Single character
  });
}

/**
 * Terminate the OCR worker
 */
export async function terminateOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

/**
 * Prepare cell for OCR - scale up and add padding
 */
function prepareCell(canvas) {
  const size = 100;
  const padding = 20;

  const prepared = document.createElement('canvas');
  prepared.width = size;
  prepared.height = size;
  const ctx = prepared.getContext('2d');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  // Draw cell content with padding
  ctx.drawImage(canvas, padding, padding, size - padding * 2, size - padding * 2);

  // Ensure pure black and white
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] < 128 ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
  return prepared;
}

/**
 * Check if cell has a digit (enough dark pixels in center)
 */
function hasDigit(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Check center 60% of cell
  const margin = Math.floor(w * 0.2);
  const imageData = ctx.getImageData(margin, margin, w - margin * 2, h - margin * 2);
  const data = imageData.data;

  let darkPixels = 0;
  const totalPixels = (w - margin * 2) * (h - margin * 2);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 128) darkPixels++;
  }

  // Need at least 3% dark pixels to be considered a digit
  return (darkPixels / totalPixels) > 0.03;
}

/**
 * Recognize a single digit
 */
async function recognizeDigit(cellCanvas) {
  if (!worker) await initializeOCR();

  const prepared = prepareCell(cellCanvas);

  try {
    const { data: { text, confidence } } = await worker.recognize(prepared);
    const cleaned = text.replace(/[^1-9]/g, '');

    if (cleaned.length > 0 && confidence > 20) {
      return parseInt(cleaned[0], 10);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Recognize all digits from processed cells
 */
export async function recognizeGrid(cells, onProgress = () => {}) {
  if (!worker) await initializeOCR();

  const grid = Array(9).fill(null).map(() => Array(9).fill(0));

  // Find cells with content
  const cellsToProcess = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].hasContent && hasDigit(cells[i].canvas)) {
      cellsToProcess.push({ index: i, canvas: cells[i].canvas });
    }
  }

  onProgress(0.1);

  // Process each cell
  for (let i = 0; i < cellsToProcess.length; i++) {
    const { index, canvas } = cellsToProcess[i];
    const row = Math.floor(index / 9);
    const col = index % 9;

    grid[row][col] = await recognizeDigit(canvas);
    onProgress(0.1 + 0.9 * ((i + 1) / cellsToProcess.length));
  }

  return grid;
}
