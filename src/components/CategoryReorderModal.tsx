import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, RotateCcw, X, Check } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  currentOrder: string[];
  onSaveOrder: (newOrder: string[]) => void;
  onResetOrder: () => void;
}

export const CategoryReorderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  currentOrder,
  onSaveOrder,
  onResetOrder,
}) => {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    // Combine standard keys with categories in current order
    const standard = ['all', '★'];
    const allKnown = [...new Set([...currentOrder, ...standard, ...categories])].filter(
      (k) => k === 'all' || k === '★' || categories.includes(k)
    );
    setItems(allKnown);
  }, [categories, currentOrder, isOpen]);

  if (!isOpen) return null;

  const move = (idx: number, delta: number) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    haptic.tap();
    const updated = [...items];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setItems(updated);
  };

  const handleSave = () => {
    haptic.success();
    onSaveOrder(items);
    onClose();
  };

  const getLabel = (key: string) => {
    if (key === 'all') return 'All Bookmarks';
    if (key === '★') return '★ Pinned';
    return key.startsWith('@') ? key.slice(1) : key;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-6 shadow-2xl text-[var(--tx)] animate-in zoom-in-95 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--sep)]">
          <h3 className="text-base font-bold">Reorder Categories</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:bg-[var(--fill)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--mu)] mt-2 mb-3">
          Use the arrows to organize how category pills appear in the top bar.
        </p>

        {/* List of categories */}
        <div className="flex-1 overflow-y-auto space-y-1.5 my-2 pr-1">
          {items.map((key, idx) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)] text-xs font-semibold"
            >
              <span className="truncate flex-1">{getLabel(key)}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                  className="w-7 h-7 rounded-lg bg-[var(--sf)] flex items-center justify-center text-[var(--tx)] disabled:opacity-30 hover:bg-[var(--fill)] shadow-xs"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => move(idx, 1)}
                  className="w-7 h-7 rounded-lg bg-[var(--sf)] flex items-center justify-center text-[var(--tx)] disabled:opacity-30 hover:bg-[var(--fill)] shadow-xs"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-[var(--sep)] mt-2">
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              onResetOrder();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-[var(--fill)] text-xs font-semibold text-[var(--mu)] hover:text-[var(--tx)]"
            title="Reset default order"
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
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-[var(--ac)] text-[var(--on)] text-xs font-semibold shadow-md flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Save Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
