import React, { useRef, useEffect } from 'react';
import { AppLooks, AppConfig } from '../types';
import { Star, SlidersHorizontal } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  activeTag: string;
  onSelectTag: (tag: string) => void;
  categories: { tag: string; label: string; count: number; isCategory: boolean }[];
  looks: AppLooks;
  config: AppConfig;
  onOpenReorder?: () => void;
}

export const CategoryBar: React.FC<Props> = ({
  activeTag,
  onSelectTag,
  categories,
  looks,
  config,
  onOpenReorder,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Smoothly center the active category chip inside container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const escapedTag = CSS.escape(activeTag);
      const activeEl = container.querySelector(`[data-tag="${escapedTag}"]`) as HTMLElement | null;

      if (activeEl) {
        const targetLeft =
          activeEl.offsetLeft - (container.clientWidth - activeEl.offsetWidth) / 2;
        container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
    } catch {
      // fallback if CSS.escape fails on special char
      const buttons = container.querySelectorAll('button[data-tag]');
      for (const btn of buttons) {
        if (btn.getAttribute('data-tag') === activeTag) {
          const el = btn as HTMLElement;
          const targetLeft = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
          container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
          break;
        }
      }
    }
  }, [activeTag]);

  // When scrolling mouse wheel / trackpad over the category bar -> switch to next/prev tab!
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 12) return;

    e.preventDefault();
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 200) return; // Prevent skipping tabs too fast
    lastScrollTimeRef.current = now;

    const currentIndex = categories.findIndex((c) => c.tag === activeTag);
    if (currentIndex === -1) return;

    if (delta > 0 && currentIndex < categories.length - 1) {
      haptic.tap();
      onSelectTag(categories[currentIndex + 1].tag);
    } else if (delta < 0 && currentIndex > 0) {
      haptic.tap();
      onSelectTag(categories[currentIndex - 1].tag);
    }
  };

  // Drag to scroll container
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-2 flex items-center gap-2">
      <nav
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x cursor-grab active:cursor-grabbing select-none"
        style={{
          overscrollBehaviorX: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
        aria-label="Filter bookmarks by category"
      >
        {categories.map((item) => {
          const isActive = activeTag === item.tag;

          if (looks.tabs === 'underline') {
            return (
              <button
                key={item.tag}
                type="button"
                data-tag={item.tag}
                onClick={(e) => {
                  if (hasMovedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  haptic.tap();
                  onSelectTag(item.tag);
                }}
                className={`shrink-0 px-3 py-2 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'border-[var(--ac)] text-[var(--tx)]'
                    : 'border-transparent text-[var(--mu)] hover:text-[var(--tx)]'
                }`}
              >
                {item.tag === '★' && <Star className="w-3.5 h-3.5 fill-current" />}
                <span>{item.label}</span>
                {looks.counts === 'show' && item.count > 0 && (
                  <span className="text-[11px] opacity-60 tabular-nums font-normal">
                    {item.count}
                  </span>
                )}
              </button>
            );
          }

          if (looks.tabs === 'minimal') {
            return (
              <button
                key={item.tag}
                type="button"
                data-tag={item.tag}
                onClick={(e) => {
                  if (hasMovedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  haptic.tap();
                  onSelectTag(item.tag);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--fill)] text-[var(--tx)] shadow-xs'
                    : 'text-[var(--mu)] hover:text-[var(--tx)]'
                }`}
              >
                {item.tag === '★' && <Star className="w-3.5 h-3.5 fill-current" />}
                <span>{item.label}</span>
                {looks.counts === 'show' && item.count > 0 && (
                  <span className="text-[11px] opacity-60 tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            );
          }

          // Default 'pills'
          return (
            <button
              key={item.tag}
              type="button"
              data-tag={item.tag}
              onClick={(e) => {
                if (hasMovedRef.current) {
                  e.preventDefault();
                  return;
                }
                haptic.tap();
                onSelectTag(item.tag);
              }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--ac)] text-[var(--on)] shadow-sm'
                  : 'bg-[var(--sf)] text-[var(--tx)] border border-[var(--bd)] hover:bg-[var(--fill)] shadow-xs'
              }`}
            >
              {item.tag === '★' ? (
                <Star className="w-3.5 h-3.5 fill-current" />
              ) : item.isCategory ? (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-[var(--on)]' : 'bg-[var(--ac)]'
                  }`}
                />
              ) : null}
              <span>{item.label}</span>
              {looks.counts === 'show' && item.count > 0 && (
                <span
                  className={`text-[11px] font-bold tabular-nums px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--fill)] text-[var(--mu)]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Reorder Categories button */}
      {onOpenReorder && categories.length > 2 && (
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            onOpenReorder();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--fill)] shrink-0 transition"
          title="Reorder category tabs"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
