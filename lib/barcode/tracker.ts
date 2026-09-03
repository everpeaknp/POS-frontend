/**
 * Barcode Detection Tracker
 * Tracks barcode detections across frames to ensure stability before capture
 */

import type { DetectedBarcode, TrackedDetection } from "./types";

export class BarcodeTracker {
  private detections = new Map<string, TrackedDetection>();
  private readonly stabilizationFrames: number;
  private readonly maxAge: number;

  constructor(stabilizationFrames = 5, maxAge = 2000) {
    this.stabilizationFrames = stabilizationFrames;
    this.maxAge = maxAge;
  }

  /**
   * Track a detected barcode
   * Returns true if the barcode is now stable
   */
  track(barcode: DetectedBarcode): boolean {
    const key = barcode.rawValue;
    const now = Date.now();

    // Clean up old detections
    this.cleanup(now);

    const existing = this.detections.get(key);

    if (existing) {
      // Update existing detection
      existing.frameCount++;
      existing.lastSeen = now;
      existing.barcode = barcode; // Update with latest detection

      // Check if stable
      if (!existing.stable && existing.frameCount >= this.stabilizationFrames) {
        existing.stable = true;
        return true;
      }
      return existing.stable;
    } else {
      // New detection
      this.detections.set(key, {
        barcode,
        frameCount: 1,
        lastSeen: now,
        stable: false,
      });
      return false;
    }
  }

  /**
   * Get the most stable detection if any
   */
  getStableDetection(): DetectedBarcode | null {
    let bestDetection: TrackedDetection | null = null;
    let maxFrames = 0;

    for (const detection of this.detections.values()) {
      if (detection.stable && detection.frameCount > maxFrames) {
        bestDetection = detection;
        maxFrames = detection.frameCount;
      }
    }

    return bestDetection?.barcode || null;
  }

  /**
   * Check if a barcode is being tracked
   */
  isTracking(rawValue: string): boolean {
    return this.detections.has(rawValue);
  }

  /**
   * Get tracking info for a barcode
   */
  getTrackingInfo(rawValue: string): TrackedDetection | null {
    return this.detections.get(rawValue) || null;
  }

  /**
   * Clear all detections
   */
  clear(): void {
    this.detections.clear();
  }

  /**
   * Remove old detections
   */
  private cleanup(now: number): void {
    for (const [key, detection] of this.detections.entries()) {
      if (now - detection.lastSeen > this.maxAge) {
        this.detections.delete(key);
      }
    }
  }

  /**
   * Get all active detections
   */
  getAll(): TrackedDetection[] {
    return Array.from(this.detections.values());
  }

  /**
   * Get count of tracked barcodes
   */
  count(): number {
    return this.detections.size;
  }
}
