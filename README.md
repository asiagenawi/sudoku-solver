# Sudoku Solver

A client-side web app that solves sudoku puzzles from images. Capture with your camera or upload an image to get the solution instantly.

## Features

- Camera capture with alignment guide
- Image upload (drag & drop supported)
- OCR digit recognition using Tesseract.js
- Backtracking solver algorithm
- Mobile-friendly responsive design

## Tech Stack

- React 18 + Vite
- Tesseract.js v5 for OCR
- CSS Grid for layout
- No backend required

## Getting Started

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready to deploy to any static hosting.

## How It Works

1. **Image Preprocessing**: Converts image to grayscale, increases contrast, applies adaptive threshold
2. **Grid Detection**: Divides the image into 81 cells with padding to avoid grid lines
3. **OCR**: Uses Tesseract.js to recognize digits in each cell
4. **Solver**: Backtracking algorithm finds the solution
5. **Display**: Shows solved grid with original digits in black and solved digits in blue
