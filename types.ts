
export type AnimationMode = 'blink' | 'slider';

export interface ElementPosition {
  x: number; // 0-1 (percentage of canvas width)
  y: number; // 0-1 (percentage of canvas height)
}

export interface PosterConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  
  // Font Sizes (Reference based on 1080p width)
  titleFontSize: number;
  subtitleFontSize: number;

  // New Layout Props
  posterAspectRatio: '1:1' | '9:16' | '16:9' | '4:5' | '3:4' | '4:3' | '21:9';
  titlePos: ElementPosition;
  subtitlePos: ElementPosition;
  imagePos: ElementPosition;
  imageScale: number; // 0.1 to 2.0
}

export interface GifOptions {
  mode: AnimationMode;
  delay: number; // Hold duration (ms)
  quality: number; // 1-30 (1 is best)
  fps: number; // Frames per second for animation
  widthType: 'original' | '1920' | '1280' | '854'; // Preset max widths
  aspectRatio: 'original' | '16:9' | '21:9' | '4:3' | '1:1' | '3:4' | '4:5' | '9:16'; // Output aspect ratio
  poster?: PosterConfig; // Optional poster settings
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

declare global {
  class GIF {
    constructor(options: any);
    addFrame(imageElement: HTMLImageElement | HTMLCanvasElement | CanvasRenderingContext2D, options?: any): void;
    on(event: string, callback: (args?: any) => void): void;
    render(): void;
  }
}
