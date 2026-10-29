import React, { useEffect, useRef } from 'react';
import { Bookmark } from '../types';
import { ExternalLink, Star, Copy, Edit3, CheckSquare, Trash2 } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  bookmark: Bookmark;
  x: number;
  y: number;
  onClose: () => void;
  onOpen: () => void;
  onTogglePin: () => void;
  onCopyLink: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

export const ContextMenu: React.FC<Props> = ({
  bookmark,
  x,
  y,
  onClose,
  onOpen,
  onTogglePin,
  onCopyLink,
  onEdit,
  onSelect,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [onClose]);

  // Ensure menu stays within viewport
  const menuWidth = 200;
  const menuHeight = 260;
  const posX = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, x - menuWidth / 2));
  const posY = Math.max(12, Math.min(window.innerHeight - menuHeight - 12, y + 8));

  return (
    <div
      ref={menuRef}
      style={{ left: `${posX}px`, top: `${posY}px` }}
      className="fixed z-50 w-52 rounded-2xl bg-[var(--sf)]/95 backdrop-blur-xl border border-[var(--bd)] p-1.5 shadow-2xl animate-in zoom-in-95 duration-150 text-[var(--tx)] text-sm font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-[var(--sep)] mb-1">
        <p className="font-bold text-xs truncate">{bookmark.title}</p>
        <p className="text-[10px] text-[var(--mu)] truncate mt-0.5">{bookmark.url}</p>
      </div>

      <button
        type="button"
        onClick={() => {
          haptic.tap();
          onOpen();
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-[var(--fill)] transition text-left cursor-pointer"
      >
        <ExternalLink className="w-4 h-4 text-[var(--mu)]" />
        <span>Open link</span>
      </button>

      <button
        type="button"
        onClick={() => {
          haptic.pop();
          onTogglePin();
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-[var(--fill)] transition text-left cursor-pointer"
      >
        <Star className={`w-4 h-4 ${bookmark.pinned ? 'fill-[var(--ac)] text-[var(--ac)]' : 'text-[var(--mu)]'}`} />
        <span>{bookmark.pinned ? 'Unpin bookmark' : 'Pin to top'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          haptic.tap();
          onCopyLink();
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-[var(--fill)] transition text-left cursor-pointer"
      >
        <Copy className="w-4 h-4 text-[var(--mu)]" />
        <span>Copy link</span>
      </button>

      <button
        type="button"
        onClick={() => {
          haptic.tap();
          onEdit();
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-[var(--fill)] transition text-left cursor-pointer"
      >
        <Edit3 className="w-4 h-4 text-[var(--mu)]" />
        <span>Edit details</span>
      </button>

      <button
        type="button"
        onClick={() => {
          haptic.tap();
          onSelect();
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-[var(--fill)] transition text-left cursor-pointer"
      >
        <CheckSquare className="w-4 h-4 text-[var(--mu)]" />
        <span>Select multiple</span>
      </button>

      <div className="my-1 border-t border-[var(--sep)]" />

      <button
        type="button"
        onClick={() => {
          haptic.warning();
          onDelete();
          onClose();
        }}
        className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-red-500 hover:bg-red-500/10 transition text-left cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete bookmark</span>
      </button>
    </div>
  );
};
