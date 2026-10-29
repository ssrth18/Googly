import React, { useState } from 'react';
import { CheckSquare, FolderInput, Trash2, X } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  selectedCount: number;
  totalVisible: number;
  onSelectAll: () => void;
  onMoveCategory: (categoryName: string) => void;
  onDeleteSelected: () => void;
  onCancel: () => void;
  existingCategories: string[];
}

export const BatchBar: React.FC<Props> = ({
  selectedCount,
  totalVisible,
  onSelectAll,
  onMoveCategory,
  onDeleteSelected,
  onCancel,
  existingCategories,
}) => {
  const [showMovePicker, setShowMovePicker] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleMove = (cat: string) => {
    haptic.success();
    onMoveCategory(cat);
    setShowMovePicker(false);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--sf)]/90 backdrop-blur-2xl border border-[var(--bd)] shadow-2xl animate-in slide-in-from-bottom-8 duration-200 text-xs sm:text-sm font-semibold text-[var(--tx)] max-w-[94vw] whitespace-nowrap">
        <span className="text-[var(--mu)] font-medium pr-1">
          {selectedCount} selected
        </span>

        <button
          type="button"
          onClick={() => {
            haptic.tap();
            onSelectAll();
          }}
          className="px-3 py-1.5 rounded-full bg-[var(--fill)] hover:bg-[var(--fill)]/80 transition"
        >
          {selectedCount === totalVisible ? 'Deselect All' : 'Select All'}
        </button>

        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => {
            haptic.tap();
            setShowMovePicker(true);
          }}
          className="px-3 py-1.5 rounded-full bg-[var(--fill)] hover:bg-[var(--fill)]/80 disabled:opacity-40 transition flex items-center gap-1.5"
        >
          <FolderInput className="w-3.5 h-3.5" />
          <span>Move</span>
        </button>

        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => {
            haptic.warning();
            if (confirm(`Delete ${selectedCount} selected bookmark${selectedCount > 1 ? 's' : ''}?`)) {
              onDeleteSelected();
            }
          }}
          className="px-3 py-1.5 rounded-full text-red-500 hover:bg-red-500/10 disabled:opacity-40 transition flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.tap();
            onCancel();
          }}
          className="w-7 h-7 rounded-full bg-[var(--ac)] text-[var(--on)] flex items-center justify-center shadow-xs"
          title="Done"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Move Category Sheet */}
      {showMovePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowMovePicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-5 shadow-2xl text-[var(--tx)] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold mb-2">Move {selectedCount} Bookmarks</h4>
            <p className="text-xs text-[var(--mu)] mb-3">
              Pick an existing category or create a new one.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {existingCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleMove(c)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--fill)] text-xs font-semibold hover:bg-[var(--ac)] hover:text-[var(--on)] transition"
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleMove('')}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold hover:bg-red-500 hover:text-white transition"
              >
                Clear Category
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Or new category name..."
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newCategory.trim()) handleMove(newCategory.trim());
                }}
                className="px-4 py-2 rounded-xl bg-[var(--ac)] text-[var(--on)] font-semibold text-xs"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
