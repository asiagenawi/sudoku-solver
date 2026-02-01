/**
 * Image Preprocessing for OCR
 * Prepares sudoku images for better digit recognition
 */

const MAX_DIMENSION = 900;

/**
 * Load an image from a source (File, Blob, or URL)
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
 * Create a canvas from an image, resizing to square
 */
export function imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Make it square and reasonable size
  const size = Math.min(MAX_DIMENSION, Math.max(img.width, img.height));
  canvas.width = size;
  canvas.height = size;

  // Fill white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  // Draw image centered and scaled to fit
  const scale = Math.min(size / img.width, size / img.height);
  const x = (size - img.width * scale) / 2;
  const y = (size - img.height * scale) / 2;
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

  return { canvas, ctx };
}

/**
 * Convert to grayscale
 */
export function toGrayscale(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Increase contrast significantly
 */
export function increaseContrast(canvas, factor = 2.0) {
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
 * Apply Otsu's threshold for automatic optimal threshold selection
 */
export function otsuThreshold(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Build histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  const totalPixels = canvas.width * canvas.height;

  // Find optimal threshold using Otsu's method
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  // Apply threshold
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
 * Clean up noise - remove small isolated pixels
 */
export function removeNoise(canvas, minSize = 3) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Simple noise removal: if a black pixel has fewer than minSize black neighbors, make it white
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      if (copy[i] === 0) { // Black pixel
        let blackNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ni = ((y + dy) * width + (x + dx)) * 4;
            if (copy[ni] === 0) blackNeighbors++;
          }
        }
        if (blackNeighbors < minSize) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Full preprocessing pipeline
 */
export async function preprocessImage(source) {
  const img = await loadImage(source);
  const { canvas } = imageToCanvas(img);

  toGrayscale(canvas);
  increaseContrast(canvas, 2.0);
  otsuThreshold(canvas);
  removeNoise(canvas, 2);

  return canvas;
}

export function canvasToDataURL(canvas) {
  return canvas.toDataURL('image/png');
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}
