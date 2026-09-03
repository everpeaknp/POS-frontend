/**
 * Image Processing Service for Barcode Enhancement
 * Crops, sharpens, and enhances barcode regions for better detection
 */

import type { BoundingBox } from "./types";

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Failed to get canvas 2D context");
    }
    this.ctx = ctx;
  }

  /**
   * Crop a region from a video frame or image
   */
  cropRegion(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    box: BoundingBox,
    padding = 0.1
  ): HTMLCanvasElement {
    // Add padding around the barcode
    const paddedBox = this.addPadding(box, padding);

    // Ensure box is within bounds
    const clampedBox = this.clampBox(paddedBox, source.width, source.height);

    // Create canvas for cropped region
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = clampedBox.width;
    croppedCanvas.height = clampedBox.height;

    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) {
      throw new Error("Failed to get canvas 2D context");
    }

    // Draw cropped region
    croppedCtx.drawImage(
      source,
      clampedBox.x,
      clampedBox.y,
      clampedBox.width,
      clampedBox.height,
      0,
      0,
      clampedBox.width,
      clampedBox.height
    );

    return croppedCanvas;
  }

  /**
   * Convert to grayscale
   */
  toGrayscale(source: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;

    ctx.drawImage(source, 0, 0);
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
   * Increase contrast
   */
  increaseContrast(source: HTMLCanvasElement, factor = 1.5): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;

    ctx.drawImage(source, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const contrast = (factor - 1) * 255;
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = contrastFactor * (data[i] - 128) + 128;
      data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128;
      data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Sharpen image using convolution
   */
  sharpen(source: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;

    ctx.drawImage(source, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Sharpening kernel
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    const output = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kernelIdx];
            }
          }
          const idx = (y * width + x) * 4 + c;
          output[idx] = Math.max(0, Math.min(255, sum));
        }
      }
    }

    const outputImageData = new ImageData(output, width, height);
    ctx.putImageData(outputImageData, 0, 0);
    return canvas;
  }

  /**
   * Apply adaptive thresholding
   */
  adaptiveThreshold(source: HTMLCanvasElement, blockSize = 15): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;

    // First convert to grayscale
    const gray = this.toGrayscale(source);
    const grayCtx = gray.getContext("2d");
    if (!grayCtx) return source;

    const imageData = grayCtx.getImageData(0, 0, gray.width, gray.height);
    const data = imageData.data;
    const width = gray.width;
    const height = gray.height;

    // Calculate integral image for fast mean calculation
    const integral = new Float64Array((width + 1) * (height + 1));
    for (let y = 1; y <= height; y++) {
      let rowSum = 0;
      for (let x = 1; x <= width; x++) {
        const idx = ((y - 1) * width + (x - 1)) * 4;
        rowSum += data[idx];
        integral[y * (width + 1) + x] = rowSum + integral[(y - 1) * (width + 1) + x];
      }
    }

    // Apply adaptive threshold
    const halfBlock = Math.floor(blockSize / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const x1 = Math.max(0, x - halfBlock);
        const x2 = Math.min(width - 1, x + halfBlock);
        const y1 = Math.max(0, y - halfBlock);
        const y2 = Math.min(height - 1, y + halfBlock);

        const area = (x2 - x1) * (y2 - y1);
        const sum =
          integral[(y2 + 1) * (width + 1) + (x2 + 1)] -
          integral[y1 * (width + 1) + (x2 + 1)] -
          integral[(y2 + 1) * (width + 1) + x1] +
          integral[y1 * (width + 1) + x1];

        const mean = sum / area;
        const idx = (y * width + x) * 4;
        const value = data[idx] > mean * 0.95 ? 255 : 0;

        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Process barcode region with multiple strategies
   */
  enhanceBarcodeRegion(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    box?: BoundingBox
  ): HTMLCanvasElement[] {
    const results: HTMLCanvasElement[] = [];

    // Original crop (if box provided)
    if (box) {
      const cropped = this.cropRegion(source, box);
      results.push(cropped);

      // Enhanced versions
      const grayscale = this.toGrayscale(cropped);
      results.push(grayscale);

      const contrasted = this.increaseContrast(grayscale, 1.3);
      results.push(contrasted);

      const sharpened = this.sharpen(contrasted);
      results.push(sharpened);
    } else {
      // No box - process full frame
      this.canvas.width = source.width;
      this.canvas.height = source.height;
      this.ctx.drawImage(source, 0, 0);

      results.push(this.canvas);

      const grayscale = this.toGrayscale(this.canvas);
      results.push(grayscale);
    }

    return results;
  }

  /**
   * Calculate barcode size relative to frame
   */
  getBarcodeSize(box: BoundingBox, frameWidth: number, frameHeight: number): number {
    const boxArea = box.width * box.height;
    const frameArea = frameWidth * frameHeight;
    return (boxArea / frameArea) * 100;
  }

  /**
   * Add padding to bounding box
   */
  private addPadding(box: BoundingBox, padding: number): BoundingBox {
    const padX = box.width * padding;
    const padY = box.height * padding;

    return {
      x: box.x - padX / 2,
      y: box.y - padY / 2,
      width: box.width + padX,
      height: box.height + padY,
    };
  }

  /**
   * Clamp box to image bounds
   */
  private clampBox(box: BoundingBox, maxWidth: number, maxHeight: number): BoundingBox {
    return {
      x: Math.max(0, Math.min(box.x, maxWidth - 1)),
      y: Math.max(0, Math.min(box.y, maxHeight - 1)),
      width: Math.min(box.width, maxWidth - box.x),
      height: Math.min(box.height, maxHeight - box.y),
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
