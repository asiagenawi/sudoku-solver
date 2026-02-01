/**
 * OCR Service using Tesseract.js
 * Recognizes digits from sudoku cell images
 */

import Tesseract from 'tesseract.js';

let worker = null;

/**
 * Initialize the Tesseract worker
 * @returns {Promise<void>}
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
    tessedit_pageseg_mode: '10', // Single character mode
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
 * Enhance cell image for better OCR
 * @param {HTMLCanvasElement} canvas
 * @returns {HTMLCanvasElement}
 */
function enhanceCell(canvas) {
  const size = 80; // Larger size for better recognition
  const enhanced = document.createElement('canvas');
  enhanced.width = size;
  enhanced.height = size;
  const ctx = enhanced.getContext('2d');

  // White background with padding
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  // Draw centered with padding
  const padding = 10;
  ctx.drawImage(canvas, padding, padding, size - padding * 2, size - padding * 2);

  // Increase contrast
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Simple threshold to make digits more distinct
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const value = avg < 140 ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
  return enhanced;
}

/**
 * Check if cell likely contains a digit
 * @param {HTMLCanvasElement} canvas
 * @returns {boolean}
 */
function hasDigit(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let darkPixels = 0;
  const totalPixels = canvas.width * canvas.height;

  // Check center region more heavily (where digit would be)
  const margin = Math.floor(canvas.width * 0.2);

  for (let y = margin; y < canvas.height - margin; y++) {
    for (let x = margin; x < canvas.width - margin; x++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] < 128) {
        darkPixels++;
      }
    }
  }

  const centerPixels = (canvas.width - 2 * margin) * (canvas.height - 2 * margin);
  return (darkPixels / centerPixels) > 0.03;
}

/**
 * Recognize a single digit
 * @param {HTMLCanvasElement} cellCanvas
 * @returns {Promise<number>}
 */
async function recognizeDigit(cellCanvas) {
  if (!worker) {
    await initializeOCR();
  }

  const enhanced = enhanceCell(cellCanvas);

  try {
    const { data: { text, confidence } } = await worker.recognize(enhanced);
    const cleaned = text.trim();

    // Extract first valid digit
    const match = cleaned.match(/[1-9]/);
    if (match && confidence > 15) {
      return parseInt(match[0], 10);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Recognize all digits from processed cells
 * @param {{ canvas: HTMLCanvasElement, hasContent: boolean }[]} cells
 * @param {function} onProgress
 * @returns {Promise<number[][]>}
 */
export async function recognizeGrid(cells, onProgress = () => {}) {
  if (!worker) {
    await initializeOCR();
  }

  const grid = Array(9).fill(null).map(() => Array(9).fill(0));

  // Find cells that actually have content
  const cellsToProcess = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].hasContent && hasDigit(cells[i].canvas)) {
      cellsToProcess.push({
        index: i,
        canvas: cells[i].canvas
      });
    }
  }

  onProgress(0.05);

  // Process only cells with digits
  for (let i = 0; i < cellsToProcess.length; i++) {
    const { index, canvas } = cellsToProcess[i];
    const row = Math.floor(index / 9);
    const col = index % 9;

    grid[row][col] = await recognizeDigit(canvas);
    onProgress(0.05 + 0.95 * ((i + 1) / cellsToProcess.length));
  }

  return grid;
}
