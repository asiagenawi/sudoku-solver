/**
 * ImageUpload Component
 * File upload handler for sudoku images
 */

import { useRef } from 'react';
import './ImageUpload.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUpload({ onUpload, onError }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      onError('Image file is too large. Please use an image under 10MB.');
      return;
    }

    try {
      // Load image and convert to canvas
      const canvas = await fileToCanvas(file);
      onUpload(canvas);
    } catch (err) {
      console.error('Upload error:', err);
      onError('Failed to load image. Please try another file.');
    }

    // Reset input for same file selection
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    if (file.size > MAX_SIZE) {
      onError('Image file is too large. Please use an image under 10MB.');
      return;
    }

    try {
      const canvas = await fileToCanvas(file);
      onUpload(canvas);
    } catch (err) {
      console.error('Drop error:', err);
      onError('Failed to load image. Please try another file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="image-upload"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleChange}
        hidden
      />

      <div className="upload-content">
        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="upload-text">Click or drag to upload an image</p>
        <p className="upload-hint">JPEG, PNG, WebP, or GIF (max 10MB)</p>
      </div>
    </div>
  );
}

/**
 * Convert a File to a canvas element
 * @param {File} file
 * @returns {Promise<HTMLCanvasElement>}
 */
async function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}
