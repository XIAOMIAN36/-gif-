import React, { useState, useCallback } from 'react';
import { Download, Sparkles, Layers, Zap, Clock, Image as ImageIcon, Settings, ScanLine, Eye, Monitor, Feather, Film, Crop, FileDigit } from 'lucide-react';
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
    quality: 2, 
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
      await new Promise(resolve => setTimeout(resolve, 100));
      const blob = await generateGif(imgA.previewUrl, imgB.previewUrl, options, (p) => setProgress(p));
      setGeneratedGifUrl(URL.createObjectURL(blob));
      setFileSize((blob.size / (1024 * 1024)).toFixed(2));
    } catch (error) {
      console.error('Error generating GIF:', error);
      alert('Failed to generate GIF.');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-lg">
              <Layers size={18} />
            </div>
            <h1 className="text-xl font-bold text-white">DiffGIF</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
               <h2 className="flex items-center gap-2 text-md font-semibold text-slate-200"><ImageIcon size={18} className="text-brand-400" /> Source Images</h2>
              <div className="grid grid-cols-2 gap-4">
                <Dropzone label="Before (Left)" colorClass="text-blue-400" image={imgA} onImageSelect={(f) => handleImageSelect(f, 'A')} onRemove={() => setImgA(null)} />
                <Dropzone label="After (Right)" colorClass="text-purple-400" image={imgB} onImageSelect={(f) => handleImageSelect(f, 'B')} onRemove={() => setImgB(null)} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
              <h2 className="flex items-center gap-2 text-md font-semibold text-slate-200"><Settings size={18} className="text-brand-400" /> Settings</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wide">Animation Mode</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setOptions(prev => ({ ...prev, mode: 'slider' }))} className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${options.mode === 'slider' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><ScanLine size={16} /> Slider</button>
                    <button onClick={() => setOptions(prev => ({ ...prev, mode: 'blink' }))} className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${options.mode === 'blink' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Eye size={16} /> Blink</button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2"><label className="text-slate-400 flex items-center gap-2 font-medium"><Clock size={14} /> Duration</label><span className="text-brand-400 font-mono text-xs">{options.delay}ms</span></div>
                  <input type="range" min="200" max="3000" step="100" value={options.delay} onChange={(e) => setOptions(prev => ({ ...prev, delay: Number(e.target.value) }))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500" />
                </div>
                
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wide"><Crop size={14} /> Ratio</label>
                  <div className="grid grid-cols-4 gap-1.5">{[{ val: 'original', label: 'Auto' }, { val: '1:1', label: '1:1' }, { val: '16:9', label: '16:9' }, { val: '4:3', label: '4:3' }].map((ratio) => (<button key={ratio.val} onClick={() => setOptions(prev => ({...prev, aspectRatio: ratio.val as any}))} className={`px-1 py-1.5 rounded text-[11px] font-mono border transition-all ${options.aspectRatio === ratio.val ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{ratio.label}</button>))}</div>
                </div>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={!imgA || !imgB || generating} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${(!imgA || !imgB) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:scale-[1.02]'}`}>
              {generating ? `Rendering ${progress}%` : <><Zap size={20} /> Generate GIF</>}
            </button>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex-1 min-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
               {generatedGifUrl ? (
                 <img src={generatedGifUrl} alt="Result" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" />
               ) : (
                 <div className="text-center z-10 p-8 opacity-30"><Sparkles size={48} className="text-slate-600 mx-auto mb-4" /><p className="text-xl text-slate-400">Ready to generate</p></div>
               )}
            </div>
            {generatedGifUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-white">GIF Ready!</h3>
                  {fileSize && <span className="text-sm font-mono text-brand-300 bg-slate-800 px-2 py-1 rounded">{fileSize} MB</span>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setGeneratedGifUrl(null)} className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800">Discard</button>
                  <button onClick={handleDownload} className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white shadow-lg flex items-center gap-2"><Download size={18} /> Download</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* POSTER EDITOR ALWAYS VISIBLE */}
        <PosterEditor imgA={imgA} imgB={imgB} baseOptions={options} />
      </main>
    </div>
  );
}

export default App;