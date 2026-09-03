'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Scan, Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { CameraManager } from '@/lib/barcode/camera';
import { BarcodeDetector } from '@/lib/barcode/detector';
import { BarcodeTracker } from '@/lib/barcode/tracker';
import { BarcodeDetectionOverlay } from '@/components/barcode/BarcodeDetectionOverlay';
import type { DetectedBarcode, ScannerState } from '@/lib/barcode/types';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const trackerRef = useRef<BarcodeTracker | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [detectedBarcode, setDetectedBarcode] = useState<DetectedBarcode | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [detectionInfo, setDetectionInfo] = useState<string>('Initializing...');
  const [currentZoom, setCurrentZoom] = useState(1);

  // Initialize services
  useEffect(() => {
    cameraManagerRef.current = new CameraManager();
    barcodeDetectorRef.current = new BarcodeDetector('all');
    trackerRef.current = new BarcodeTracker(5, 2000); // 5 frames, 2s timeout

    const strategies = barcodeDetectorRef.current.getAvailableStrategies();
    console.log('Available detection strategies:', strategies);

    if (barcodeDetectorRef.current.hasNativeSupport()) {
      setDetectionInfo('Using native AI detection');
    } else {
      setDetectionInfo('Using advanced ML detection');
    }

    startCamera();

    return () => {
      cleanup();
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current || !cameraManagerRef.current) return;

    setScannerState('initializing');
    setError('');
    setDetectionInfo('Starting camera...');

    try {
      // Ensure video element is ready
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }

      await cameraManagerRef.current.startCamera(videoRef.current, 'environment');

      setDetectionInfo('Camera ready - searching for barcode...');
      setScannerState('searching');
      setCameraActive(true);

      // Start detection loop
      startDetectionLoop();
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setError(err.message);
      setScannerState('error');
      setDetectionInfo('Camera failed');
      toast.error('Camera access failed. Please allow camera permissions.');
    }
  };

  const startDetectionLoop = () => {
    if (!videoRef.current || !barcodeDetectorRef.current || !trackerRef.current) return;

    let frameCount = 0;
    const targetFPS = 15; // Faster detection rate
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const detect = async (timestamp: number) => {
      if (scannerState === 'success' || scannerState === 'error' || !videoRef.current) {
        return;
      }

      // Throttle detection
      if (timestamp - lastFrameTime < frameInterval) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      lastFrameTime = timestamp;
      frameCount++;

      // Skip if already processing
      if (isProcessingRef.current) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      isProcessingRef.current = true;

      try {
        // Detect barcode
        const result = await barcodeDetectorRef.current!.detect(videoRef.current);

        if (result.success && result.barcode) {
          const barcode = result.barcode;

          // Update detected barcode for overlay
          setDetectedBarcode(barcode);

          // Immediately start auto-zoom when barcode is detected
          await handleAutoZoom(barcode);

          // Track detection for stability
          const isStable = trackerRef.current!.track(barcode);

          if (isStable) {
            // Stable detection - trigger capture
            setScannerState('success');
            setDetectionInfo(`✓ Barcode captured: ${barcode.rawValue}`);

            // Stop detection loop
            stopDetectionLoop();

            // Notify parent
            onScanSuccess(barcode.rawValue);
            return;
          } else {
            // Still tracking
            const trackingInfo = trackerRef.current!.getTrackingInfo(barcode.rawValue);
            if (trackingInfo) {
              setScannerState('detected');
              setDetectionInfo(
                `Barcode detected (${trackingInfo.frameCount}/5) - zooming and stabilizing...`
              );
            }
          }
        } else {
          // No barcode detected
          if (frameCount % 45 === 0) {
            setDetectionInfo('Searching for barcode at any position...');
          }

          // Clear detection if no barcode for a while
          if (detectedBarcode) {
            setDetectedBarcode(null);
            setScannerState('searching');
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      } finally {
        isProcessingRef.current = false;
      }

      // Continue loop
      detectionLoopRef.current = requestAnimationFrame(detect);
    };

    // Start loop
    detectionLoopRef.current = requestAnimationFrame(detect);
  };

  /**
   * Handle auto zoom based on barcode size AND position
   */
  const handleAutoZoom = async (barcode: DetectedBarcode) => {
    if (!cameraManagerRef.current || !videoRef.current) return;

    const box = barcode.boundingBox;
    if (!box) return;

    // Use smart auto-zoom that considers both size and position
    const zoomed = await cameraManagerRef.current.smartAutoZoom(
      barcode,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight,
      40 // Target 40% of frame for better detection at any position
    );

    if (zoomed) {
      const newZoom = cameraManagerRef.current.getCurrentZoom();
      setCurrentZoom(newZoom);
      console.log(`Auto-zoomed to ${newZoom.toFixed(2)}x for better barcode detection`);
    }
  };

  const stopDetectionLoop = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
  };

  const cleanup = () => {
    stopDetectionLoop();

    if (cameraManagerRef.current) {
      cameraManagerRef.current.stopCamera();
    }

    if (trackerRef.current) {
      trackerRef.current.clear();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
          <Scan className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Point your camera at the barcode
        </p>
        <p className="text-xs text-gray-500">
          {detectionInfo}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 space-y-2">
          <p>{error}</p>
          <Button
            onClick={startCamera}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Scanner Container */}
      {!error && (
        <div className="rounded-lg overflow-hidden border-2 border-[#22C55E] bg-black relative" style={{ minHeight: '300px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ maxHeight: '400px' }}
          />

          {/* Detection Overlay */}
          <BarcodeDetectionOverlay
            videoElement={videoRef.current}
            detectedBarcode={detectedBarcode}
            scannerState={scannerState}
          />

          {/* State Indicators */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
              {scannerState === 'searching' && (
                <>
                  <Loader2 className="h-3 w-3 text-green-400 animate-spin" />
                  <span className="text-xs text-white font-medium">Searching...</span>
                </>
              )}
              {scannerState === 'detected' && (
                <>
                  <Zap className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-white font-medium">Detected</span>
                </>
              )}
              {scannerState === 'stabilizing' && (
                <>
                  <Loader2 className="h-3 w-3 text-orange-400 animate-spin" />
                  <span className="text-xs text-white font-medium">Stabilizing...</span>
                </>
              )}
              {scannerState === 'success' && (
                <>
                  <Zap className="h-3 w-3 text-emerald-400 animate-pulse" />
                  <span className="text-xs text-white font-medium">Captured!</span>
                </>
              )}
            </div>

            {/* Zoom indicator */}
            {currentZoom > 1 && (
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="text-xs text-white font-medium">{currentZoom.toFixed(1)}x</span>
              </div>
            )}
          </div>

          {!cameraActive && scannerState === 'initializing' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-white text-sm">Starting camera...</div>
            </div>
          )}
        </div>
      )}

      {cameraActive && scannerState === 'searching' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Point camera at barcode</strong> - Auto-zoom and detection happen automatically at any position!
          </p>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="w-full max-w-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}
