/**
 * Image Preprocessing for OCR
 * Prepares sudoku images for better digit recognition
 */

const MAX_DIMENSION = 1000;

/**
 * Load an image from a source (File, Blob, or URL)
 * @param {File|Blob|string} source - Image source
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));

    if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Invalid image source'));
    }
  });
}

/**
 * Create a canvas from an image, resizing if necessary
 * @param {HTMLImageElement} img - Source image
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let { width, height } = img;

  // Resize if too large
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  return { canvas, ctx };
}

/**
 * Convert image to grayscale
 * @param {HTMLCanvasElement} canvas - Source canvas
 * @returns {HTMLCanvasElement} - Grayscale canvas
 */
export function toGrayscale(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Luminosity method for grayscale
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha stays the same
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Increase image contrast
 * @param {HTMLCanvasElement} canvas - Source canvas
 * @param {number} factor - Contrast factor (1 = no change, >1 = more contrast)
 * @returns {HTMLCanvasElement}
 */
export function increaseContrast(canvas, factor = 1.5) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * data[i] + intercept);
    data[i + 1] = clamp(factor * data[i + 1] + intercept);
    data[i + 2] = clamp(factor * data[i + 2] + intercept);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Apply threshold to convert image to black and white
 * @param {HTMLCanvasElement} canvas - Source canvas (should be grayscale)
 * @param {number} threshold - Threshold value (0-255), pixels below become black
 * @returns {HTMLCanvasElement}
 */
export function applyThreshold(canvas, threshold = 128) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] < threshold ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Apply adaptive threshold for better handling of varying lighting
 * @param {HTMLCanvasElement} canvas - Source canvas (should be grayscale)
 * @param {number} blockSize - Size of the local neighborhood (odd number)
 * @param {number} c - Constant subtracted from mean
 * @returns {HTMLCanvasElement}
 */
export function adaptiveThreshold(canvas, blockSize = 15, c = 10) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create grayscale array
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = data[i * 4];
  }

  // Calculate integral image for fast mean calculation
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] =
        integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  const halfBlock = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - halfBlock);
      const y1 = Math.max(0, y - halfBlock);
      const x2 = Math.min(width - 1, x + halfBlock);
      const y2 = Math.min(height - 1, y + halfBlock);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum = integral[(y2 + 1) * (width + 1) + (x2 + 1)]
                - integral[(y2 + 1) * (width + 1) + x1]
                - integral[y1 * (width + 1) + (x2 + 1)]
                + integral[y1 * (width + 1) + x1];

      const mean = sum / count;
      const idx = (y * width + x) * 4;
      const value = gray[y * width + x] > mean - c ? 255 : 0;

      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Clamp value to 0-255 range
 * @param {number} value
 * @returns {number}
 */
function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Full preprocessing pipeline
 * @param {File|Blob|string} source - Image source
 * @param {Object} options - Preprocessing options
 * @returns {Promise<HTMLCanvasElement>} - Preprocessed canvas
 */
export async function preprocessImage(source, options = {}) {
  const {
    useAdaptiveThreshold = true,
    contrastFactor = 1.5,
    threshold = 128,
    adaptiveBlockSize = 15,
    adaptiveC = 10
  } = options;

  const img = await loadImage(source);
  const { canvas } = imageToCanvas(img);

  // Convert to grayscale
  toGrayscale(canvas);

  // Increase contrast
  increaseContrast(canvas, contrastFactor);

  // Apply threshold
  if (useAdaptiveThreshold) {
    adaptiveThreshold(canvas, adaptiveBlockSize, adaptiveC);
  } else {
    applyThreshold(canvas, threshold);
  }

  return canvas;
}

/**
 * Get canvas as data URL
 * @param {HTMLCanvasElement} canvas
 * @returns {string}
 */
export function canvasToDataURL(canvas) {
  return canvas.toDataURL('image/png');
}

/**
 * Get canvas as Blob
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}
