import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, Check, ZoomIn } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

export const WallpaperCropModal: React.FC<Props> = ({ isOpen, onClose, onApply }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setImageSrc(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        drawPreview(img, 1, { x: 0, y: 0 });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const drawPreview = (img: HTMLImageElement, z: number, off: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const baseScale = Math.max(cw / img.width, ch / img.height);
    const scale = baseScale * z;

    const renderW = img.width * scale;
    const renderH = img.height * scale;

    const renderX = (cw - renderW) / 2 + off.x;
    const renderY = (ch - renderH) / 2 + off.y;

    ctx.drawImage(img, renderX, renderY, renderW, renderH);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !imageRef.current) return;
    const newOff = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setOffset(newOff);
    drawPreview(imageRef.current, zoom, newOff);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    if (!canvasRef.current) return;
    haptic.success();
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    onApply(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-6 shadow-2xl text-[var(--tx)] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--sep)]">
          <h3 className="text-base font-bold">Crop Photo Wallpaper</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:bg-[var(--fill)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!imageSrc ? (
          <div className="my-8 text-center">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--bd)] rounded-3xl cursor-pointer hover:border-[var(--ac)] transition bg-[var(--fill)]/30">
              <span className="text-sm font-semibold text-[var(--tx)]">Select a Photo from Device</span>
              <span className="text-xs text-[var(--mu)] mt-1">PNG, JPG, WebP supported</span>
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="my-4 space-y-4">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={280}
                height={460}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-[200px] h-[330px] rounded-2xl border border-[var(--bd)] shadow-lg cursor-grab active:cursor-grabbing bg-black/40 touch-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--mu)] mb-1">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom</span>
                </span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => {
                  const z = Number(e.target.value);
                  setZoom(z);
                  if (imageRef.current) drawPreview(imageRef.current, z, offset);
                }}
                className="w-full accent-[var(--ac)]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                  if (imageRef.current) drawPreview(imageRef.current, 1, { x: 0, y: 0 });
                }}
                className="p-2.5 rounded-xl bg-[var(--fill)] hover:bg-[var(--fill)]/80 text-[var(--tx)]"
                title="Reset crop"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[var(--fill)] text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2.5 rounded-xl bg-[var(--ac)] text-[var(--on)] text-xs font-semibold shadow-md flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                <span>Apply Wallpaper</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
