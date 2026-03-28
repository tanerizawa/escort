'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-dark-800/80 p-2 text-dark-300 hover:text-white transition-colors"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt || 'Image'}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

interface ChatImageProps {
  src: string;
  isOwn: boolean;
}

export function ChatImage({ src, isOwn }: ChatImageProps) {
  const [lightbox, setLightbox] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <div
        className="cursor-pointer overflow-hidden rounded-lg"
        onClick={() => setLightbox(true)}
      >
        {!loaded && (
          <div className="flex h-40 w-48 items-center justify-center rounded-lg bg-dark-700/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-dark-500 border-t-brand-400" />
          </div>
        )}
        <img
          src={src}
          alt="Shared image"
          className={`max-h-60 max-w-[240px] rounded-lg object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0 h-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
      {lightbox && <ImageLightbox src={src} onClose={() => setLightbox(false)} />}
    </>
  );
}

interface ImagePreviewBarProps {
  files: File[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function ImagePreviewBar({ files, onRemove, onClear }: ImagePreviewBarProps) {
  if (files.length === 0) return null;

  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-dark-700/50 bg-dark-800/50 p-2">
      <div className="flex flex-1 gap-2 overflow-x-auto">
        {files.map((file, index) => (
          <div key={index} className="relative shrink-0">
            <img
              src={URL.createObjectURL(file)}
              alt={`Preview ${index + 1}`}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-400"
            >
              <X className="h-4 w-4 inline-block" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onClear}
        className="shrink-0 rounded px-2 py-1 text-xs text-dark-400 hover:text-dark-200"
      >
        Clear
      </button>
    </div>
  );
}
