"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Loader2, Zap, Package } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarcodeDetectionOverlay } from "@/components/barcode/BarcodeDetectionOverlay";
import { CameraManager } from "@/lib/barcode/camera";
import { BarcodeDetector } from "@/lib/barcode/detector";
import { BarcodeTracker } from "@/lib/barcode/tracker";
import { ImageProcessor } from "@/lib/barcode/imageProcessor";
import type { DetectedBarcode, ScannerState } from "@/lib/barcode/types";

interface BarcodeSkuScannerProps {
  open: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

/**
 * Simplified AI-powered barcode scanner for SKU scanning only
 * No product lookup - just returns the barcode value
 */
export function BarcodeSkuScanner({
  open,
  onClose,
  onBarcodeScanned,
}: BarcodeSkuScannerProps) {
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [detectedBarcode, setDetectedBarcode] = useState<DetectedBarcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectionInfo, setDetectionInfo] = useState<string>("Initializing...");
  const [currentZoom, setCurrentZoom] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const trackerRef = useRef<BarcodeTracker | null>(null);
  const imageProcessorRef = useRef<ImageProcessor | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  // Last frame's barcode region — feeds the fast region-of-interest crop and,
  // once misses pile up, the image-enhancement fallback (see detectSmart).
  const lastKnownBoxRef = useRef<DetectedBarcode["boundingBox"] | null>(null);
  const consecutiveMissesRef = useRef(0);

  useEffect(() => {
    if (open) {
      cameraManagerRef.current = new CameraManager();
      barcodeDetectorRef.current = new BarcodeDetector("all");
      trackerRef.current = new BarcodeTracker(5, 2000);
      imageProcessorRef.current = new ImageProcessor();
      lastKnownBoxRef.current = null;
      consecutiveMissesRef.current = 0;

      const strategies = barcodeDetectorRef.current.getAvailableStrategies();
      console.log("Available detection strategies:", strategies);
      
      if (barcodeDetectorRef.current.hasNativeSupport()) {
        setDetectionInfo("Using native AI detection");
      } else {
        setDetectionInfo("Using advanced ML detection");
      }
    }

    return () => {
      cleanup();
    };
  }, [open]);

  useEffect(() => {
    if (open && videoRef.current && scannerState === "idle") {
      startScanning();
    }
  }, [open]);

  const startScanning = async () => {
    if (!videoRef.current || !cameraManagerRef.current) return;

    setScannerState("initializing");
    setCameraError(null);
    setDetectionInfo("Starting camera...");

    try {
      await cameraManagerRef.current.startCamera(videoRef.current, "environment");
      
      setDetectionInfo("Camera ready - searching for barcode...");
      setScannerState("searching");

      startDetectionLoop();
    } catch (error: any) {
      console.error("Failed to start camera:", error);
      setCameraError(error.message);
      setScannerState("error");
      setDetectionInfo("Camera failed");
    }
  };

  const startDetectionLoop = () => {
    if (!videoRef.current || !barcodeDetectorRef.current || !trackerRef.current) return;

    let frameCount = 0;
    const targetFPS = 10;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const detect = async (timestamp: number) => {
      if (scannerState === "success" || scannerState === "error" || !videoRef.current) {
        return;
      }

      if (timestamp - lastFrameTime < frameInterval) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      lastFrameTime = timestamp;
      frameCount++;

      if (isProcessingRef.current) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      isProcessingRef.current = true;

      try {
        // Detect barcode — a fast crop around last frame's region first, a
        // full-frame pass if that misses, and (once misses pile up) enhanced
        // grayscale/contrast/sharpen variants of that region as a last resort.
        const result = await barcodeDetectorRef.current!.detectSmart(videoRef.current, {
          lastKnownBox: lastKnownBoxRef.current ?? undefined,
          allowEnhancement: consecutiveMissesRef.current >= 3,
          imageProcessor: imageProcessorRef.current ?? undefined,
        });

        if (result.success && result.barcode) {
          const barcode = result.barcode;
          consecutiveMissesRef.current = 0;
          if (barcode.boundingBox) {
            lastKnownBoxRef.current = barcode.boundingBox;
          }

          setDetectedBarcode(barcode);

          const isStable = trackerRef.current!.track(barcode);

          if (isStable) {
            setScannerState("scanning");
            setDetectionInfo(`✓ Barcode locked: ${barcode.rawValue}`);
            
            await handleAutoZoom(barcode);

            if (detectionLoopRef.current) {
              cancelAnimationFrame(detectionLoopRef.current);
              detectionLoopRef.current = null;
            }

            captureBarcode(barcode.rawValue);
            return;
          } else {
            const trackingInfo = trackerRef.current!.getTrackingInfo(barcode.rawValue);
            if (trackingInfo) {
              setScannerState("detected");
              setDetectionInfo(
                `Barcode detected (${trackingInfo.frameCount}/5) - hold steady...`
              );

              await handleAutoZoom(barcode);
            }
          }
        } else {
          consecutiveMissesRef.current++;
          // The tracked region is only worth cropping to for a couple of
          // seconds — past that the barcode has likely moved or left frame,
          // so drop it and go back to scanning the whole picture.
          if (consecutiveMissesRef.current > 20) {
            lastKnownBoxRef.current = null;
          }

          if (frameCount % 30 === 0) {
            setDetectionInfo("Searching for barcode...");
          }

          if (detectedBarcode) {
            setDetectedBarcode(null);
            setScannerState("searching");
          }
        }
      } catch (error) {
        console.error("Detection error:", error);
      } finally {
        isProcessingRef.current = false;
      }

      detectionLoopRef.current = requestAnimationFrame(detect);
    };

    detectionLoopRef.current = requestAnimationFrame(detect);
  };

