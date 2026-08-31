/**
 * Enhanced Barcode Detection Service
 * Multi-strategy detection with fallback: BarcodeDetector API → ZXing → Quagga2
 */

import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import Quagga from "@ericblade/quagga2";
import type { DetectedBarcode, DetectionResult, DetectionStrategy, BoundingBox } from "./types";

export class BarcodeDetector {
  private nativeBarcodeDetector: any | null = null;
  private zxingReader: BrowserMultiFormatReader | null = null;
  private preferredStrategy: DetectionStrategy = "all";
  private supportsNative = false;

  constructor(strategy: DetectionStrategy = "all") {
    this.preferredStrategy = strategy;
    this.initialize();
  }

  /**
   * Initialize detection strategies
   */
  private async initialize(): Promise<void> {
    // Check for native BarcodeDetector API
    if ("BarcodeDetector" in window) {
      try {
        this.nativeBarcodeDetector = new (window as any).BarcodeDetector({
          formats: [
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "code_93",
            "codabar",
            "itf",
            "qr_code",
          ],
        });
        this.supportsNative = true;
        console.log("✓ Native BarcodeDetector API available");
      } catch (error) {
        console.log("Native BarcodeDetector not fully supported");
        this.supportsNative = false;
      }
    } else {
      console.log("Native BarcodeDetector API not available");
    }

    // Initialize ZXing
    try {
      this.zxingReader = new BrowserMultiFormatReader();
      console.log("✓ ZXing library initialized");
    } catch (error) {
      console.error("Failed to initialize ZXing:", error);
    }
  }

