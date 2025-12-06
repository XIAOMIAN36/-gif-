
import React, { useState, useEffect, useRef } from 'react';
import { Download, Type, Palette, LayoutTemplate, Zap, FileDigit, MousePointer2, Move, Crop, Type as TypeIcon } from 'lucide-react';
import { ImageFile, GifOptions, PosterConfig, ElementPosition } from '../types';
import { generateGif } from '../utils/gifGenerator';

interface PosterEditorProps {
  imgA: ImageFile | null;
  imgB: ImageFile | null;
  baseOptions: GifOptions;
}

export const PosterEditor: React.FC<PosterEditorProps> = ({ imgA, imgB, baseOptions }) => {
  const [config, setConfig] = useState<PosterConfig>({
    enabled: true,
    title: 'BEFORE & AFTER',
    subtitle: '@DiffGIF',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
    titleFontSize: 80,
    subtitleFontSize: 30,
    posterAspectRatio: '1:1',
    titlePos: { x: 0.5, y: 0.1 },
    subtitlePos: { x: 0.85, y: 0.95 },
    imagePos: { x: 0.5, y: 0.5 },
    imageScale: 0.8,
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  
  // Drag and Drop State
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingItem, setDraggingItem] = useState<'title' | 'subtitle' | 'image' | null>(null);
  const [isHovering, setIsHovering] = useState<'title' | 'subtitle' | 'image' | null>(null);

  const fontOptions = [
    { value: 'Inter, sans-serif', label: 'Inter (Sans)' },
    { value: 'serif', label: 'Serif Standard' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'cursive', label: 'Handwriting' }
  ];

  // --- Real-time Static Preview & Rendering Logic ---
  const renderPreview = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Setup Canvas Dimensions (Fixed width for preview UI)
    const previewWidth = 600;
    const [rw, rh] = config.posterAspectRatio.split(':').map(Number);
    const previewHeight = Math.round(previewWidth * (rh / rw));
    
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // 2. Draw Background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw Image (Centered at dynamic pos)
    if (imgA) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgA.previewUrl;
      // Note: In a real app we'd cache this image object to avoid reloading on every render frame
      await new Promise((r) => { 
          if(img.complete) r(null);
          else img.onload = () => r(null); 
      });

      // Calculate Inner Content Box
      // The animation's shape
      let animRatio = img.naturalWidth / img.naturalHeight;
      if (baseOptions.aspectRatio !== 'original') {
         const [aw, ah] = baseOptions.aspectRatio.split(':').map(Number);
         animRatio = aw / ah;
      }
      
      const baseContentWidth = previewWidth; 
      const baseContentHeight = baseContentWidth / animRatio;

      const scaledW = baseContentWidth * config.imageScale;
      const scaledH = baseContentHeight * config.imageScale;

      const drawX = (previewWidth * config.imagePos.x) - (scaledW / 2);
      const drawY = (previewHeight * config.imagePos.y) - (scaledH / 2);

      // Draw Cover approximation
      ctx.save();
      ctx.beginPath();
      ctx.rect(drawX, drawY, scaledW, scaledH);
      ctx.clip();
      
      // Draw actual image with cover fit logic
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetRatio = scaledW / scaledH;
      let renderW = scaledW;
      let renderH = scaledH;
      let offX = 0;
      let offY = 0;
      
      if (imgRatio > targetRatio) {
         renderW = scaledH * imgRatio;
         offX = (scaledW - renderW) / 2;
      } else {
         renderH = scaledW / imgRatio;
         offY = (scaledH - renderH) / 2;
      }
      ctx.drawImage(img, drawX + offX, drawY + offY, renderW, renderH);
      ctx.restore();

      // Selection Highlight
      if (isHovering === 'image' || draggingItem === 'image') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, scaledW, scaledH);
      }
    }

    // 4. Draw Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = config.textColor;
    
    // Calculate scale relative to 1080p to match generator logic
    const previewScale = canvas.width / 1080;

    // Title
    if (config.title) {
        ctx.font = `bold ${Math.round(config.titleFontSize * previewScale)}px ${config.fontFamily}`;
        const tx = canvas.width * config.titlePos.x;
        const ty = canvas.height * config.titlePos.y;
        ctx.fillText(config.title, tx, ty);
        
        // Highlight
        if (isHovering === 'title' || draggingItem === 'title') {
            const metrics = ctx.measureText(config.title);
            const h = config.titleFontSize * previewScale;
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx - metrics.width/2 - 10, ty - h/2 - 5, metrics.width + 20, h + 10);
        }
    }

    // Subtitle
    if (config.subtitle) {
        ctx.font = `${Math.round(config.subtitleFontSize * previewScale)}px ${config.fontFamily}`;
        const sx = canvas.width * config.subtitlePos.x;
        const sy = canvas.height * config.subtitlePos.y;
        ctx.fillText(config.subtitle, sx, sy);

        // Highlight
        if (isHovering === 'subtitle' || draggingItem === 'subtitle') {
            const metrics = ctx.measureText(config.subtitle);
            const h = config.subtitleFontSize * previewScale;
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx - metrics.width/2 - 10, sy - h/2 - 5, metrics.width + 20, h + 10);
        }
    }
  };

  useEffect(() => {
    renderPreview();
  }, [config, imgA, baseOptions.aspectRatio, isHovering, draggingItem]);


  // --- Mouse Interaction Handlers ---

  const getMousePos = (e: React.MouseEvent) => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          w: rect.width,
          h: rect.height
      };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      const { x, y, w, h } = getMousePos(e);
      const nx = x / w; // normalized x
      const ny = y / h; // normalized y

      // Check hit detection (Simplified distance check)
      // Check Title
      const distTitle = Math.hypot(nx - config.titlePos.x, ny - config.titlePos.y);
      if (distTitle < 0.1) { setDraggingItem('title'); return; }

      // Check Subtitle
      const distSub = Math.hypot(nx - config.subtitlePos.x, ny - config.subtitlePos.y);
      if (distSub < 0.1) { setDraggingItem('subtitle'); return; }

      // Check Image (Center distance check, wider range)
      const distImg = Math.hypot(nx - config.imagePos.x, ny - config.imagePos.y);
      if (distImg < 0.3) { setDraggingItem('image'); return; }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const { x, y, w, h } = getMousePos(e);
      const nx = x / w;
      const ny = y / h;

      if (draggingItem) {
          // Update Position
          setConfig(prev => {
              const newPos = { x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) };
              if (draggingItem === 'title') return { ...prev, titlePos: newPos };
              if (draggingItem === 'subtitle') return { ...prev, subtitlePos: newPos };
              if (draggingItem === 'image') return { ...prev, imagePos: newPos };
              return prev;
          });
      } else {
          // Hover Detection
          let hover: any = null;
          if (Math.hypot(nx - config.titlePos.x, ny - config.titlePos.y) < 0.1) hover = 'title';
          else if (Math.hypot(nx - config.subtitlePos.x, ny - config.subtitlePos.y) < 0.1) hover = 'subtitle';
          else if (Math.hypot(nx - config.imagePos.x, ny - config.imagePos.y) < 0.3) hover = 'image';
          setIsHovering(hover);
      }
  };

  const handleMouseUp = () => {
      setDraggingItem(null);
  };


  const handleGenerate = async () => {
    if (generating || !imgA || !imgB) return;
    setGenerating(true);
    setProgress(0);
    setPosterUrl(null);
    setFileSize(null);
    
    await new Promise(r => setTimeout(r, 100));

    try {
      const finalOptions: GifOptions = {
        ...baseOptions,
        poster: config
      };

      const blob = await generateGif(imgA.previewUrl, imgB.previewUrl, finalOptions, (p) => {
        setProgress(p);
      });

      const url = URL.createObjectURL(blob);
      setPosterUrl(url);
      setFileSize((blob.size / (1024 * 1024)).toFixed(2));
    } catch (e) {
      console.error(e);
      alert('Failed to generate poster');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!posterUrl) return;
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = `diffgif-poster-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden relative mt-8">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg text-white shadow-lg">
           <LayoutTemplate size={20} />
        </div>
        <div>
           <h2 className="text-xl font-bold text-white">Poster Studio</h2>
           <p className="text-slate-400 text-xs">Drag and drop elements on the preview to arrange your layout.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Text Config */}
           <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-2">
                   <Type size={14} /> TEXT CONTENT
                </label>
                <input 
                  type="text" 
                  value={config.title}
                  onChange={e => setConfig({...config, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-pink-500 outline-none mb-2"
                  placeholder="Main Title"
                />
                <input 
                  type="text" 
                  value={config.subtitle}
                  onChange={e => setConfig({...config, subtitle: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Subtitle"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-2">
                   <Palette size={14} /> STYLE & COLOR
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950 rounded border border-slate-800">
                        <span className="text-xs text-slate-500">Bg</span>
                        <input type="color" value={config.backgroundColor} onChange={e => setConfig({...config, backgroundColor: e.target.value})} className="bg-transparent border-0 w-6 h-6 cursor-pointer" />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950 rounded border border-slate-800">
                        <span className="text-xs text-slate-500">Text</span>
                        <input type="color" value={config.textColor} onChange={e => setConfig({...config, textColor: e.target.value})} className="bg-transparent border-0 w-6 h-6 cursor-pointer" />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase">Font Family</label>
                    <select 
                      value={config.fontFamily} 
                      onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
                    >
                      {fontOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-12">Title Size</span>
                        <input 
                          type="range" min="20" max="200" 
                          value={config.titleFontSize} 
                          onChange={(e) => setConfig({...config, titleFontSize: Number(e.target.value)})}
                          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <span className="text-[10px] text-slate-400 w-6 text-right">{config.titleFontSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-12">Sub Size</span>
                        <input 
                          type="range" min="10" max="100" 
                          value={config.subtitleFontSize} 
                          onChange={(e) => setConfig({...config, subtitleFontSize: Number(e.target.value)})}
                          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <span className="text-[10px] text-slate-400 w-6 text-right">{config.subtitleFontSize}</span>
                    </div>
                </div>
              </div>
           </div>

           <hr className="border-slate-800" />

           {/* Layout Config */}
           <div className="space-y-4">
              <div>
                  <label className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-2">
                    <Crop size={14} /> POSTER ASPECT RATIO
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                     {['1:1', '4:5', '3:4', '16:9', '9:16', '4:3', '21:9'].map(r => (
                        <button key={r} onClick={() => setConfig({...config, posterAspectRatio: r as any})}
                            className={`py-1.5 text-[10px] rounded border transition-colors ${config.posterAspectRatio === r ? 'bg-pink-500 text-white border-pink-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                            {r}
                        </button>
                     ))}
                  </div>
              </div>

              <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-xs text-slate-400 font-medium flex items-center gap-2">
                        <Move size={14} /> IMAGE SCALE
                    </label>
                    <span className="text-xs text-pink-400">{Math.round(config.imageScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.2" max="1.5" step="0.05"
                    value={config.imageScale}
                    onChange={e => setConfig({...config, imageScale: Number(e.target.value)})}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
              </div>
           </div>

           <button
              onClick={handleGenerate}
              disabled={generating || !imgA || !imgB}
              className={`
                w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all mt-4
                ${(generating || !imgA || !imgB)
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-slate-200 hover:scale-[1.02]'
                }
              `}
            >
              {generating ? `Rendering ${progress}%` : (
                <>
                  <Zap size={18} className="text-orange-600" />
                  Render Poster GIF
                </>
              )}
           </button>
        </div>

        {/* Preview / Result Area */}
        <div className="lg:col-span-8 bg-slate-950/50 rounded-xl border border-slate-800 p-8 flex flex-col items-center justify-center min-h-[500px] relative">
           
           {/* TABS / HEADER */}
           <div className="absolute top-4 left-4 flex gap-2 z-10">
              <span className={`text-xs font-bold px-2 py-1 rounded ${posterUrl ? 'bg-slate-800 text-slate-500' : 'bg-pink-500 text-white'}`}>
                 Live Canvas
              </span>
           </div>
           
           {/* Hint */}
           {!posterUrl && (
             <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                <MousePointer2 size={12} /> Drag elements to move
             </div>
           )}

           {/* CANVAS OR RESULT */}
           {posterUrl ? (
             <div className="flex flex-col gap-6 items-center w-full animate-in fade-in duration-500">
                <div className="relative group">
                    <img 
                      src={posterUrl} 
                      className="max-w-full max-h-[60vh] shadow-2xl rounded-sm object-contain border border-slate-700"
                      alt="Poster Result"
                    />
                    {fileSize && (
                      <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-white text-xs font-mono border border-white/20 shadow-lg">
                         {fileSize} MB
                      </div>
                    )}
                </div>
                
                <div className="flex gap-3">
                   <button onClick={() => setPosterUrl(null)} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm">Back to Edit</button>
                   <button onClick={handleDownload} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-green-500 transition-colors">
                       <Download size={16} /> Download
                   </button>
                </div>
             </div>
           ) : (
             <div 
                className={`relative shadow-2xl rounded-sm border border-slate-700 overflow-hidden ${draggingItem ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{touchAction: 'none'}} // Prevent scrolling while dragging on mobile
             >
               <canvas 
                 ref={previewCanvasRef} 
                 onMouseDown={handleMouseDown}
                 onMouseMove={handleMouseMove}
                 onMouseUp={handleMouseUp}
                 onMouseLeave={handleMouseUp}
                 className="block max-w-full max-h-[60vh] bg-black"
               />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
