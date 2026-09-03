"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Package, TrendingUp, TrendingDown, Camera, Plus, Zap, Loader2 } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { toast } from "sonner";
import { BarcodeDetectionOverlay } from "@/components/barcode/BarcodeDetectionOverlay";
import { CameraManager } from "@/lib/barcode/camera";
import { BarcodeDetector } from "@/lib/barcode/detector";
import { BarcodeTracker } from "@/lib/barcode/tracker";
import { ImageProcessor } from "@/lib/barcode/imageProcessor";
import type { DetectedBarcode, ScannerState } from "@/lib/barcode/types";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: number;
  onProductScanned?: (product: Product, action: "received" | "sold") => void;
}

export function BarcodeScannerModal({
  open,
  onClose,
  warehouseId,
  onProductScanned,
}: BarcodeScannerModalProps) {
  const router = useRouter();
  
  // State
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [detectedBarcode, setDetectedBarcode] = useState<DetectedBarcode | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedBarcodeValue, setScannedBarcodeValue] = useState<string>("");
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectionInfo, setDetectionInfo] = useState<string>("Initializing...");
  const [currentZoom, setCurrentZoom] = useState(1);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const trackerRef = useRef<BarcodeTracker | null>(null);
  const imageProcessorRef = useRef<ImageProcessor | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  // Initialize services
  useEffect(() => {
    if (open) {
      cameraManagerRef.current = new CameraManager();
      barcodeDetectorRef.current = new BarcodeDetector("all");
      trackerRef.current = new BarcodeTracker(5, 2000); // 5 frames, 2s timeout
      imageProcessorRef.current = new ImageProcessor();

      // Log available detection strategies
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

  // Start camera when modal opens
  useEffect(() => {
    if (open && videoRef.current && scannerState === "idle") {
      startScanning();
    }
  }, [open]);

  /**
   * Start camera and detection
   */
  const startScanning = async () => {
    if (!videoRef.current || !cameraManagerRef.current) return;

    setScannerState("initializing");
    setCameraError(null);
    setDetectionInfo("Starting camera...");

    try {
      // Ensure video element is ready
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }

      // Start camera
      await cameraManagerRef.current.startCamera(videoRef.current, "environment");
      
      setDetectionInfo("Camera ready - searching for barcode...");
      setScannerState("searching");

      // Start detection loop
      startDetectionLoop();
    } catch (error: any) {
      console.error("Failed to start camera:", error);
      setCameraError(error.message);
      setScannerState("error");
      setDetectionInfo("Camera failed");
    }
  };

  /**
   * Start detection loop with enhanced position detection
   */
  const startDetectionLoop = () => {
    if (!videoRef.current || !barcodeDetectorRef.current || !trackerRef.current) return;

    let frameCount = 0;
    const targetFPS = 15; // Increased from 10 for faster detection
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const detect = async (timestamp: number) => {
      if (scannerState === "success" || scannerState === "error" || !videoRef.current) {
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

          // Immediately start auto-zoom when barcode is detected (even before stable)
          await handleAutoZoom(barcode);

          // Track detection for stability
          const isStable = trackerRef.current!.track(barcode);

          if (isStable) {
            // Stable detection - trigger capture
            setScannerState("scanning");
            setDetectionInfo(`✓ Barcode locked: ${barcode.rawValue}`);
            
            // Final zoom adjustment for optimal size
            await handleAutoZoom(barcode);

            // Stop detection loop
            if (detectionLoopRef.current) {
              cancelAnimationFrame(detectionLoopRef.current);
              detectionLoopRef.current = null;
            }

            // Capture and process
            await captureBarcode(barcode.rawValue);
            return;
          } else {
            // Still tracking
            const trackingInfo = trackerRef.current!.getTrackingInfo(barcode.rawValue);
            if (trackingInfo) {
              setScannerState("detected");
              setDetectionInfo(
                `Barcode detected (${trackingInfo.frameCount}/${5}) - zooming and stabilizing...`
              );
            }
          }
        } else {
          // No barcode detected
          if (frameCount % 45 === 0) {
            // Log every 3 seconds (45 frames at 15 FPS)
            setDetectionInfo("Searching for barcode at any position...");
          }
          
          // Clear detection if no barcode for a while
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

  /**
   * Capture and process barcode
   */
  const captureBarcode = async (barcodeValue: string) => {
    setScannedBarcodeValue(barcodeValue);
    setDetectionInfo(`Processing: ${barcodeValue}`);

    try {
      // Search for product by SKU (barcode)
      const response = await inventoryApi.products.list({ search: barcodeValue });
      const products = response.data?.results || [];

      // Find product with exact SKU match
      const product = products.find(
        (p: Product) => p.sku.trim().toLowerCase() === barcodeValue.toLowerCase()
      );

      if (product) {
        setScannedProduct(product);
        setScannerState("success");
        setDetectionInfo(`✓ Product found: ${product.name}`);
        toast.success(`Product found: ${product.name}`);
      } else {
        // Product not found
        setScannerState("error");
        setDetectionInfo("Product not found");
        setShowAddProductDialog(true);
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      setScannerState("error");
      setDetectionInfo("Error looking up product");
      toast.error("Error looking up product");
    }
  };

  /**
   * Handle gallery upload
   */
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
        URL.revokeObjectURL(imageUrl);

        if (!barcodeDetectorRef.current) return;

        // Try to detect barcode from image
        const result = await barcodeDetectorRef.current.detect(img);

        if (result.success && result.barcode) {
          await captureBarcode(result.barcode.rawValue);
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

  /**
   * Handle action (received/sold)
   */
  const handleAction = async (action: "received" | "sold") => {
    if (!scannedProduct) return;

    setProcessing(true);
    try {
      if (action === "received") {
        // Stock IN
        await inventoryApi.operations.stockIn({
          product: Number(scannedProduct.id),
          warehouse: warehouseId,
          quantity: quantity.toString(),
          reason: "Barcode scan - received",
          notes: `Scanned barcode: ${scannedProduct.sku}`,
        });
        toast.success(`Added ${quantity} unit(s) of ${scannedProduct.name} to inventory`);
        handleClose();
      } else {
        // Stock OUT (or pass to checkout for sale)
        if (onProductScanned) {
          onProductScanned(scannedProduct, action);
          handleClose();
        }
      }
    } catch (error: any) {
      console.error("Action error:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        `Failed to process ${action}`;
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    cleanup();
    setScannedProduct(null);
    setScannedBarcodeValue("");
    setShowAddProductDialog(false);
    setQuantity(1);
    setCameraError(null);
    setDetectionInfo("Initializing...");
    setScannerState("idle");
    setDetectedBarcode(null);
    setCurrentZoom(1);
    onClose();
  };

  /**
   * Handle rescan
   */
  const handleRescan = () => {
    setScannedProduct(null);
    setScannedBarcodeValue("");
    setShowAddProductDialog(false);
    setQuantity(1);
    setDetectedBarcode(null);
    setScannerState("idle");
    
    if (trackerRef.current) {
      trackerRef.current.clear();
    }

    startScanning();
  };

  /**
   * Handle add product
   */
  const handleAddProduct = () => {
    router.push(
      `/dashboard/inventory/products/new?sku=${encodeURIComponent(scannedBarcodeValue)}`
    );
    handleClose();
  };

  /**
   * Stop detection loop
   */
  const stopDetectionLoop = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
  };

  /**
   * Cleanup
   */
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-40" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Camera className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI Barcode Scanner</h2>
                <p className="text-xs text-gray-600">{detectionInfo}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Camera Error */}
            {cameraError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-red-800">{cameraError}</p>
                <Button
                  onClick={startScanning}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Camera View */}
            {!cameraError && !scannedProduct && (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden border-2 border-green-500 bg-black relative" style={{ minHeight: "300px" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ maxHeight: "400px" }}
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
                      {scannerState === "searching" && (
                        <>
                          <Loader2 className="h-3 w-3 text-green-400 animate-spin" />
                          <span className="text-xs text-white font-medium">Searching...</span>
                        </>
                      )}
                      {scannerState === "detected" && (
                        <>
                          <Zap className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-white font-medium">Detected</span>
                        </>
                      )}
                      {scannerState === "stabilizing" && (
                        <>
                          <Loader2 className="h-3 w-3 text-orange-400 animate-spin" />
                          <span className="text-xs text-white font-medium">Stabilizing...</span>
                        </>
                      )}
                      {scannerState === "scanning" && (
                        <>
                          <Zap className="h-3 w-3 text-emerald-400 animate-pulse" />
                          <span className="text-xs text-white font-medium">Scanning...</span>
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
                </div>

                {scannerState === "searching" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Point camera at barcode</strong> - Auto-zoom and detection happen automatically at any position!
                    </p>
                  </div>
                )}

                {/* Gallery Upload Option */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGalleryUpload}
                  disabled={scannerState === "scanning"}
                  variant="outline"
                  className="w-full gap-2"
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

            {/* Product Not Found Dialog */}
            {showAddProductDialog && !scannedProduct && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900">Product doesn't exist</h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      No product found for barcode:{" "}
                      <span className="font-mono font-semibold">{scannedBarcodeValue}</span>
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">Would you like to add it?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddProduct}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                  <Button onClick={handleRescan} variant="outline" className="flex-1" size="sm">
                    Scan Again
                  </Button>
                </div>
              </div>
            )}

            {/* Scanned Product */}
            {scannedProduct && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{scannedProduct.name}</h3>
                      <p className="text-sm text-gray-600">SKU: {scannedProduct.sku}</p>
                      <p className="text-sm text-gray-600">
                        Current Stock: {scannedProduct.current_stock || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction("received")}
                    disabled={processing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Received
                  </Button>
                  <Button
                    onClick={() => handleAction("sold")}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <TrendingDown className="h-4 w-4" />
                    Sold
                  </Button>
                </div>

                {/* Rescan Button */}
                <Button
                  onClick={handleRescan}
                  disabled={processing}
                  variant="outline"
                  className="w-full"
                >
                  Scan Another
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
