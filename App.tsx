
import React, { useState, useCallback } from 'react';
import { Download, Sparkles, RefreshCw, Layers, Zap, Clock, Image as ImageIcon, Settings, ScanLine, Eye, Monitor, Gauge, Feather, Film, Crop, FileDigit } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { generateGif } from './utils/gifGenerator';
import { ImageFile, GifOptions } from './types';
import { PosterEditor } from './components/PosterEditor';

function App() {
  const [imgA, setImgA] = useState<ImageFile | null>(null);
  const [imgB, setImgB] = useState<ImageFile | null>(null);
  
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  
  const [options, setOptions] = useState<GifOptions>({
    mode: 'slider',
    delay: 1000, 
    quality: 2, // Best quality optimized
    fps: 25,
    widthType: 'original',
    aspectRatio: 'original'
  });

  const handleImageSelect = useCallback((file: File, type: 'A' | 'B') => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const imageData: ImageFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      if (type === 'A') setImgA(imageData);
      else setImgB(imageData);
    };
    img.src = url;
  }, []);

  const handleGenerate = async () => {
    if (!imgA || !imgB) return;

    try {
      setGenerating(true);
      setProgress(0);
      setGeneratedGifUrl(null);
      setFileSize(null);

      // Add a small timeout to allow UI to update before heavy processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const blob = await generateGif(imgA.previewUrl, imgB.previewUrl, options, (p) => {
        setProgress(p);
      });

      const url = URL.createObjectURL(blob);
      const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
      
      setGeneratedGifUrl(url);
      setFileSize(sizeInMB);

    } catch (error) {
      console.error('Error generating GIF:', error);
      alert('Failed to generate GIF. Please ensure images are valid.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedGifUrl) return;
    const a = document.createElement('a');
    a.href = generatedGifUrl;
    a.download = `diffgif-${options.mode}-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500/30 font-sans pb-12">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
              <Layers size={18} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DiffGIF
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-500 border border-slate-800 rounded px-2 py-1">
             v3.6 Pro
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* SECTION 1: Standard Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs & Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Image Inputs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
               <h2 className="flex items-center gap-2 text-md font-semibold text-slate-200">
                <ImageIcon size={18} className="text-brand-400" />
                Source Images
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Dropzone 
                  label="Before (Left)" 
                  colorClass="text-blue-400"
                  image={imgA} 
                  onImageSelect={(f) => handleImageSelect(f, 'A')} 
                  onRemove={() => setImgA(null)} 
                />
                <Dropzone 
                  label="After (Right)" 
                  colorClass="text-purple-400"
                  image={imgB} 
                  onImageSelect={(f) => handleImageSelect(f, 'B')} 
                  onRemove={() => setImgB(null)} 
                />
              </div>
            </div>

            {/* Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
              <h2 className="flex items-center gap-2 text-md font-semibold text-slate-200">
                <Settings size={18} className="text-brand-400" />
                Settings
              </h2>
              
              <div className="space-y-5">
                {/* 1. Mode */}
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wide">Animation Mode</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, mode: 'slider' }))}
                      className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                        options.mode === 'slider' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <ScanLine size={16} />
                      Slider
                    </button>
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, mode: 'blink' }))}
                      className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                        options.mode === 'blink' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <Eye size={16} />
                      Blink
                    </button>
                  </div>
                </div>

                {/* 2. Duration */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label className="text-slate-400 flex items-center gap-2 font-medium">
                      <Clock size={14} /> 
                      {options.mode === 'slider' ? 'Hold Time' : 'Blink Interval'}
                    </label>
                    <span className="text-brand-400 font-mono text-xs">{options.delay}ms</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="3000"
                    step="100"
                    value={options.delay}
                    onChange={(e) => setOptions(prev => ({ ...prev, delay: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400"
                  />
                </div>

                {/* 3. Aspect Ratio */}
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                     <Crop size={14} /> Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                     {[
                       { val: 'original', label: 'Auto' },
                       { val: '1:1', label: '1:1' },
                       { val: '16:9', label: '16:9' },
                       { val: '21:9', label: '21:9' },
                       { val: '4:3', label: '4:3' },
                       { val: '3:4', label: '3:4' },
                       { val: '4:5', label: '4:5' },
                       { val: '9:16', label: '9:16' }
                     ].map((ratio) => (
                       <button
                         key={ratio.val}
                         onClick={() => setOptions(prev => ({...prev, aspectRatio: ratio.val as any}))}
                         className={`px-1 py-1.5 rounded text-[11px] font-mono border transition-all truncate ${
                           options.aspectRatio === ratio.val
                             ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                         }`}
                         title={ratio.label}
                       >
                         {ratio.label}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   {/* 4. FPS */}
                   <div>
                      <label className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                        <Film size={14} /> Frame Rate
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[10, 15, 25, 50].map((fps) => (
                          <button
                            key={fps}
                            onClick={() => setOptions(prev => ({...prev, fps}))}
                            className={`px-1 py-1.5 rounded text-xs font-mono border transition-all ${
                              options.fps === fps
                                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {fps}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* 5. Quality */}
                   <div>
                      <label className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                        <Feather size={14} /> Quality
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { val: 2, label: 'Best' },
                          { val: 10, label: 'Mid' },
                          { val: 20, label: 'Low' }
                        ].map((q) => (
                          <button
                            key={q.val}
                            onClick={() => setOptions(prev => ({...prev, quality: q.val}))}
                            className={`px-1 py-1.5 rounded text-xs border transition-all ${
                              options.quality === q.val
                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>

                {/* 6. Resolution */}
                <div>
                   <label className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Monitor size={14} /> Max Width
                   </label>
                   <div className="grid grid-cols-4 gap-2">
                      {[
                        { val: 'original', label: 'Orig' },
                        { val: '1920', label: '1080p' },
                        { val: '1280', label: '720p' },
                        { val: '854', label: '480p' },
                      ].map((res) => (
                        <button
                          key={res.val}
                          onClick={() => setOptions(prev => ({...prev, widthType: res.val as any}))}
                          className={`px-2 py-2 rounded-md text-xs font-medium border transition-all ${
                             options.widthType === res.val
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {res.label}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={!imgA || !imgB || generating}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform
                ${(!imgA || !imgB) 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white hover:scale-[1.02] shadow-brand-500/25 active:scale-[0.98]'
                }
              `}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Rendering {progress}%
                </>
              ) : (
                <>
                  <Zap size={20} fill="currentColor" />
                  Generate GIF
                </>
              )}
            </button>
          </div>

          {/* Right Column: Preview & Result */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Main Display Area */}
            <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
               {/* Checkered Background for Transparency */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{
                      backgroundImage: `linear-gradient(45deg, #334155 25%, transparent 25%), 
                                        linear-gradient(-45deg, #334155 25%, transparent 25%), 
                                        linear-gradient(45deg, transparent 75%, #334155 75%), 
                                        linear-gradient(-45deg, transparent 75%, #334155 75%)`,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }} 
               />

               {generatedGifUrl ? (
                 <div className="relative z-10 flex flex-col items-center gap-4 w-full h-full p-4">
                   <img 
                      src={generatedGifUrl} 
                      alt="Generated Result" 
                      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-slate-700"
                   />
                 </div>
               ) : (
                 <div className="text-center z-10 p-8">
                   {imgA && imgB ? (
                     <div className="flex items-center justify-center gap-4 opacity-50">
                        <Sparkles size={48} className="text-slate-600" />
                        <p className="text-xl text-slate-400 font-light">Ready to generate</p>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                        <ImageIcon size={64} className="text-slate-600" />
                        <p className="text-xl text-slate-400 font-light">Upload two images to start</p>
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Result Actions */}
            {generatedGifUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">GIF Ready!</h3>
                    <p className="text-slate-400 text-sm">Comparison generated successfully.</p>
                  </div>
                  {fileSize && (
                     <div className="px-3 py-1 bg-slate-800 rounded-md border border-slate-700 flex items-center gap-2">
                        <FileDigit size={14} className="text-slate-400" />
                        <span className="text-sm font-mono text-brand-300">{fileSize} MB</span>
                     </div>
                  )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setGeneratedGifUrl(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 font-medium transition-all hover:scale-105"
                  >
                    <Download size={18} />
                    Download GIF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Poster Editor (ALWAYS VISIBLE) */}
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100">
           <PosterEditor imgA={imgA} imgB={imgB} baseOptions={options} />
        </div>
      </main>
    </div>
  );
}

export default App;
