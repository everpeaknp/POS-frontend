/**
 * Barcode Detection Overlay
 * Visual feedback for barcode detection with animated bounding box
 */

"use client";

import { useEffect, useRef } from "react";
import type { DetectedBarcode, ScannerState } from "@/lib/barcode/types";

interface BarcodeDetectionOverlayProps {
  videoElement: HTMLVideoElement | null;
  detectedBarcode: DetectedBarcode | null;
  scannerState: ScannerState;
  className?: string;
}

export function BarcodeDetectionOverlay({
  videoElement,
  detectedBarcode,
  scannerState,
  className = "",
}: BarcodeDetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoElement) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video
    const updateCanvasSize = () => {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    };

    updateCanvasSize();

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw scanning guide
      drawScanningGuide(ctx, canvas.width, canvas.height, scannerState);

      // Draw detected barcode
      if (detectedBarcode && detectedBarcode.boundingBox) {
        drawBarcodeBox(ctx, detectedBarcode, scannerState);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoElement, detectedBarcode, scannerState]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/**
 * Draw scanning guide overlay
 */
function drawScanningGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: ScannerState
) {
  const guideWidth = width * 0.7;
  const guideHeight = height * 0.4;
  const guideX = (width - guideWidth) / 2;
  const guideY = (height - guideHeight) / 2;

  // Semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, width, height);

  // Clear center area
  ctx.clearRect(guideX, guideY, guideWidth, guideHeight);

  // Draw corner brackets based on state
  const cornerLength = 30;
  const cornerWidth = 4;

  let color = "var(--color-accent-custom,#22C55E)"; // Green
  if (state === "detected") color = "#3B82F6"; // Blue
  else if (state === "stabilizing") color = "#F59E0B"; // Orange
  else if (state === "scanning" || state === "success") color = "#10B981"; // Emerald

  ctx.strokeStyle = color;
  ctx.lineWidth = cornerWidth;
  ctx.lineCap = "round";

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(guideX, guideY + cornerLength);
  ctx.lineTo(guideX, guideY);
  ctx.lineTo(guideX + cornerLength, guideY);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(guideX + guideWidth - cornerLength, guideY);
  ctx.lineTo(guideX + guideWidth, guideY);
  ctx.lineTo(guideX + guideWidth, guideY + cornerLength);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(guideX, guideY + guideHeight - cornerLength);
  ctx.lineTo(guideX, guideY + guideHeight);
  ctx.lineTo(guideX + cornerLength, guideY + guideHeight);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(guideX + guideWidth - cornerLength, guideY + guideHeight);
  ctx.lineTo(guideX + guideWidth, guideY + guideHeight);
  ctx.lineTo(guideX + guideWidth, guideY + guideHeight - cornerLength);
  ctx.stroke();

  // Add scanning line animation for searching state
  if (state === "searching" || state === "initializing") {
    const time = Date.now() / 1000;
    const scanLineY = guideY + ((time % 2) / 2) * guideHeight;

    ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guideX, scanLineY);
    ctx.lineTo(guideX + guideWidth, scanLineY);
    ctx.stroke();
  }
}

/**
 * Draw detected barcode bounding box
 */
function drawBarcodeBox(
  ctx: CanvasRenderingContext2D,
  barcode: DetectedBarcode,
  state: ScannerState
) {
  const box = barcode.boundingBox;
  if (!box) return;

  // Box color based on state
  let strokeColor = "#3B82F6"; // Blue for detected
  let fillColor = "rgba(59, 130, 246, 0.1)";

  if (state === "stabilizing") {
    strokeColor = "#F59E0B"; // Orange
    fillColor = "rgba(245, 158, 11, 0.1)";
  } else if (state === "scanning" || state === "success") {
    strokeColor = "#10B981"; // Emerald
    fillColor = "rgba(16, 185, 129, 0.1)";
  }

  // Draw filled box
  ctx.fillStyle = fillColor;
  ctx.fillRect(box.x, box.y, box.width, box.height);

  // Draw box outline
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // Draw corner markers
  const cornerLength = Math.min(box.width, box.height) * 0.2;
  const cornerWidth = 5;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = cornerWidth;
  ctx.lineCap = "round";

  // Top-left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + cornerLength);
  ctx.lineTo(box.x, box.y);
  ctx.lineTo(box.x + cornerLength, box.y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - cornerLength, box.y);
  ctx.lineTo(box.x + box.width, box.y);
  ctx.lineTo(box.x + box.width, box.y + cornerLength);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + box.height - cornerLength);
  ctx.lineTo(box.x, box.y + box.height);
  ctx.lineTo(box.x + cornerLength, box.y + box.height);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
  ctx.stroke();

  // Draw barcode value if available
  if (state === "detected" || state === "stabilizing" || state === "scanning") {
    const labelY = box.y - 10;
    const labelText = barcode.rawValue;
    const labelX = box.x + box.width / 2;

    // Background
    ctx.font = "bold 16px sans-serif";
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = 20;

    ctx.fillStyle = strokeColor;
    ctx.fillRect(
      labelX - textWidth / 2 - 8,
      labelY - textHeight,
      textWidth + 16,
      textHeight + 8
    );

    // Text
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, labelX, labelY - textHeight / 2 + 2);
  }

  // Draw corner points if available
  if (barcode.cornerPoints && barcode.cornerPoints.length > 0) {
    ctx.fillStyle = strokeColor;
    barcode.cornerPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
