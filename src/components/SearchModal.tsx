import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ExternalLink, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Bookmark, WatchlistItem } from '../types';
import { extractHostname } from '../services/storage';
import { haptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  watchlist: WatchlistItem[];
  mode: 'books' | 'watch';
}

export const SearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bookmarks,
  watchlist,
  mode,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const cleanQuery = query.trim().toLowerCase();

  const filteredBookmarks = bookmarks.filter((b) => {
    if (!cleanQuery) return true;
    return (
      b.title.toLowerCase().includes(cleanQuery) ||
      b.url.toLowerCase().includes(cleanQuery) ||
      b.tags.some((t) => t.toLowerCase().includes(cleanQuery))
    );
  });

  const filteredWatchlist = watchlist.filter((w) => {
    if (!cleanQuery) return true;
    return (
      w.title.toLowerCase().includes(cleanQuery) ||
      w.url.toLowerCase().includes(cleanQuery) ||
      w.why.toLowerCase().includes(cleanQuery) ||
      w.benefit.toLowerCase().includes(cleanQuery)
    );
  });

  const results = mode === 'books' ? filteredBookmarks : filteredWatchlist;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        e.preventDefault();
        haptic.tap();
        window.open(results[selectedIndex].url, '_blank', 'noopener,noreferrer');
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[var(--sf)] border border-[var(--bd)] shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-200 text-[var(--tx)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--sep)] bg-[var(--sf)]">
          <Search className="w-5 h-5 text-[var(--mu)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={mode === 'books' ? 'Search bookmarks, categories, links...' : 'Search reading list and notes...'}
            className="w-full bg-transparent text-base sm:text-lg font-medium outline-none placeholder:text-[var(--mu)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--mu)] hover:bg-[var(--fill)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--mu)] bg-[var(--fill)] px-2 py-1 rounded-lg">
            <span>esc</span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="text-center py-12 text-[var(--mu)] text-sm">
              No results matching "{query}"
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isBookmark = 'tags' in item;
              const hostname = extractHostname(item.url);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    haptic.tap();
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--ac)] text-[var(--on)] shadow-sm'
                      : 'hover:bg-[var(--fill)] text-[var(--tx)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{item.title}</span>
                      {isBookmark &&
                        (item as Bookmark).tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[var(--fill)] text-[var(--mu)]'
                            }`}
                          >
                            {tag.startsWith('@') ? tag.slice(1) : tag}
                          </span>
                        ))}
                    </div>
                    <span
                      className={`text-xs truncate block mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-[var(--mu)]'
                      }`}
                    >
                      {hostname}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold opacity-90">
                        <span>Open</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ExternalLink className="w-4 h-4 opacity-70" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-2.5 border-t border-[var(--sep)] bg-[var(--fill)]/50 text-[11px] text-[var(--mu)] flex items-center justify-between">
          <span>
            {results.length} {results.length === 1 ? 'item' : 'items'} found
          </span>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