  const handleAutoZoom = async (barcode: DetectedBarcode) => {
    if (!cameraManagerRef.current || !imageProcessorRef.current || !videoRef.current) return;

    const box = barcode.boundingBox;
    if (!box) return;

    const barcodeSize = imageProcessorRef.current.getBarcodeSize(
      box,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );

    const zoomed = await cameraManagerRef.current.autoZoom(barcodeSize, 50);
    
    if (zoomed) {
      const newZoom = cameraManagerRef.current.getCurrentZoom();
      setCurrentZoom(newZoom);
    }
  };

  const captureBarcode = (barcodeValue: string) => {
    setDetectionInfo(`✓ Scanned: ${barcodeValue}`);
    setScannerState("success");
    toast.success(`Barcode scanned: ${barcodeValue}`);
    
    setTimeout(() => {
      onBarcodeScanned(barcodeValue);
      handleClose();
    }, 500);
  };

  const handleGalleryUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setDetectionInfo("Processing image...");
    stopDetectionLoop();

    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);

      img.onload = async () => {
        if (!barcodeDetectorRef.current) {
          URL.revokeObjectURL(imageUrl);
          return;
        }

        // The Quagga2 fallback strategy re-fetches the image via `img.src`
        // internally, so the blob URL must stay valid until detection fully
        // completes — revoking it before detect() left Quagga loading a
        // dead URL, producing NaN image dimensions.
        const result = await barcodeDetectorRef.current.detect(img);
        URL.revokeObjectURL(imageUrl);

        if (result.success && result.barcode) {
          captureBarcode(result.barcode.rawValue);
        } else {
          setDetectionInfo("No barcode found in image");
          toast.error("Couldn't read a barcode from this image");
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setDetectionInfo("Failed to load image");
        toast.error("Failed to load image");
      };

      img.src = imageUrl;
    } catch (error: any) {
      console.error("Gallery upload error:", error);
      toast.error("Failed to process image");
    }

    event.target.value = "";
  };

  const handleClose = () => {
    cleanup();
    setDetectedBarcode(null);
    setCameraError(null);
    setDetectionInfo("Initializing...");
    setScannerState("idle");
    setCurrentZoom(1);
    onClose();
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

    if (imageProcessorRef.current) {
      imageProcessorRef.current.dispose();
    }

    if (trackerRef.current) {
      trackerRef.current.clear();
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={handleClose} />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 bg-gradient-to-r from-[var(--color-accent-custom-50,#f0fdf4)] to-[var(--color-accent-custom-100,#dcfce7)] dark:from-[var(--color-accent-custom-950,#052e16)] dark:to-[var(--color-accent-custom-900,#14532d)]">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[var(--color-accent-custom-100,#dcfce7)] dark:bg-[var(--color-accent-custom-900,#14532d)] rounded-lg">
                <Camera className="h-5 w-5 text-[var(--color-accent-custom-600,#16A34A)] dark:text-[var(--color-accent-custom-400,#4ade80)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Scan Barcode</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">{detectionInfo}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {cameraError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-red-800 dark:text-red-200">{cameraError}</p>
                <Button
                  onClick={startScanning}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            )}

            {!cameraError && (
              <div className="space-y-3">
                <div
                  className="rounded-lg overflow-hidden border-2 border-[var(--color-accent-custom,#22C55E)] bg-black relative"
                  style={{ height: "400px" }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  <BarcodeDetectionOverlay
                    videoElement={videoRef.current}
                    detectedBarcode={detectedBarcode}
                    scannerState={scannerState}
                  />

                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                      {scannerState === "searching" && (
                        <>
                          <Loader2 className="h-3 w-3 text-[var(--color-accent-custom-400,#4ade80)] animate-spin" />
                          <span className="text-xs text-white font-medium">Searching...</span>
                        </>
                      )}
                      {scannerState === "detected" && (
                        <>
                          <Zap className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-white font-medium">Detected</span>
                        </>
                      )}
                      {scannerState === "scanning" && (
                        <>
                          <Zap className="h-3 w-3 text-[var(--color-accent-custom-400,#4ade80)] animate-pulse" />
                          <span className="text-xs text-white font-medium">Scanning...</span>
                        </>
                      )}
                      {scannerState === "success" && (
                        <>
                          <Zap className="h-3 w-3 text-[var(--color-accent-custom-400,#4ade80)]" />
                          <span className="text-xs text-white font-medium">Success!</span>
                        </>
                      )}
                    </div>

                    {currentZoom > 1 && (
                      <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <span className="text-xs text-white font-medium">
                          {currentZoom.toFixed(1)}x
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {scannerState === "searching" && (
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Point camera at barcode</strong> - detection happens automatically!
                    </p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGalleryUpload}
                  disabled={scannerState === "scanning"}
                  variant="outline"
                  className="w-full gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-100"
                >
                  <Package className="h-4 w-4" />
                  Upload from Gallery
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
