/**
 * Image Ingestion Pipeline for Vision-based AI
 * Ensures ONLY valid image bytes (base64) are sent to AI models.
 * No URLs, no file paths, no metadata - only pure image bytes.
 */

// Minimum file size (10 KB)
const MIN_FILE_SIZE = 10 * 1024;
// Maximum dimension for resizing
const MAX_DIMENSION = 1024;
// Minimum output base64 length (corresponds to ~7.5 KB binary)
const MIN_BASE64_LENGTH = 10000;
// Minimum binary size after processing (20 KB)
const MIN_BINARY_SIZE = 20 * 1024;
// JPEG quality for compression
const JPEG_QUALITY = 0.85;

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

interface ProcessedImage {
  base64: string;          // Pure base64 string (no data URL prefix)
  dataUrl: string;         // Full data URL for display
  mimeType: 'image/jpeg';  // Always JPEG after processing
  width: number;
  height: number;
  binarySize: number;      // Size in bytes
}

/**
 * Validates a File/Blob before processing
 */
function validateInputFile(file: File): void {
  // Check if file exists and has content
  if (!file || file.size === 0) {
    throw new ImageProcessingError('No image file provided');
  }

  // Check minimum file size (10 KB)
  if (file.size < MIN_FILE_SIZE) {
    throw new ImageProcessingError(`Image file too small. Minimum size is ${MIN_FILE_SIZE / 1024} KB`);
  }

  // Check MIME type - only accept JPEG and PNG
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validMimeTypes.includes(file.type.toLowerCase())) {
    throw new ImageProcessingError('Invalid image format. Please upload a JPEG or PNG image');
  }
}

/**
 * Loads an image from a File and returns an HTMLImageElement
 * Handles EXIF orientation correction automatically via canvas
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Image loaded successfully
        resolve(img);
      };

      img.onerror = () => {
        reject(new ImageProcessingError('Failed to decode image. The file may be corrupted'));
      };

      // Load image from data URL
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new ImageProcessingError('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Normalizes an image:
 * - Converts to JPEG format
 * - Resizes so longest side is at most MAX_DIMENSION pixels
 * - Removes alpha channel (JPEG doesn't support transparency)
 * - EXIF orientation is automatically handled by browser's image loading
 */
function normalizeImage(img: HTMLImageElement): { canvas: HTMLCanvasElement; width: number; height: number } {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Calculate new dimensions (longest side max 1024px)
  if (width > height) {
    if (width > MAX_DIMENSION) {
      height = Math.round(height * (MAX_DIMENSION / width));
      width = MAX_DIMENSION;
    }
  } else {
    if (height > MAX_DIMENSION) {
      width = Math.round(width * (MAX_DIMENSION / height));
      height = MAX_DIMENSION;
    }
  }

  // Create canvas for normalization
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ImageProcessingError('Failed to create image processing context');
  }

  // Fill with white background (removes transparency/alpha channel)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw image onto canvas (this also handles EXIF orientation in modern browsers)
  ctx.drawImage(img, 0, 0, width, height);

  return { canvas, width, height };
}

/**
 * Converts canvas to base64 JPEG and validates output
 */
function canvasToValidatedBase64(canvas: HTMLCanvasElement): { base64: string; dataUrl: string; binarySize: number } {
  // Convert to JPEG data URL
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  // Validate that we got a valid data URL
  if (!dataUrl.startsWith('data:image/jpeg;base64,')) {
    throw new ImageProcessingError('Failed to convert image to JPEG format');
  }

  // Extract pure base64 (remove data URL prefix)
  const base64 = dataUrl.split(',')[1];

  if (!base64 || base64.length === 0) {
    throw new ImageProcessingError('Failed to encode image to base64');
  }

  // Calculate binary size from base64 length
  // Base64 encodes 3 bytes into 4 characters
  const binarySize = Math.floor((base64.length * 3) / 4);

  // Validate minimum base64 length (10,000 characters)
  if (base64.length < MIN_BASE64_LENGTH) {
    throw new ImageProcessingError(`Processed image too small. Please use a higher quality image`);
  }

  // Validate minimum binary size (20 KB)
  if (binarySize < MIN_BINARY_SIZE) {
    throw new ImageProcessingError(`Processed image binary size too small (${Math.round(binarySize / 1024)} KB). Minimum is ${MIN_BINARY_SIZE / 1024} KB`);
  }

  return { base64, dataUrl, binarySize };
}

/**
 * Main image processing function.
 * Takes a File/Blob input and returns clean base64 image bytes ready for AI ingestion.
 * 
 * @param file - Input File/Blob from user upload
 * @returns ProcessedImage with base64 bytes and metadata
 * @throws ImageProcessingError if any step fails
 */
export async function processImageForAI(file: File): Promise<ProcessedImage> {
  // Step 1: Validate input file
  validateInputFile(file);

  // Step 2: Load and decode image
  const img = await loadImage(file);

  // Step 3: Normalize image (resize, remove alpha, JPEG conversion)
  const { canvas, width, height } = normalizeImage(img);

  // Step 4: Convert to base64 and validate output
  const { base64, dataUrl, binarySize } = canvasToValidatedBase64(canvas);

  // Return processed image ready for AI ingestion
  return {
    base64,           // Pure base64 string - use this for AI API calls
    dataUrl,          // Full data URL - use this for display in <img> tags
    mimeType: 'image/jpeg',
    width,
    height,
    binarySize
  };
}

/**
 * Legacy resize function for backward compatibility.
 * Use processImageForAI for new code.
 */
export const resizeImage = (file: File, maxDimension: number = 512): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        // White background to remove alpha
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.85 quality
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};