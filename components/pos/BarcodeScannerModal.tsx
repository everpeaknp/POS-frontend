"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Package, TrendingUp, TrendingDown, Camera, Plus } from "@/lib/icons/lucide-react-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Quagga from "@ericblade/quagga2";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { toast } from "sonner";

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
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerDivRef = useRef<HTMLDivElement | null>(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameCountRef = useRef(0);

  // Initialize and start camera when modal opens
  useEffect(() => {
    if (open && !cameraActive && !isScanningRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (scannerDivRef.current) {
          startCamera();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }

    return () => {
      // Cleanup camera when modal closes
      if (isScanningRef.current) {
        stopCamera();
      }
    };
  }, [open]);

  const startCamera = async () => {
    try {
      // Check if scanner container exists
      if (!scannerDivRef.current) {
        console.error("Scanner container not found");
        setCameraError("Failed to initialize camera view");
        return;
      }

      if (isScanningRef.current) {
        console.log("Scanner already running");
        return;
      }

      setCameraError(null);
      setScanning(true);
      isScanningRef.current = true;

      console.log("Initializing Quagga2 scanner...");

      // Initialize Quagga with optimized settings for product barcodes
      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: scannerDivRef.current!,
              constraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: "environment", // Use back camera
                aspectRatio: { min: 1, max: 2 },
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            decoder: {
              readers: [
                "ean_reader", // EAN-13, EAN-8
                "ean_8_reader",
                "code_128_reader", // Code128
                "code_39_reader", // Code39
                "code_39_vin_reader",
                "codabar_reader", // Codabar
                "upc_reader", // UPC-A
                "upc_e_reader", // UPC-E
                "i2of5_reader", // Interleaved 2 of 5
                "2of5_reader",
                "code_93_reader",
              ],
              multiple: false,
            },
            locate: true,
            frequency: 10,
          },
          (err) => {
            if (err) {
              console.error("Quagga initialization error:", err);
              isScanningRef.current = false;
              setScanning(false);
              setCameraActive(false);
              
              if (err.name === "NotAllowedError") {
                setCameraError("Camera access denied. Please allow camera permissions.");
              } else if (err.name === "NotFoundError") {
                setCameraError("No camera found on this device.");
              } else if (err.name === "NotReadableError") {
                setCameraError("Camera is already in use by another application.");
              } else {
                setCameraError(`Failed to start camera: ${err.message || "Unknown error"}`);
              }
              reject(err);
              return;
            }
            resolve();
          }
        );
      });

      console.log("Quagga initialized successfully");
      
      // DEBUG: Add frame processing callback to see decode attempts
      let lastLogTime = Date.now();
      Quagga.onProcessed((result) => {
        frameCountRef.current++;
        
        // Log every 30 frames (about every 3 seconds at 10fps)
        if (frameCountRef.current % 30 === 0) {
          const now = Date.now();
          const fps = 30 / ((now - lastLogTime) / 1000);
          console.log(`[DEBUG] Processed ${frameCountRef.current} frames (${fps.toFixed(1)} fps)`);
          lastLogTime = now;
        }
        
        // Log if any boxes/codes were found (even failed attempts)
        if (result) {
          if (result.boxes) {
            console.log(`[DEBUG] Frame ${frameCountRef.current}: Found ${result.boxes.length} potential barcode regions`);
          }
          if (result.codeResult) {
            if (result.codeResult.code) {
              console.log(`[DEBUG] Frame ${frameCountRef.current}: Decoded code: "${result.codeResult.code}" (format: ${result.codeResult.format})`);
            } else {
              // Decode attempt but no valid code
              console.log(`[DEBUG] Frame ${frameCountRef.current}: Decode attempted but no valid code found`);
            }
          }
        }
      });
      
      // Register barcode detection handler
      Quagga.onDetected(handleBarcodeDetected);
      
      // Start scanning
      Quagga.start();
      
      console.log("Quagga scanner started - processing frames...");
      console.log("[DEBUG] Watch console for frame processing logs");
      frameCountRef.current = 0;
      setCameraActive(true);
      setScanning(false);
    } catch (error: any) {
      console.error("Camera start error:", error);
      isScanningRef.current = false;
      setScanning(false);
      setCameraActive(false);
      setCameraError(`Failed to start camera: ${error.message || "Unknown error"}`);
    }
  };

  const stopCamera = () => {
    if (isScanningRef.current) {
      try {
        console.log("Stopping Quagga scanner...");
        console.log(`[DEBUG] Total frames processed: ${frameCountRef.current}`);
        Quagga.offProcessed();
        Quagga.offDetected(handleBarcodeDetected);
        Quagga.stop();
        console.log("Quagga scanner stopped");
      } catch (error) {
        console.error("Error stopping scanner:", error);
      } finally {
        isScanningRef.current = false;
        setCameraActive(false);
        frameCountRef.current = 0;
      }
    }
  };

  const handleBarcodeDetected = (result: any) => {
    if (!result || !result.codeResult) {
      console.log("[DEBUG] Detection callback fired but no valid result");
      return;
    }

    const code = result.codeResult.code;
    
    // Only process if we have a valid code
    if (code && code.length > 0) {
      console.log("✅ Barcode detected:", code, "Format:", result.codeResult.format);
      
      // Stop scanning immediately to prevent multiple detections
      stopCamera();
      
      // Process the barcode
      onScanSuccess(code);
    } else {
      console.log("[DEBUG] Detection fired but code is empty or invalid");
    }
  };

  const handleGalleryUpload = () => {
    // Trigger file input click
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Processing image from gallery:", file.name);
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setScanning(true);
    
    try {
      // Create image element
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        console.log("Image loaded, decoding barcode...");
        
        // Decode using Quagga's decodeSingle
        Quagga.decodeSingle(
          {
            src: imageUrl,
            numOfWorkers: 0, // Use main thread for single decode
            locate: true,
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader",
                "2of5_reader",
                "code_93_reader",
              ],
            },
          },
          (result) => {
            URL.revokeObjectURL(imageUrl);
            
            if (result && result.codeResult && result.codeResult.code) {
              console.log("✅ Barcode decoded from image:", result.codeResult.code);
              setScanning(false);
              onScanSuccess(result.codeResult.code);
            } else {
              console.log("❌ No barcode found in image");
              setScanning(false);
              toast.error("Couldn't read a barcode from this image, please try again");
            }
          }
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setScanning(false);
        toast.error("Failed to load image");
      };
      
      img.src = imageUrl;
    } catch (error: any) {
      console.error("Gallery upload error:", error);
      setScanning(false);
      toast.error("Failed to process image");
    }
    
    // Reset file input
    event.target.value = '';
  };

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanning while we process
    stopCamera();

    setScanning(true);
    // Trim whitespace from barcode
    const barcode = decodedText.trim();
    setScannedBarcode(barcode);
    
    try {
      // Search for product by SKU (barcode)
      console.log("Searching for barcode:", barcode);
      const response = await inventoryApi.products.list({ search: barcode });
      console.log("Search response:", response.data);
      const products = response.data?.results || [];
      
      // Find product with case-insensitive SKU match
      const product = products.find((p: Product) => 
        p.sku.trim().toLowerCase() === barcode.toLowerCase()
      );

      if (product) {
        console.log("Product found:", product);
        setScannedProduct(product);
        toast.success(`Product found: ${product.name}`);
      } else {
        console.log("Product not found for barcode:", barcode);
        // Show "Add Product" dialog instead of just error
        setShowAddProductDialog(true);
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
      toast.error("Error looking up product");
      setScannedProduct(null);
      // Restart camera for next scan
      setTimeout(() => startCamera(), 1000);
    } finally {
      setScanning(false);
    }
  };

  const onScanError = (errorMessage: string) => {
    // This function is no longer needed with ZXing but kept for compatibility
    console.debug("Scan error:", errorMessage);
  };

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
        toast.success(
          `Added ${quantity} unit(s) of ${scannedProduct.name} to inventory`
        );
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

  const handleClose = async () => {
    stopCamera();
    setScannedProduct(null);
    setScannedBarcode("");
    setShowAddProductDialog(false);
    setQuantity(1);
    setCameraError(null);
    onClose();
  };

  const handleRescan = async () => {
    setScannedProduct(null);
    setScannedBarcode("");
    setShowAddProductDialog(false);
    setQuantity(1);
    await startCamera();
  };

  const handleAddProduct = () => {
    // Navigate to new product page with barcode pre-filled via query param
    router.push(`/dashboard/inventory/products/new?sku=${encodeURIComponent(scannedBarcode)}`);
    handleClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#22C55E]" />
              <h2 className="text-lg font-bold text-gray-900">Scan Barcode</h2>
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
                  onClick={startCamera}
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
                <div 
                  ref={scannerDivRef}
                  className="rounded-lg overflow-hidden border-2 border-[#22C55E] bg-black relative"
                  style={{ minHeight: "300px" }}
                >
                  {/* Quagga will inject video element here */}
                  <style jsx>{`
                    div :global(video), div :global(canvas) {
                      width: 100% !important;
                      max-height: 300px !important;
                      object-fit: cover;
                    }
                    div :global(canvas.drawingBuffer) {
                      position: absolute;
                      top: 0;
                      left: 0;
                    }
                  `}</style>
                </div>
                {scanning && !cameraActive && (
                  <div className="text-center py-4">
                    <div className="animate-pulse text-[#22C55E] text-sm">
                      {scanning && !cameraActive ? "Starting camera..." : "Processing..."}
                    </div>
                  </div>
                )}
                {cameraActive && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Position the barcode</strong> within the camera view. 
                      The scan will happen automatically when detected.
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
                  disabled={scanning}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Package className="h-4 w-4" />
                  Upload from Gallery
                </Button>
                
                {/* Hidden file input */}
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
                      No product found for barcode: <span className="font-mono font-semibold">{scannedBarcode}</span>
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">
                      Would you like to add it?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddProduct}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                  <Button
                    onClick={handleRescan}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Scan Again
                  </Button>
                </div>
              </div>
            )}

            {/* Scanned Product */}
            {scannedProduct && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {scannedProduct.name}
                      </h3>
                      <p className="text-sm text-gray-600">SKU: {scannedProduct.sku}</p>
                      <p className="text-sm text-gray-600">
                        Current Stock: {scannedProduct.current_stock || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Quantity
                  </label>
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
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-2"
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
