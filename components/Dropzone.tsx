import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ImageFile } from '../types';

interface DropzoneProps {
  label: string;
  image: ImageFile | null;
  onImageSelect: (file: File) => void;
  onRemove: () => void;
  colorClass: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({ label, image, onImageSelect, onRemove, colorClass }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  };

  const handleClick = () => {
    if (!image) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className={`text-sm font-semibold uppercase tracking-wider ${colorClass}`}>
        {label}
      </span>
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full aspect-[4/3] rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group
          ${image ? 'border-transparent bg-slate-800' : 'hover:border-slate-500'}
          ${isDragging ? 'border-brand-400 bg-brand-500/10' : 'border-slate-700 bg-slate-800/50'}
        `}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleChange}
          accept="image/*"
          className="hidden"
        />

        {image ? (
          <>
            <img
              src={image.previewUrl}
              alt={label}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm shadow-lg transition-transform hover:scale-105"
              >
                <X size={16} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end text-xs text-white">
               <span className="truncate max-w-[70%]">{image.file.name}</span>
               <span>{image.width}x{image.height}</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <div className={`p-4 rounded-full bg-slate-800/80 mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <Upload size={24} className={isDragging ? 'text-brand-400' : ''} />
            </div>
            <p className="text-sm font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};
