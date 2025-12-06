import { GifOptions, PosterConfig } from '../types';

// Helper to load an image from a URL into an HTMLImageElement
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

// Helper to create a Worker Blob URL that works across domains (CORS Fix)
const getWorkerBlobUrl = (): string => {
  // We create a tiny worker script that imports the actual logic from CDN.
  // This bypasses some CORS restrictions on fetching the file directly, 
  // relying instead on the browser's ability to importScripts.
  const workerCode = `
    try {
      importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    } catch (e) {
      console.error('Worker failed to load script', e);
    }
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
};

/**
 * Draws an image onto the context with "object-fit: cover" behavior.
 * Centers the image and crops excess.
 */
const drawImageCover = (
  ctx: CanvasRenderingContext2D, 
  img: HTMLImageElement, 
  x: number,
  y: number,
  width: number, 
  height: number
) => {
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;
  
  const scale = Math.max(width / imgWidth, height / imgHeight);
  
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  
  const drawX = x + (width - scaledWidth) / 2;
  const drawY = y + (height - scaledHeight) / 2;
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
  ctx.restore();
};

export const generateGif = async (
  imageAUrl: string,
  imageBUrl: string,
  options: GifOptions,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  const [imgA, imgB] = await Promise.all([loadImage(imageAUrl), loadImage(imageBUrl)]);

  // --- 1. Determine Output Canvas Size ---
  let canvasWidth = 1080; // Base resolution
  let canvasHeight = 1080;

  // If Poster Mode is enabled, dimensions are driven by Poster Aspect Ratio
  if (options.poster && options.poster.enabled) {
    const [w, h] = options.poster.posterAspectRatio.split(':').map(Number);
    // Keep width at 1080 (or max width from options) and scale height
    if (options.widthType !== 'original') {
      canvasWidth = parseInt(options.widthType);
    }
    canvasHeight = Math.round(canvasWidth * (h / w));
  } else {
    // Standard Mode: Driven by Image/Option Ratio
    const originalWidth = imgA.naturalWidth;
    const originalHeight = imgA.naturalHeight;
    
    let targetRatio = originalWidth / originalHeight;
    if (options.aspectRatio !== 'original') {
      const [w, h] = options.aspectRatio.split(':').map(Number);
      targetRatio = w / h;
    }

    if (options.widthType !== 'original') {
      canvasWidth = parseInt(options.widthType);
    } else {
      canvasWidth = originalWidth;
    }
    canvasHeight = Math.round(canvasWidth / targetRatio);
  }

  // --- 2. Calculate "Content Box" (The Animation Area) ---
  // The animation itself might have a specific aspect ratio (e.g., 1:1 image inside 9:16 poster)
  let contentWidth = canvasWidth;
  let contentHeight = canvasHeight;

  // Determine the shape of the animation frame
  let animTargetRatio = imgA.naturalWidth / imgA.naturalHeight;
  if (options.aspectRatio !== 'original') {
    const [w, h] = options.aspectRatio.split(':').map(Number);
    animTargetRatio = w / h;
  }
  
  // Calculate raw content dimensions before scaling/positioning
  contentHeight = contentWidth / animTargetRatio;

  // Apply Poster Scaling and Positioning
  let contentX = 0;
  let contentY = 0;

  if (options.poster && options.poster.enabled) {
     const scale = options.poster.imageScale;
     const scaledW = contentWidth * scale;
     const scaledH = contentHeight * scale;
     
     // Position center based on percentage
     contentX = (canvasWidth * options.poster.imagePos.x) - (scaledW / 2);
     contentY = (canvasHeight * options.poster.imagePos.y) - (scaledH / 2);
     
     contentWidth = scaledW;
     contentHeight = scaledH;
  } else {
     // Center vertically if ratios mismatch in standard mode (shouldn't happen with updated logic but good safety)
     if (contentHeight > canvasHeight) {
       // Fit to height logic could go here, but usually we fit to width
     }
  }


  // --- 3. Setup Canvas ---
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas context');

  // Helper Wrapper to draw image in the correct content box
  const drawContent = (img: HTMLImageElement) => {
    drawImageCover(ctx, img, contentX, contentY, contentWidth, contentHeight);
  };

  // --- 4. Setup GIF Encoder ---
  const workerScriptUrl = getWorkerBlobUrl();
  const concurrency = navigator.hardwareConcurrency || 4;
  
  // Check if GIF library is loaded
  if (typeof (window as any).GIF === 'undefined') {
    throw new Error('GIF library not loaded. Please refresh the page.');
  }

  const gif = new (window as any).GIF({
    workers: Math.min(concurrency, 8),
    quality: options.quality,
    width: canvasWidth,
    height: canvasHeight,
    workerScript: workerScriptUrl,
    background: options.poster?.enabled ? options.poster.backgroundColor : '#000000',
  });

  // --- 5. Generate Frames ---
  // Note: For poster mode, we draw: Background -> Image -> Text.
  // This ensures text is ON TOP of the image if they overlap.
  
  const drawFrame = (imgToDraw: HTMLImageElement | null, splitProgress: number | null) => {
      // 1. Draw Background (Color)
      if (options.poster?.enabled) {
         ctx.fillStyle = options.poster.backgroundColor;
         ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
         ctx.fillStyle = '#000000'; // Default BG
         ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // 2. Draw Image (The Animation)
      if (splitProgress === null) {
         // Standard full frame
         if (imgToDraw) drawContent(imgToDraw);
      } else {
         // Slider Split
         // Draw Base (Image A)
         drawContent(imgA);
         
         // Draw Overlay (Image B) - Clipped
         const relativeSplitX = contentX + (contentWidth * splitProgress);
         
         ctx.save();
         ctx.beginPath();
         ctx.rect(contentX, contentY, contentWidth * splitProgress, contentHeight);
         ctx.clip();
         drawContent(imgB);
         ctx.restore();

         // Draw Vertical Line
         if (splitProgress > 0 && splitProgress < 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(relativeSplitX - 2, contentY, 4, contentHeight);
         }
      }

      // 3. Draw Text (On Top)
      if (options.poster?.enabled) {
          // We only draw text here, because BG was drawn at step 1
          const config = options.poster;
          const scaleFactor = canvasWidth / 1080;
          
          // Use config sizes
          const titleSize = Math.max(10, Math.round(config.titleFontSize * scaleFactor));
          const subtitleSize = Math.max(10, Math.round(config.subtitleFontSize * scaleFactor));
          
          const fontName = config.fontFamily;

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = config.textColor;

          if (config.title) {
            ctx.font = `bold ${titleSize}px ${fontName}`;
            ctx.fillText(config.title, canvasWidth * config.titlePos.x, canvasHeight * config.titlePos.y);
          }
          if (config.subtitle) {
            ctx.font = `${subtitleSize}px ${fontName}`;
            ctx.fillText(config.subtitle, canvasWidth * config.subtitlePos.x, canvasHeight * config.subtitlePos.y);
          }
      }
  };

  if (options.mode === 'blink') {
    // --- MODE: BLINK ---
    drawFrame(imgA, null);
    gif.addFrame(ctx, { copy: true, delay: options.delay });

    drawFrame(imgB, null);
    gif.addFrame(ctx, { copy: true, delay: options.delay });

  } else if (options.mode === 'slider') {
    // --- MODE: SLIDER ---
    const slideDuration = 1500;
    const fps = options.fps;
    const frameDelay = 1000 / fps;
    const totalFrames = Math.floor(slideDuration / frameDelay);

    // 1. Hold on Image A
    drawFrame(imgA, null);
    gif.addFrame(ctx, { copy: true, delay: options.delay });

    // 2. Sliding Animation
    for (let i = 0; i <= totalFrames; i++) {
      const progress = i / totalFrames;
      drawFrame(null, progress);
      gif.addFrame(ctx, { copy: true, delay: frameDelay });
    }

    // 3. Hold on Image B
    drawFrame(imgB, null);
    gif.addFrame(ctx, { copy: true, delay: options.delay });
  }

  // --- 6. Render ---
  return new Promise((resolve, reject) => {
    gif.on('progress', (p: number) => {
      onProgress(Math.round(p * 100));
    });

    gif.on('finished', (blob: Blob) => {
      // Cleanup
      URL.revokeObjectURL(workerScriptUrl);
      resolve(blob);
    });

    gif.on('abort', () => {
       URL.revokeObjectURL(workerScriptUrl);
      reject(new Error('GIF generation aborted'));
    });

    try {
      gif.render();
    } catch (err) {
      URL.revokeObjectURL(workerScriptUrl);
      reject(err);
    }
  });
};