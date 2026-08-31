/**
 * Barcode Scanner Types and State Machine
 */

export type ScannerState =
  | "idle"
  | "initializing"
  | "searching"
  | "detected"
  | "stabilizing"
  | "scanning"
  | "success"
  | "error";

export type BarcodeFormat =
  | "EAN_13"
  | "EAN_8"
  | "UPC_A"
  | "UPC_E"
  | "CODE_128"
  | "CODE_39"
  | "CODE_93"
  | "CODABAR"
  | "ITF"
  | "QR_CODE"
  | "DATA_MATRIX"
  | "PDF_417";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox?: BoundingBox;
  cornerPoints?: Array<{ x: number; y: number }>;
  confidence?: number;
}

export interface DetectionResult {
  success: boolean;
  barcode?: DetectedBarcode;
  error?: string;
  processingTime?: number;
}

export interface CameraCapabilities {
  zoom?: {
    min: number;
    max: number;
    current: number;
  };
  focusMode?: string[];
  torch?: boolean;
}

export interface DetectionConfig {
  formats?: BarcodeFormat[];
  maxDetectionAttempts?: number;
  stabilizationFrames?: number;
  minBarcodeSize?: number; // Percentage of frame
  enhanceImage?: boolean;
}

export interface TrackedDetection {
  barcode: DetectedBarcode;
  frameCount: number;
  lastSeen: number;
  stable: boolean;
}

export type DetectionStrategy = "native" | "zxing" | "quagga" | "all";

export interface ScannerCallbacks {
  onStateChange?: (state: ScannerState) => void;
  onDetection?: (barcode: DetectedBarcode) => void;
  onStableDetection?: (barcode: DetectedBarcode) => void;
  onSuccess?: (barcode: string) => void;
  onError?: (error: string) => void;
}
