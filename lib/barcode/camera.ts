/**
 * Camera Management Service
 * Handles camera access, zoom, focus, and quality settings
 */

import type { CameraCapabilities } from "./types";

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private capabilities: CameraCapabilities | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private currentZoom = 1;
  private isStarting = false; // Prevent concurrent starts

  /**
   * Start camera with optimized settings
   */
  async startCamera(
    videoElement: HTMLVideoElement,
    preferredFacingMode: "user" | "environment" = "environment"
  ): Promise<MediaStream> {
    // Prevent concurrent start attempts
    if (this.isStarting) {
      console.log('Camera is already starting, waiting...');
      // Wait for existing start to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      if (this.stream) return this.stream;
    }

    this.isStarting = true;

    try {
      // Stop any existing stream first
      this.stopCamera();

      // Request camera with optimal settings
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: preferredFacingMode },
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16 / 9 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement = videoElement;

      // Set video source
      videoElement.srcObject = this.stream;
      
      // Wait for video to be ready before playing
      await new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          videoElement.removeEventListener('canplay', handleCanPlay);
          videoElement.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (error: Event) => {
          videoElement.removeEventListener('canplay', handleCanPlay);
          videoElement.removeEventListener('error', handleError);
          reject(new Error('Video load error'));
        };
        
        videoElement.addEventListener('canplay', handleCanPlay);
        videoElement.addEventListener('error', handleError);
        
        // Trigger load
        videoElement.load();
      });

      // Play video with error handling
      try {
        await videoElement.play();
      } catch (playError: any) {
        // Ignore AbortError - it's harmless if video is already playing
        if (playError.name !== 'AbortError') {
          throw playError;
        }
        console.log('Video play interrupted (harmless)');
      }

      // Get video track and capabilities
      const videoTracks = this.stream.getVideoTracks();
      if (videoTracks.length > 0) {
        this.videoTrack = videoTracks[0];
        await this.loadCapabilities();
      }

      return this.stream;
    } catch (error: any) {
      console.error("Camera start error:", error);
      throw this.handleCameraError(error);
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Stop camera and release resources
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.videoTrack = null;
    this.capabilities = null;
    this.currentZoom = 1;
    this.isStarting = false; // Reset starting flag
  }

  /**
   * Load camera capabilities
   */
  private async loadCapabilities(): Promise<void> {
    if (!this.videoTrack) return;

    try {
      const capabilities = this.videoTrack.getCapabilities() as any;
      const settings = this.videoTrack.getSettings() as any;

      this.capabilities = {
        zoom: capabilities.zoom
          ? {
              min: capabilities.zoom.min || 1,
              max: capabilities.zoom.max || 1,
              current: settings.zoom || 1,
            }
          : undefined,
        focusMode: capabilities.focusMode || [],
        torch: capabilities.torch || false,
      };

      this.currentZoom = settings.zoom || 1;

      console.log("Camera capabilities loaded:", this.capabilities);
    } catch (error) {
      console.warn("Could not load camera capabilities:", error);
    }
  }

  /**
   * Get current camera capabilities
   */
  getCapabilities(): CameraCapabilities | null {
    return this.capabilities;
  }

  /**
   * Check if hardware zoom is supported
   */
  supportsZoom(): boolean {
    return !!this.capabilities?.zoom && this.capabilities.zoom.max > 1;
  }

  /**
   * Set zoom level (hardware zoom if available)
   */
  async setZoom(zoomLevel: number): Promise<boolean> {
    if (!this.videoTrack || !this.capabilities?.zoom) {
      console.log("Hardware zoom not supported");
      return false;
    }

    try {
      const { min, max } = this.capabilities.zoom;
      const clampedZoom = Math.max(min, Math.min(max, zoomLevel));

      await this.videoTrack.applyConstraints({
        advanced: [{ zoom: clampedZoom } as any],
      });

      this.currentZoom = clampedZoom;
      console.log(`Zoom set to ${clampedZoom}`);
      return true;
    } catch (error) {
      console.error("Failed to set zoom:", error);
      return false;
    }
  }

  /**
   * Auto zoom based on barcode size - ENHANCED for faster detection
   */
  async autoZoom(barcodeSize: number, targetSize = 50): Promise<boolean> {
    if (!this.supportsZoom()) {
      return false;
    }

    const zoom = this.capabilities?.zoom;
    if (!zoom) return false;

    // Calculate desired zoom
    // If barcode is too small, zoom in MORE AGGRESSIVELY
    // If barcode is too large, zoom out
    let desiredZoom = this.currentZoom;

    if (barcodeSize < targetSize * 0.6) {
      // Too small - zoom in AGGRESSIVELY (increased from 0.7)
      // More aggressive zoom factor for faster detection
      const zoomFactor = Math.min(1.5, Math.sqrt(targetSize / barcodeSize) * 1.2);
      desiredZoom = Math.min(zoom.max, this.currentZoom * zoomFactor);
    } else if (barcodeSize > targetSize * 1.5) {
      // Too large - zoom out
      const zoomFactor = Math.max(0.85, Math.sqrt(barcodeSize / targetSize));
      desiredZoom = Math.max(zoom.min, this.currentZoom / zoomFactor);
    } else {
      // Size is good
      return true;
    }

    // More aggressive zoom - allow larger changes per adjustment
    const maxChange = 0.25; // Increased from 0.15 for faster zoom
    const change = desiredZoom - this.currentZoom;
    const smoothedZoom = this.currentZoom + Math.max(-maxChange, Math.min(maxChange, change));

    return await this.setZoom(smoothedZoom);
  }

  /**
   * Smart auto-zoom that considers barcode position AND size
   * Zooms in automatically when barcode is detected at any position
   */
  async smartAutoZoom(
    barcode: { boundingBox?: { x: number; y: number; width: number; height: number } },
    frameWidth: number,
    frameHeight: number,
    targetSize = 50
  ): Promise<boolean> {
    if (!this.supportsZoom() || !barcode.boundingBox) {
      return false;
    }

    const zoom = this.capabilities?.zoom;
    if (!zoom) return false;

    const box = barcode.boundingBox;

    // Calculate barcode size as percentage of frame
    const barcodeArea = box.width * box.height;
    const frameArea = frameWidth * frameHeight;
    const barcodeSize = (barcodeArea / frameArea) * 100;

    // Calculate barcode position (center point)
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const normalizedX = centerX / frameWidth;
    const normalizedY = centerY / frameHeight;

    // Distance from center of frame (0 = center, 1 = edge)
    const distanceFromCenter = Math.sqrt(
      Math.pow(normalizedX - 0.5, 2) + Math.pow(normalizedY - 0.5, 2)
    );

    // If barcode is small OR far from center, zoom in aggressively
    const needsZoom = barcodeSize < targetSize * 0.6 || distanceFromCenter > 0.3;

    if (needsZoom) {
      // Calculate zoom factor based on size AND position
      let zoomFactor = 1.0;

      // Size-based zoom
      if (barcodeSize < targetSize * 0.6) {
        zoomFactor = Math.max(zoomFactor, Math.sqrt(targetSize / barcodeSize) * 1.3);
      }

      // Position-based zoom boost
      if (distanceFromCenter > 0.3) {
        zoomFactor *= 1.2; // Extra zoom if barcode is off-center
      }

      // Apply zoom with limits
      const desiredZoom = Math.min(zoom.max, this.currentZoom * Math.min(1.6, zoomFactor));
      
      // More aggressive zoom step
      const maxChange = 0.3;
      const change = desiredZoom - this.currentZoom;
      const smoothedZoom = this.currentZoom + Math.max(-maxChange, Math.min(maxChange, change));

      return await this.setZoom(smoothedZoom);
    } else if (barcodeSize > targetSize * 1.5) {
      // Too large - zoom out slightly
      const zoomFactor = Math.max(0.85, Math.sqrt(barcodeSize / targetSize));
      const desiredZoom = Math.max(zoom.min, this.currentZoom / zoomFactor);
      
      const maxChange = 0.2;
      const change = desiredZoom - this.currentZoom;
      const smoothedZoom = this.currentZoom + Math.max(-maxChange, Math.min(maxChange, change));

      return await this.setZoom(smoothedZoom);
    }

    // Size and position are good
    return true;
  }

  /**
   * Reset zoom to default
   */
  async resetZoom(): Promise<boolean> {
    if (!this.supportsZoom()) {
      return false;
    }

    const zoom = this.capabilities?.zoom;
    if (!zoom) return false;

    return await this.setZoom(zoom.min);
  }

  /**
   * Get current zoom level
   */
  getCurrentZoom(): number {
    return this.currentZoom;
  }

  /**
   * Set focus mode
   */
  async setFocusMode(mode: "continuous" | "single-shot" | "manual"): Promise<boolean> {
    if (!this.videoTrack || !this.capabilities?.focusMode?.includes(mode)) {
      return false;
    }

    try {
      await this.videoTrack.applyConstraints({
        advanced: [{ focusMode: mode } as any],
      });
      return true;
    } catch (error) {
      console.error("Failed to set focus mode:", error);
      return false;
    }
  }

  /**
   * Enable/disable torch (flashlight)
   */
  async setTorch(enabled: boolean): Promise<boolean> {
    if (!this.videoTrack || !this.capabilities?.torch) {
      return false;
    }

    try {
      await this.videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as any],
      });
      return true;
    } catch (error) {
      console.error("Failed to set torch:", error);
      return false;
    }
  }

  /**
   * Get video element dimensions
   */
  getVideoDimensions(): { width: number; height: number } | null {
    if (!this.videoElement) return null;

    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
    };
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.stream !== null && this.videoTrack !== null;
  }

  /**
   * Handle camera errors with user-friendly messages
   */
  private handleCameraError(error: any): Error {
    if (error.name === "NotAllowedError") {
      return new Error("Camera access denied. Please allow camera permissions.");
    } else if (error.name === "NotFoundError") {
      return new Error("No camera found on this device.");
    } else if (error.name === "NotReadableError") {
      return new Error("Camera is already in use by another application.");
    } else if (error.name === "OverconstrainedError") {
      return new Error("Camera does not support the requested settings.");
    } else {
      return new Error(`Failed to start camera: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Capture current frame as canvas
   */
  captureFrame(): HTMLCanvasElement | null {
    if (!this.videoElement) return null;

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0);
    return canvas;
  }

  /**
   * Get stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get video element
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }
}
