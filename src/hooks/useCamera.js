/**
 * useCamera Hook
 * Provides camera access for capturing sudoku images
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export function useCamera() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Check for available cameras
  useEffect(() => {
    async function checkCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (err) {
        console.warn('Could not enumerate devices:', err);
      }
    }
    checkCameras();
  }, []);

  /**
   * Start the camera stream
   */
  const startCamera = useCallback(async () => {
    setError(null);

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      console.error('Camera error:', err);

      let errorMessage = 'Could not access camera';

      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        // Try again with basic constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setIsActive(true);
          return;
        } catch {
          errorMessage = 'Could not access camera with requested settings.';
        }
      }

      setError(errorMessage);
      setIsActive(false);
    }
  }, [facingMode]);

  /**
   * Stop the camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, []);

  /**
   * Switch between front and rear cameras
   */
  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);

    if (isActive) {
      // Restart with new facing mode
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Error switching camera:', err);
        setError('Could not switch camera');
      }
    }
  }, [facingMode, isActive]);

  /**
   * Capture current frame as canvas
   * @returns {HTMLCanvasElement | null}
   */
  const capture = useCallback(() => {
    if (!videoRef.current || !isActive) {
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    return canvas;
  }, [isActive]);

  /**
   * Capture current frame as data URL
   * @returns {string | null}
   */
  const captureAsDataURL = useCallback(() => {
    const canvas = capture();
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, [capture]);

  /**
   * Capture current frame as Blob
   * @returns {Promise<Blob | null>}
   */
  const captureAsBlob = useCallback(async () => {
    const canvas = capture();
    if (!canvas) return null;

    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
  }, [capture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isActive,
    error,
    facingMode,
    hasMultipleCameras,
    startCamera,
    stopCamera,
    switchCamera,
    capture,
    captureAsDataURL,
    captureAsBlob
  };
}