  /**
   * Detect barcode using the best available strategy
   */
  async detect(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<DetectionResult> {
    const startTime = performance.now();

    try {
      // Try strategies based on preference
      if (this.preferredStrategy === "native" && this.supportsNative) {
        const result = await this.detectNative(source);
        if (result.success) return { ...result, processingTime: performance.now() - startTime };
      } else if (this.preferredStrategy === "zxing") {
        const result = await this.detectZXing(source);
        if (result.success) return { ...result, processingTime: performance.now() - startTime };
      } else if (this.preferredStrategy === "quagga") {
        const result = await this.detectQuagga(source);
        if (result.success) return { ...result, processingTime: performance.now() - startTime };
      } else {
        // "all" strategy - try in order of speed/accuracy
        // 1. Native (fastest)
        if (this.supportsNative) {
          const nativeResult = await this.detectNative(source);
          if (nativeResult.success) {
            return { ...nativeResult, processingTime: performance.now() - startTime };
          }
        }

        // 2. ZXing (good balance)
        const zxingResult = await this.detectZXing(source);
        if (zxingResult.success) {
          return { ...zxingResult, processingTime: performance.now() - startTime };
        }

        // 3. Quagga (last resort, more resource intensive)
        const quaggaResult = await this.detectQuagga(source);
        if (quaggaResult.success) {
          return { ...quaggaResult, processingTime: performance.now() - startTime };
        }
      }

      return {
        success: false,
        error: "No barcode detected",
        processingTime: performance.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Detection failed",
        processingTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Detect using native BarcodeDetector API
   */
  private async detectNative(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<DetectionResult> {
    if (!this.nativeBarcodeDetector) {
      return { success: false, error: "Native detector not available" };
    }

    try {
      const barcodes = await this.nativeBarcodeDetector.detect(source);

      if (barcodes && barcodes.length > 0) {
        const detected = barcodes[0];

        // Extract bounding box
        let boundingBox: BoundingBox | undefined;
        if (detected.boundingBox) {
          boundingBox = {
            x: detected.boundingBox.x,
            y: detected.boundingBox.y,
            width: detected.boundingBox.width,
            height: detected.boundingBox.height,
          };
        }

        // Extract corner points
        const cornerPoints = detected.cornerPoints
          ? detected.cornerPoints.map((p: any) => ({ x: p.x, y: p.y }))
          : undefined;

        return {
          success: true,
          barcode: {
            rawValue: detected.rawValue,
            format: this.normalizeFormat(detected.format),
            boundingBox,
            cornerPoints,
            confidence: 1.0, // Native API doesn't provide confidence
          },
        };
      }

      return { success: false, error: "No barcode found" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect using ZXing library
   */
  private async detectZXing(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<DetectionResult> {
    if (!this.zxingReader) {
      return { success: false, error: "ZXing not available" };
    }

    try {
      const result = await this.zxingReader.decodeFromImageElement(source as any);

      if (result) {
        // Extract bounding box from result points
        let boundingBox: BoundingBox | undefined;
        const cornerPoints: Array<{ x: number; y: number }> = [];

        if (result.getResultPoints() && result.getResultPoints().length > 0) {
          const points = result.getResultPoints();
          
          // Calculate bounding box
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          points.forEach((point) => {
            const x = point.getX();
            const y = point.getY();
            cornerPoints.push({ x, y });
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          });

          if (isFinite(minX)) {
            boundingBox = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            };
          }
        }

        return {
          success: true,
          barcode: {
            rawValue: result.getText(),
            format: this.normalizeFormat(result.getBarcodeFormat().toString()),
            boundingBox,
            cornerPoints: cornerPoints.length > 0 ? cornerPoints : undefined,
            confidence: 0.9, // ZXing doesn't provide confidence, use high value
          },
        };
      }

      return { success: false, error: "No barcode found" };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        return { success: false, error: "No barcode found" };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect using Quagga2 library
   */
  private async detectQuagga(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<DetectionResult> {
    return new Promise((resolve) => {
      try {
        // Convert source to image URL for Quagga
        let imageUrl: string;

        if (source instanceof HTMLCanvasElement) {
          imageUrl = source.toDataURL();
        } else if (source instanceof HTMLImageElement) {
          imageUrl = source.src;
        } else {
          // Video element - capture frame
          const canvas = document.createElement("canvas");
          canvas.width = source.videoWidth;
          canvas.height = source.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ success: false, error: "Failed to capture video frame" });
            return;
          }
          ctx.drawImage(source, 0, 0);
          imageUrl = canvas.toDataURL();
        }

        Quagga.decodeSingle(
          {
            src: imageUrl,
            numOfWorkers: 0,
            locate: true,
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "code_39_reader",
                "upc_reader",
                "upc_e_reader",
                "codabar_reader",
              ],
            },
          },
          (result) => {
            if (result && result.codeResult && result.codeResult.code) {
              // Extract bounding box
              let boundingBox: BoundingBox | undefined;

              if (result.boxes && result.boxes.length > 0) {
                const boxes = result.boxes.filter((box: any) => box);
                if (boxes.length > 0) {
                  // Use the first box
                  const box = boxes[0];
                  if (Array.isArray(box) && box.length === 2) {
                    boundingBox = {
                      x: box[0].x,
                      y: box[0].y,
                      width: box[1].x - box[0].x,
                      height: box[1].y - box[0].y,
                    };
                  }
                }
              }

              resolve({
                success: true,
                barcode: {
                  rawValue: result.codeResult.code,
                  format: this.normalizeFormat(result.codeResult.format),
                  boundingBox,
                  confidence: 0.8, // Quagga doesn't provide confidence
                },
              });
            } else {
              resolve({ success: false, error: "No barcode found" });
            }
          }
        );
      } catch (error: any) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  /**
   * Normalize barcode format names
   */
  private normalizeFormat(format: string): string {
    const formatMap: Record<string, string> = {
      ean_13: "EAN_13",
      ean_8: "EAN_8",
      upc_a: "UPC_A",
      upc_e: "UPC_E",
      code_128: "CODE_128",
      code_39: "CODE_39",
      code_93: "CODE_93",
      codabar: "CODABAR",
      itf: "ITF",
      qr_code: "QR_CODE",
      "EAN-13": "EAN_13",
      "EAN-8": "EAN_8",
      "UPC-A": "UPC_A",
      "UPC-E": "UPC_E",
      "Code 128": "CODE_128",
      "Code 39": "CODE_39",
      "Code 93": "CODE_93",
      Codabar: "CODABAR",
      ITF: "ITF",
      "QR Code": "QR_CODE",
    };

    return formatMap[format] || format.toUpperCase().replace(/[- ]/g, "_");
  }

  /**
   * Check which strategies are available
   */
  getAvailableStrategies(): DetectionStrategy[] {
    const strategies: DetectionStrategy[] = [];

    if (this.supportsNative) strategies.push("native");
    if (this.zxingReader) strategies.push("zxing");
    strategies.push("quagga"); // Always available

    return strategies;
  }

  /**
   * Set preferred strategy
   */
  setStrategy(strategy: DetectionStrategy): void {
    this.preferredStrategy = strategy;
  }

  /**
   * Get current strategy
   */
  getStrategy(): DetectionStrategy {
    return this.preferredStrategy;
  }

  /**
   * Check if native detection is supported
   */
  hasNativeSupport(): boolean {
    return this.supportsNative;
  }
}
