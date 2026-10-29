import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bookmark,
  WatchlistItem,
  AppConfig,
  AppLooks,
} from './types';
import {
  loadLocalData,
  saveBookmarksLocally,
  saveWatchlistLocally,
  saveConfigLocally,
  saveLooksLocally,
  parseHtmlBookmarks,
} from './services/storage';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { haptic } from './utils/haptics';

// Components
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { BookmarkCard } from './components/BookmarkCard';
import { WatchlistRow } from './components/WatchlistRow';
import { SearchModal } from './components/SearchModal';
import { BookmarkModal } from './components/BookmarkModal';
import { WatchlistModal } from './components/WatchlistModal';
import { ContextMenu } from './components/ContextMenu';
import { SettingsSheet } from './components/SettingsSheet';
import { BatchBar } from './components/BatchBar';
import { WallpaperCropModal } from './components/WallpaperCropModal';
import { CategoryReorderModal } from './components/CategoryReorderModal';
import { SyncModal } from './components/SyncModal';
import { AmbientCanvas } from './components/AmbientCanvas';

import { Plus, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Load synchronous local-first state
  const initialData = useMemo(() => loadLocalData(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialData.bookmarks);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialData.watchlist);
  const [config, setConfig] = useState<AppConfig>(initialData.config);
  const [looks, setLooks] = useState<AppLooks>(initialData.looks);

  // Sync state
  const [syncCode, setSyncCode] = useState<string | null>(localStorage.getItem('lp_code'));

  // Active view states
  const [mode, setMode] = useState<'books' | 'watch'>('books');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWallpaperCropOpen, setIsWallpaperCropOpen] = useState(false);
  const [isCategoryReorderOpen, setIsCategoryReorderOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Modal edit states
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingWatchlistItem, setEditingWatchlistItem] = useState<WatchlistItem | null>(null);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    bookmark: Bookmark;
    x: number;
    y: number;
  } | null>(null);

  // Multi-select state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Launch animation ghost state
  const [launchingGhost, setLaunchingGhost] = useState<{
    rect: DOMRect;
    title: string;
    iconUrl?: string | null;
    emoji?: string | null;
    url: string;
  } | null>(null);

  // Live swipe follow offset (pixels)
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2500);
  };

  // Dark mode resolution
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    config.theme === 'dark' || (config.theme === 'auto' && prefersDark);

  // Apply theme variables & root datasets
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.t = isDark ? 'dark' : 'light';
    root.dataset.dark = looks.dark;

    body.dataset.bgfx = looks.bgfx;
    body.dataset.density = looks.density;
    body.dataset.shape = looks.shape;
    body.dataset.ictone = looks.ictone;
    body.dataset.ring = looks.ring;
    body.dataset.motion = looks.motion;

    let bg = looks.bg;
    let sf = looks.surface;
    let ac = looks.accent;

    if (isDark) {
      if (looks.dark === 'black') {
        bg = '#000000';
        sf = '#121412';
      } else {
        bg = '#161916';
        sf = '#212621';
      }
    }

    root.style.setProperty('--bg', bg);
    root.style.setProperty('--sf', sf);
    root.style.setProperty('--ac', ac);
    root.style.setProperty('--tile', `${config.tile}px`);
    root.style.setProperty('--gap', `${config.gap}px`);
    root.style.setProperty('--fs', `${config.fs}px`);
    root.style.setProperty('--ts', `${config.ts / 100}`);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', bg);
  }, [looks, config, isDark]);

  // Persist state changes
  useEffect(() => {
    saveBookmarksLocally(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    saveWatchlistLocally(watchlist);
  }, [watchlist]);

  useEffect(() => {
    saveConfigLocally(config);
  }, [config]);

  useEffect(() => {
    saveLooksLocally(looks);
  }, [looks]);

  // Keyboard shortcut: '/' opens search, 'Escape' closes modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (document.activeElement?.tagName || '').toUpperCase()
      );
      if (e.key === '/' && !isInput && !isSearchOpen && !isSettingsOpen) {
        e.preventDefault();
        haptic.tap();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        if (contextMenu) setContextMenu(null);
        if (isSelecting) setIsSelecting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isSettingsOpen, contextMenu, isSelecting]);

  // Derived category tags
  const existingCategories = useMemo(() => {
    const catSet = new Set<string>();
    bookmarks.forEach((b) => {
      b.tags.forEach((t) => {
        if (t.startsWith('@')) {
          catSet.add(t.slice(1));
        }
      });
    });
    return Array.from(catSet);
  }, [bookmarks]);

  // Categories list for CategoryBar (respecting custom order in config.tord)
  const categoryTabs = useMemo(() => {
    const hasPinned = bookmarks.some((b) => b.pinned);
    const standardKeys = ['all'];
    if (hasPinned) standardKeys.push('★');

    const catKeys = existingCategories.map((c) => '@' + c);
    const allAvailable = [...standardKeys, ...catKeys];

    // Order by config.tord if present
    const order = config.tord || [];
    const orderedKeys = [...new Set([...order, ...allAvailable])].filter((k) =>
      allAvailable.includes(k)
    );

    return orderedKeys.map((key) => {
      if (key === 'all') {
        return { tag: 'all', label: 'All', count: bookmarks.length, isCategory: false };
      }
      if (key === '★') {
        return {
          tag: '★',
          label: 'Pinned',
          count: bookmarks.filter((b) => b.pinned).length,
          isCategory: false,
        };
      }
      const catName = key.slice(1);
      const count = bookmarks.filter((b) => b.tags.includes(key)).length;
      return { tag: key, label: catName, count, isCategory: true };
    });
  }, [bookmarks, existingCategories, config.tord]);

  // ================= SCROLL & SWIPE TO SWITCH TABS =================
  useEffect(() => {
    if (mode !== 'books' || isSelecting) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;
    let lastWheelTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, dialog, button, .no-swipe')) return;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isTracking = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      // Only follow if predominantly horizontal
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        setSwipeOffset(Math.max(-80, Math.min(80, dx * 0.4)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking) return;
      isTracking = false;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      setSwipeOffset(0);

      // Trigger threshold: 45px
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        const keys = categoryTabs.map((t) => t.tag);
        const currentIndex = keys.indexOf(activeTag);
        if (currentIndex === -1) return;

        if (dx < 0 && currentIndex < keys.length - 1) {
          // Swiped left -> next category tab
          haptic.tap();
          setActiveTag(keys[currentIndex + 1]);
        } else if (dx > 0 && currentIndex > 0) {
          // Swiped right -> previous category tab
          haptic.tap();
          setActiveTag(keys[currentIndex - 1]);
        }
      }
    };

    // Horizontal wheel scroll (Mac trackpad two-finger swipe or Shift+Wheel or horizontal mouse tilt)
    const handleGlobalWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('dialog, .no-swipe')) return;

      const delta = e.deltaX !== 0 ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(delta) > 28) {
        const now = Date.now();
        if (now - lastWheelTime < 240) return; // Debounce so single swipe steps 1 tab
        lastWheelTime = now;

        const keys = categoryTabs.map((t) => t.tag);
        const currentIndex = keys.indexOf(activeTag);
        if (currentIndex === -1) return;

        if (delta > 0 && currentIndex < keys.length - 1) {
          haptic.tap();
          setActiveTag(keys[currentIndex + 1]);
        } else if (delta < 0 && currentIndex > 0) {
          haptic.tap();
          setActiveTag(keys[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', () => {
      isTracking = false;
      setSwipeOffset(0);
    }, { passive: true });
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [mode, isSelecting, categoryTabs, activeTag]);

  // Filtered bookmarks for active tab
  const visibleBookmarks = useMemo(() => {
    let list = bookmarks.filter((b) => {
      if (activeTag === 'all') return true;
      if (activeTag === '★') return b.pinned;
      return b.tags.includes(activeTag);
    });

    switch (config.sort) {
      case 'recent':
        return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
      case 'popular':
        return [...list].sort((a, b) => (b.open_count || 0) - (a.open_count || 0));
      case 'az':
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return [...list].sort((a, b) => (a.position || 0) - (b.position || 0));
    }
  }, [bookmarks, activeTag, config.sort]);

  // Categorized groups for Home Screen
  const groupedSections = useMemo(() => {
    if (activeTag !== 'all' || !config.group || existingCategories.length === 0) {
      return null;
    }

    const pinned = visibleBookmarks.filter((b) => b.pinned);
    const unpinned = visibleBookmarks.filter((b) => !b.pinned);

    const groups: { name: string; items: Bookmark[] }[] = [];

    existingCategories.forEach((cat) => {
      const catTag = '@' + cat;
      const items = unpinned.filter((b) => b.tags.includes(catTag));
      if (items.length > 0) {
        groups.push({ name: cat, items });
      }
    });

    const otherItems = unpinned.filter((b) => !b.tags.some((t) => t.startsWith('@')));
    if (otherItems.length > 0) {
      groups.push({ name: 'Other', items: otherItems });
    }

    return { pinned, groups };
  }, [visibleBookmarks, activeTag, config.group, existingCategories]);

  // Selection toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === visibleBookmarks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleBookmarks.map((b) => b.id)));
    }
  };

  const handleBatchMoveCategory = (categoryName: string) => {
    const tag = categoryName ? '@' + categoryName : null;
    setBookmarks((prev) =>
      prev.map((b) => {
        if (!selectedIds.has(b.id)) return b;
        const filteredTags = b.tags.filter((t) => !t.startsWith('@'));
        if (tag) filteredTags.push(tag);
        return { ...b, tags: filteredTags, updated_at: new Date().toISOString() };
      })
    );
    showToast(
      categoryName
        ? `Moved ${selectedIds.size} bookmarks to ${categoryName}`
        : `Removed category from ${selectedIds.size} bookmarks`
    );
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    setBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    showToast(`Deleted ${selectedIds.size} bookmarks`);
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  // Launch animation trigger
  const handleLaunchBookmark = (b: Bookmark, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setLaunchingGhost({
      rect,
      title: b.title,
      iconUrl: b.icon_url,
      emoji: b.emoji,
      url: b.url,
    });

    setBookmarks((prev) =>
      prev.map((item) =>
        item.id === b.id
          ? {
              ...item,
              open_count: (item.open_count || 0) + 1,
              last_opened_at: new Date().toISOString(),
            }
          : item
      )
    );

    setTimeout(() => {
      if (config.open === 'same') {
        window.location.href = b.url;
      } else {
        window.open(b.url, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => setLaunchingGhost(null), 300);
    }, 220);
  };

  // Import bookmarks handler
  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      let importedBm: Partial<Bookmark>[] = [];
      let importedWl: Partial<WatchlistItem>[] = [];

      if (file.name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          importedBm = json;
        } else if (json.bookmarks) {
          importedBm = json.bookmarks;
          if (json.watchlist) importedWl = json.watchlist;
          if (json.looks) setLooks((prev) => ({ ...prev, ...json.looks }));
          if (json.config) setConfig((prev) => ({ ...prev, ...json.config }));
        }
      } else {
        const parsed = parseHtmlBookmarks(text);
        importedBm = parsed.bookmarks;
      }

      if (importedBm.length > 0) {
        const newBookmarks: Bookmark[] = importedBm.map((b, idx) => ({
          id: b.id || `bm-imp-${Date.now()}-${idx}`,
          url: b.url || 'https://example.com',
          title: b.title || 'Bookmark',
          tags: b.tags || [],
          pinned: !!b.pinned,
          icon_url: b.icon_url || null,
          emoji: b.emoji || null,
          position: bookmarks.length + idx,
          open_count: b.open_count || 0,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        setBookmarks((prev) => [...prev, ...newBookmarks]);
      }

      if (importedWl.length > 0) {
        const newWatchlist: WatchlistItem[] = importedWl.map((w, idx) => ({
          id: w.id || `wl-imp-${Date.now()}-${idx}`,
          url: w.url || 'https://example.com',
          title: w.title || 'Saved Item',
          why: w.why || '',
          benefit: w.benefit || '',
          done: !!w.done,
          created_at: w.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setWatchlist((prev) => [...prev, ...newWatchlist]);
      }

      showToast(`Imported ${importedBm.length} bookmarks successfully!`);
      setIsSettingsOpen(false);
    } catch (err: any) {
      showToast(`Import failed: ${err.message || 'Invalid file format'}`);
    }
  };

  // Add / Edit bookmark
  const handleSaveBookmark = (data: Partial<Bookmark>) => {
    if (editingBookmark) {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === editingBookmark.id
            ? { ...b, ...data, updated_at: new Date().toISOString() }
            : b
        )
      );
      showToast('Bookmark updated');
    } else {
      const newBm: Bookmark = {
        id: `bm-${Date.now()}`,
        url: data.url || 'https://example.com',
        title: data.title || 'New Bookmark',
        tags: data.tags || [],
        pinned: !!data.pinned,
        icon_url: data.icon_url || null,
        emoji: data.emoji || null,
        position: bookmarks.length,
        open_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBookmarks((prev) => [newBm, ...prev]);
      showToast('Bookmark added');
    }
    setEditingBookmark(null);
  };

  // Add / Edit watchlist item
  const handleSaveWatchlistItem = (data: Partial<WatchlistItem>) => {
    if (editingWatchlistItem) {
      setWatchlist((prev) =>
        prev.map((w) =>
          w.id === editingWatchlistItem.id
            ? { ...w, ...data, updated_at: new Date().toISOString() }
            : w
        )
      );
      showToast('Saved notes updated');
    } else {
      const newWl: WatchlistItem = {
        id: `wl-${Date.now()}`,
        url: data.url || 'https://example.com',
        title: data.title || 'Saved Link',
        why: data.why || '',
        benefit: data.benefit || '',
        done: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setWatchlist((prev) => [newWl, ...prev]);
      showToast('Saved to reading list');
    }
    setEditingWatchlistItem(null);
  };

  const handleToggleWatchlistDone = (id: string) => {
    setWatchlist((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, done: !w.done, updated_at: new Date().toISOString() }
          : w
      )
    );
  };

  const activeWatchlistCount = watchlist.filter((w) => !w.done).length;

  return (
    <div className="relative min-h-screen flex flex-col font-sans transition-colors duration-300">
      {/* Background Canvas Overlays */}
      <AmbientCanvas looks={looks} isDark={isDark} />

      {/* Main App Container */}
      <div
        className={`w-full mx-auto flex-1 flex flex-col ${
          looks.width === 'narrow'
            ? 'max-w-2xl'
            : looks.width === 'wide'
            ? 'max-w-7xl'
            : 'max-w-5xl'
        }`}
      >
        {/* Header Bar */}
        <Header
          mode={mode}
          onSetMode={(m) => {
            setMode(m);
            setIsSelecting(false);
          }}
          watchlistCount={activeWatchlistCount}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isOnline={isOnline}
          looks={looks}
          config={config}
        />

        {/* Category Filter Pills (Bookmarks mode) */}
        {mode === 'books' && (
          <CategoryBar
            activeTag={activeTag}
            onSelectTag={(tag) => {
              setActiveTag(tag);
              setIsSelecting(false);
            }}
            categories={categoryTabs}
            looks={looks}
            config={config}
            onOpenReorder={() => setIsCategoryReorderOpen(true)}
          />
        )}

        {/* Content Body - Clean Native Launchpad */}
        <main
          className="flex-1 px-4 py-4 pb-28 transition-transform duration-200 ease-out"
          style={{
            transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
          }}
        >
          {mode === 'watch' ? (
            /* ================= SAVED / WATCHLIST VIEW ================= */
            <div className="max-w-2xl mx-auto space-y-3">
              {watchlist.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="w-14 h-14 rounded-3xl bg-[var(--ac)]/15 text-[var(--ac)] mx-auto flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--tx)]">Your Reading List is Empty</h3>
                  <p className="text-xs text-[var(--mu)] max-w-sm mx-auto mt-1 mb-5">
                    Save articles, essays, and resources with mindful reflection prompts on why you saved them and how they will help you.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.pop();
                      setEditingWatchlistItem(null);
                      setIsWatchlistModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ac)] text-[var(--on)] font-semibold text-xs shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Link</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
                      Saved Links ({watchlist.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.pop();
                        setEditingWatchlistItem(null);
                        setIsWatchlistModalOpen(true);
                      }}
                      className="text-xs font-semibold text-[var(--ac)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add item</span>
                    </button>
                  </div>

                  {watchlist.map((item) => (
                    <WatchlistRow
                      key={item.id}
                      item={item}
                      looks={looks}
                      onToggleDone={handleToggleWatchlistDone}
                      onEdit={(it) => {
                        setEditingWatchlistItem(it);
                        setIsWatchlistModalOpen(true);
                      }}
                      onDelete={(id) => {
                        setWatchlist((prev) => prev.filter((w) => w.id !== id));
                        showToast('Removed from saved');
                      }}
                      onCopy={(u) => {
                        navigator.clipboard.writeText(u);
                        showToast('Link copied');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ================= BOOKMARKS VIEW ================= */
            <div>
              {visibleBookmarks.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="w-14 h-14 rounded-3xl bg-[var(--ac)]/15 text-[var(--ac)] mx-auto flex items-center justify-center mb-4">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--tx)]">No Bookmarks Found</h3>
                  <p className="text-xs text-[var(--mu)] max-w-sm mx-auto mt-1 mb-5">
                    {activeTag !== 'all'
                      ? `There are no bookmarks in the "${activeTag.replace(/^@/, '')}" category yet.`
                      : 'Your launchpad is ready. Add your favorite tools, docs, and sites.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.pop();
                      setEditingBookmark(null);
                      setIsBookmarkModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ac)] text-[var(--on)] font-semibold text-xs shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Bookmark</span>
                  </button>
                </div>
              ) : groupedSections ? (
                /* Grouped by Category View */
                <div className="space-y-6">
                  {/* Pinned Section */}
                  {groupedSections.pinned.length > 0 && (
                    <div>
                      {looks.heads === 'show' && (
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-3 flex items-center gap-1.5">
                          <span>★ Pinned</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--fill)] text-[var(--mu)] font-bold">
                            {groupedSections.pinned.length}
                          </span>
                        </h2>
                      )}
                      <div
                        className={
                          config.view === 'list'
                            ? 'space-y-2'
                            : 'grid gap-3 sm:gap-4'
                        }
                        style={
                          config.view === 'grid'
                            ? {
                                gridTemplateColumns:
                                  config.cols > 0
                                    ? `repeat(${config.cols}, minmax(0, 1fr))`
                                    : `repeat(auto-fill, minmax(${config.tile + 20}px, 1fr))`,
                              }
                            : undefined
                        }
                      >
                        {groupedSections.pinned.map((b, idx) => (
                          <BookmarkCard
                            key={b.id}
                            bookmark={b}
                            index={idx}
                            looks={looks}
                            config={config}
                            isSelecting={isSelecting}
                            isSelected={selectedIds.has(b.id)}
                            onSelect={handleToggleSelect}
                            onOpenMenu={(bm, x, y) => setContextMenu({ bookmark: bm, x, y })}
                            onLaunch={handleLaunchBookmark}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Groups */}
                  {groupedSections.groups.map((group) => (
                    <div key={group.name}>
                      {looks.heads === 'show' && (
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-3 flex items-center gap-1.5">
                          <span>{group.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--fill)] text-[var(--mu)] font-bold">
                            {group.items.length}
                          </span>
                        </h2>
                      )}
                      <div
                        className={
                          config.view === 'list'
                            ? 'space-y-2'
                            : 'grid gap-3 sm:gap-4'
                        }
                        style={
                          config.view === 'grid'
                            ? {
                                gridTemplateColumns:
                                  config.cols > 0
                                    ? `repeat(${config.cols}, minmax(0, 1fr))`
                                    : `repeat(auto-fill, minmax(${config.tile + 20}px, 1fr))`,
                              }
                            : undefined
                        }
                      >
                        {group.items.map((b, idx) => (
                          <BookmarkCard
                            key={b.id}
                            bookmark={b}
                            index={idx}
                            looks={looks}
                            config={config}
                            isSelecting={isSelecting}
                            isSelected={selectedIds.has(b.id)}
                            onSelect={handleToggleSelect}
                            onOpenMenu={(bm, x, y) => setContextMenu({ bookmark: bm, x, y })}
                            onLaunch={handleLaunchBookmark}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Flat Grid or List View */
                <div
                  className={
                    config.view === 'list'
                      ? 'space-y-2 max-w-2xl mx-auto'
                      : 'grid gap-3 sm:gap-4'
                  }
                  style={
                    config.view === 'grid'
                      ? {
                          gridTemplateColumns:
                            config.cols > 0
                              ? `repeat(${config.cols}, minmax(0, 1fr))`
                              : `repeat(auto-fill, minmax(${config.tile + 20}px, 1fr))`,
                        }
                      : undefined
                  }
                >
                  {visibleBookmarks.map((b, idx) => (
                    <BookmarkCard
                      key={b.id}
                      bookmark={b}
                      index={idx}
                      looks={looks}
                      config={config}
                      isSelecting={isSelecting}
                      isSelected={selectedIds.has(b.id)}
                      onSelect={handleToggleSelect}
                      onOpenMenu={(bm, x, y) => setContextMenu({ bookmark: bm, x, y })}
                      onLaunch={handleLaunchBookmark}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button (FAB) */}
      {!isSelecting && (
        <button
          type="button"
          onClick={() => {
            haptic.pop();
            if (mode === 'watch') {
              setEditingWatchlistItem(null);
              setIsWatchlistModalOpen(true);
            } else {
              setEditingBookmark(null);
              setIsBookmarkModalOpen(true);
            }
          }}
          className={`fixed z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ac)] to-[color-mix(in_srgb,var(--ac)_75%,black)] text-[var(--on)] flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer border border-white/20 ${
            looks.fab === 'left'
              ? 'left-6 bottom-6'
              : looks.fab === 'center'
              ? 'left-1/2 -translate-x-1/2 bottom-6'
              : 'right-6 bottom-6'
          }`}
          title={mode === 'watch' ? 'Add to Saved' : 'Add Bookmark'}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Multi-Selection Batch Toolbar */}
      {isSelecting && (
        <BatchBar
          selectedCount={selectedIds.size}
          totalVisible={visibleBookmarks.length}
          onSelectAll={handleSelectAll}
          onMoveCategory={handleBatchMoveCategory}
          onDeleteSelected={handleBatchDelete}
          onCancel={() => {
            setIsSelecting(false);
            setSelectedIds(new Set());
          }}
          existingCategories={existingCategories}
        />
      )}

      {/* Launch Zoom Ghost Animation */}
      {launchingGhost && (
        <div
          className="fixed z-50 pointer-events-none rounded-3xl bg-[var(--ac)] shadow-2xl flex flex-col items-center justify-center text-white transition-all duration-300 ease-out"
          style={{
            left: `${launchingGhost.rect.left}px`,
            top: `${launchingGhost.rect.top}px`,
            width: `${launchingGhost.rect.width}px`,
            height: `${launchingGhost.rect.height}px`,
            transform: 'scale(2.5)',
            opacity: 0,
          }}
        >
          <span className="font-bold text-sm drop-shadow">{launchingGhost.title}</span>
        </div>
      )}

      {/* Context Menu Modal */}
      {contextMenu && (
        <ContextMenu
          bookmark={contextMenu.bookmark}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpen={() => {
            if (config.open === 'same') {
              window.location.href = contextMenu.bookmark.url;
            } else {
              window.open(contextMenu.bookmark.url, '_blank', 'noopener,noreferrer');
            }
          }}
          onTogglePin={() => {
            setBookmarks((prev) =>
              prev.map((b) =>
                b.id === contextMenu.bookmark.id ? { ...b, pinned: !b.pinned } : b
              )
            );
            showToast(contextMenu.bookmark.pinned ? 'Unpinned' : 'Pinned to top');
          }}
          onCopyLink={() => {
            navigator.clipboard.writeText(contextMenu.bookmark.url);
            showToast('Link copied to clipboard');
          }}
          onEdit={() => {
            setEditingBookmark(contextMenu.bookmark);
            setIsBookmarkModalOpen(true);
          }}
          onSelect={() => {
            setIsSelecting(true);
            setSelectedIds(new Set([contextMenu.bookmark.id]));
          }}
          onDelete={() => {
            setBookmarks((prev) => prev.filter((b) => b.id !== contextMenu.bookmark.id));
            showToast('Bookmark deleted');
          }}
        />
      )}

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => {
          setIsBookmarkModalOpen(false);
          setEditingBookmark(null);
        }}
        bookmark={editingBookmark}
        onSave={handleSaveBookmark}
        onDelete={(id) => {
          setBookmarks((prev) => prev.filter((b) => b.id !== id));
          showToast('Bookmark deleted');
        }}
        existingCategories={existingCategories}
      />

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={() => {
          setIsWatchlistModalOpen(false);
          setEditingWatchlistItem(null);
        }}
        item={editingWatchlistItem}
        onSave={handleSaveWatchlistItem}
        onDelete={(id) => {
          setWatchlist((prev) => prev.filter((w) => w.id !== id));
          showToast('Saved item removed');
        }}
      />

      {/* Spotlight Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bookmarks={bookmarks}
        watchlist={watchlist}
        mode={mode}
      />

      {/* Settings Bottom Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        looks={looks}
        config={config}
        onUpdateLooks={(updated) => setLooks((prev) => ({ ...prev, ...updated }))}
        onUpdateConfig={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
        onResetAppearance={() => {
          setLooks(initialData.looks);
          setConfig((prev) => ({ ...prev, theme: 'auto', view: 'grid', cols: 0, tile: 60 }));
          showToast('Appearance reset to defaults');
        }}
        bookmarks={bookmarks}
        watchlist={watchlist}
        onImportBookmarks={handleImportFile}
        onOpenWallpaperCrop={() => {
          setIsSettingsOpen(false);
          setIsWallpaperCropOpen(true);
        }}
        onOpenSync={() => {
          setIsSettingsOpen(false);
          setIsSyncModalOpen(true);
        }}
        onOpenReorder={() => {
          setIsSettingsOpen(false);
          setIsCategoryReorderOpen(true);
        }}
      />

      {/* Wallpaper Photo Crop Tool */}
      <WallpaperCropModal
        isOpen={isWallpaperCropOpen}
        onClose={() => setIsWallpaperCropOpen(false)}
        onApply={(dataUrl) => {
          localStorage.setItem('lp_wall', dataUrl);
          document.documentElement.style.setProperty('--wall', `url("${dataUrl}")`);
          setLooks((prev) => ({ ...prev, bgfx: 'photo' }));
          showToast('Photo wallpaper applied');
        }}
      />

      {/* Category Reorder Modal */}
      <CategoryReorderModal
        isOpen={isCategoryReorderOpen}
        onClose={() => setIsCategoryReorderOpen(false)}
        categories={existingCategories.map((c) => '@' + c)}
        currentOrder={config.tord || []}
        onSaveOrder={(newOrder) => {
          setConfig((prev) => ({ ...prev, tord: newOrder }));
          showToast('Category order saved');
        }}
        onResetOrder={() => {
          setConfig((prev) => {
            const next = { ...prev };
            delete next.tord;
            return next;
          });
          showToast('Order reset to default');
        }}
      />

      {/* Cloud Sync & Database Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncCode={syncCode}
        onEnableSync={(code) => {
          setSyncCode(code);
          localStorage.setItem('lp_code', code);
          showToast('Sync enabled with code');
        }}
        onTurnOffSync={() => {
          setSyncCode(null);
          localStorage.removeItem('lp_code');
          showToast('Sync disabled on this device');
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md text-white text-xs sm:text-sm font-semibold shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
