/**
 * Enhanced Barcode Detection Service
 * Multi-strategy detection with fallback: BarcodeDetector API → ZXing → Quagga2
 */

import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import Quagga from "@ericblade/quagga2";
import type { ImageProcessor } from "./imageProcessor";
import type { DetectedBarcode, DetectionResult, DetectionStrategy, BoundingBox } from "./types";

export interface SmartDetectOptions {
  /** Last frame's barcode region, in full-frame coordinates — used to crop a fast region-of-interest pass and, on repeated misses, to target the enhancement fallback. */
  lastKnownBox?: BoundingBox;
  /** Run grayscale/contrast/sharpen variants of the region through detection when the raw frame fails. Expensive — only enable after several consecutive misses. */
  allowEnhancement?: boolean;
  imageProcessor?: ImageProcessor;
}

export class BarcodeDetector {
  private nativeBarcodeDetector: any | null = null;
  private zxingReader: BrowserMultiFormatReader | null = null;
  private preferredStrategy: DetectionStrategy = "all";
  private supportsNative = false;
  /** Reused scratch canvas for the region-of-interest crop, to avoid allocating a new canvas on every frame of the hot detection loop. */
  private roiCanvas: HTMLCanvasElement | null = null;

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
   * Detect with region-of-interest tracking and an enhancement fallback.
   *
   * When the previous frame's barcode position is known, a small padded crop
   * around it is tried first — far fewer pixels than the full frame, so it's
   * both faster and (since the same physical barcode is usually still near
   * there) more likely to hit on the first attempt. If that and a full-frame
   * pass both fail and `allowEnhancement` is set, grayscale/contrast/sharpen
   * variants of that same region are tried before giving up — this is what
   * rescues glare, low-contrast, or slightly-blurred barcodes that the raw
   * frame alone can't decode. Enhancement is deliberately opt-in per call
   * (the caller should only allow it after a few consecutive misses) since
   * the pixel-by-pixel convolution passes are too costly to run every frame.
   */
  async detectSmart(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    options: SmartDetectOptions = {}
  ): Promise<DetectionResult> {
    const { lastKnownBox, allowEnhancement, imageProcessor } = options;

    if (lastKnownBox) {
      const roi = this.cropToROI(source, lastKnownBox);
      if (roi) {
        const roiResult = await this.detect(roi.canvas);
        if (roiResult.success && roiResult.barcode) {
          return { ...roiResult, barcode: this.remapBarcode(roiResult.barcode, roi.offsetX, roi.offsetY) };
        }
      }
    }

    const fullResult = await this.detect(source);
    if (fullResult.success) {
      return fullResult;
    }

    if (allowEnhancement && lastKnownBox && imageProcessor) {
      try {
        const variants = imageProcessor.enhanceBarcodeRegion(source, lastKnownBox);
        // The crop offset is the same for every enhanced variant — they're
        // all derived from the same padded region of `source`.
        const offsetX = Math.max(0, lastKnownBox.x - lastKnownBox.width * 0.05);
        const offsetY = Math.max(0, lastKnownBox.y - lastKnownBox.height * 0.05);
        for (const variant of variants) {
          const variantResult = await this.detect(variant);
          if (variantResult.success && variantResult.barcode) {
            return { ...variantResult, barcode: this.remapBarcode(variantResult.barcode, offsetX, offsetY) };
          }
        }
      } catch (error) {
        console.warn("Barcode enhancement fallback failed:", error);
      }
    }

    return fullResult;
  }

  /** Crops a padded region around `box` into a reused scratch canvas, so the hot per-frame path doesn't allocate. */
  private cropToROI(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    box: BoundingBox
  ): { canvas: HTMLCanvasElement; offsetX: number; offsetY: number } | null {
    const sourceWidth =
      source instanceof HTMLVideoElement ? source.videoWidth : (source as HTMLImageElement | HTMLCanvasElement).width;
    const sourceHeight =
      source instanceof HTMLVideoElement ? source.videoHeight : (source as HTMLImageElement | HTMLCanvasElement).height;
    if (!sourceWidth || !sourceHeight) return null;

    // Pad generously — the barcode may have shifted slightly since the last frame.
    const padX = box.width * 0.4;
    const padY = box.height * 0.4;
    const x = Math.max(0, Math.floor(box.x - padX));
    const y = Math.max(0, Math.floor(box.y - padY));
    const width = Math.min(sourceWidth - x, Math.ceil(box.width + padX * 2));
    const height = Math.min(sourceHeight - y, Math.ceil(box.height + padY * 2));
    if (width <= 0 || height <= 0) return null;

    if (!this.roiCanvas) {
      this.roiCanvas = document.createElement("canvas");
    }
    this.roiCanvas.width = width;
    this.roiCanvas.height = height;
    const ctx = this.roiCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
    return { canvas: this.roiCanvas, offsetX: x, offsetY: y };
  }

  /** Shifts a detection result's coordinates from a cropped region back into full-frame space. */
  private remapBarcode(barcode: DetectedBarcode, offsetX: number, offsetY: number): DetectedBarcode {
    if (!offsetX && !offsetY) return barcode;
    return {
      ...barcode,
      boundingBox: barcode.boundingBox
        ? { ...barcode.boundingBox, x: barcode.boundingBox.x + offsetX, y: barcode.boundingBox.y + offsetY }
        : undefined,
      cornerPoints: barcode.cornerPoints?.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY })),
    };
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
      // `decodeFromImageElement` only accepts an HTMLImageElement (or a URL
      // string) — silently throwing "Couldn't get imageElement from
      // imageSource!" for anything else, which the catch below swallows as
      // an ordinary "no barcode found". That meant every live-camera frame
      // (an HTMLVideoElement) and every ROI/enhancement crop (an
      // HTMLCanvasElement) never actually reached the decoder at all — only
      // gallery-upload's real <img> ever worked. `decode()` draws any media
      // element to a canvas first, and `decodeFromCanvas()` handles an
      // already-a-canvas source directly.
      const result =
        source instanceof HTMLCanvasElement
          ? await this.zxingReader.decodeFromCanvas(source)
          : await this.zxingReader.decode(source as HTMLVideoElement | HTMLImageElement);

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
