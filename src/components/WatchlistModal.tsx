import React, { useState, useEffect } from 'react';
import { WatchlistItem } from '../types';
import { normalizeUrl, extractHostname } from '../services/storage';
import { X, Trash2, Sparkles, BookOpen } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem | null;
  onSave: (data: Partial<WatchlistItem>) => void;
  onDelete?: (id: string) => void;
}

export const WatchlistModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  onSave,
  onDelete,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [benefit, setBenefit] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setUrl(item.url);
      setTitle(item.title);
      setWhy(item.why);
      setBenefit(item.benefit);
    } else {
      setUrl('');
      setTitle('');
      setWhy('');
      setBenefit('');
    }
    setError('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalized = normalizeUrl(url);
      const finalTitle = title.trim() || extractHostname(normalized);
      onSave({
        url: normalized,
        title: finalTitle,
        why: why.trim(),
        benefit: benefit.trim(),
        done: item?.done || false,
      });
      haptic.success();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Please check link URL.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-6 shadow-2xl text-[var(--tx)] animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--sep)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--ac)]" />
            <h3 className="text-lg font-bold">
              {item ? 'Edit Saved Link' : 'Add to Saved List'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:bg-[var(--fill)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Link URL *
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (!title && e.target.value) {
                  const h = extractHostname(e.target.value);
                  if (h) setTitle(h.charAt(0).toUpperCase() + h.slice(1));
                }
              }}
              placeholder="e.g. ciechanow.ski/mechanical-watch"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none focus:border-[var(--ac)] focus:ring-2 focus:ring-[var(--ac)]/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article, book, or video title"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none focus:border-[var(--ac)] focus:ring-2 focus:ring-[var(--ac)]/20 transition"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ac)] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Why I saved it</span>
            </label>
            <textarea
              rows={2}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="What caught your attention?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none focus:border-[var(--ac)] focus:ring-2 focus:ring-[var(--ac)]/20 resize-none transition"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ac)] mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>How it will help me</span>
            </label>
            <textarea
              rows={2}
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              placeholder="What will you learn or apply from this?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none focus:border-[var(--ac)] focus:ring-2 focus:ring-[var(--ac)]/20 resize-none transition"
            />
          </div>

          {error && <div className="text-xs text-red-500 font-medium">{error}</div>}

          <div className="flex items-center gap-2 pt-2">
            {item && onDelete && (
              <button
                type="button"
                onClick={() => {
                  haptic.warning();
                  if (confirm('Delete this item from Saved?')) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition"
                title="Delete item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[var(--fill)] text-sm font-semibold hover:bg-[var(--fill)]/80 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[var(--ac)] text-[var(--on)] text-sm font-semibold shadow-md hover:brightness-105 active:scale-95 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
