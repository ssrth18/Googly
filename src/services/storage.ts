import { Bookmark, WatchlistItem, AppConfig, AppLooks } from '../types';
import { DEFAULT_BOOKMARKS, DEFAULT_WATCHLIST, DEFAULT_CONFIG, DEFAULT_LOOKS } from '../data/defaults';

const LS_BOOKMARKS = 'lp_bookmarks_v2';
const LS_WATCHLIST = 'lp_watchlist_v2';
const LS_CONFIG = 'lp_config_v2';
const LS_LOOKS = 'little_space_looks';
const LS_WALL = 'lp_wall';
const LS_WALL_SRC = 'lp_wall_src';

export interface StorageData {
  bookmarks: Bookmark[];
  watchlist: WatchlistItem[];
  config: AppConfig;
  looks: AppLooks;
}

export function loadLocalData(): StorageData {
  let bookmarks = DEFAULT_BOOKMARKS;
  let watchlist = DEFAULT_WATCHLIST;
  let config = DEFAULT_CONFIG;
  let looks = DEFAULT_LOOKS;

  try {
    const rawBm = localStorage.getItem(LS_BOOKMARKS);
    if (rawBm) {
      const parsed = JSON.parse(rawBm);
      if (Array.isArray(parsed) && parsed.length > 0) {
        bookmarks = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse bookmarks from storage', e);
  }

  try {
    const rawWl = localStorage.getItem(LS_WATCHLIST);
    if (rawWl) {
      const parsed = JSON.parse(rawWl);
      if (Array.isArray(parsed)) {
        watchlist = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse watchlist from storage', e);
  }

  try {
    const rawCfg = localStorage.getItem(LS_CONFIG);
    if (rawCfg) {
      const parsed = JSON.parse(rawCfg);
      config = { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse config from storage', e);
  }

  try {
    const rawLooks = localStorage.getItem(LS_LOOKS);
    if (rawLooks) {
      const parsed = JSON.parse(rawLooks);
      looks = { ...DEFAULT_LOOKS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse looks from storage', e);
  }

  return { bookmarks, watchlist, config, looks };
}

export function saveBookmarksLocally(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(LS_BOOKMARKS, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Failed to save bookmarks locally', e);
  }
}

export function saveWatchlistLocally(watchlist: WatchlistItem[]) {
  try {
    localStorage.setItem(LS_WATCHLIST, JSON.stringify(watchlist));
  } catch (e) {
    console.error('Failed to save watchlist locally', e);
  }
}

export function saveConfigLocally(config: AppConfig) {
  try {
    localStorage.setItem(LS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config locally', e);
  }
}

export function saveLooksLocally(looks: AppLooks) {
  try {
    localStorage.setItem(LS_LOOKS, JSON.stringify(looks));
  } catch (e) {
    console.error('Failed to save looks locally', e);
  }
}

export function exportBackup(bookmarks: Bookmark[], watchlist: WatchlistItem[], config: AppConfig, looks: AppLooks) {
  const data = {
    app: 'little-space-native',
    version: 3,
    exported_at: new Date().toISOString(),
    bookmarks,
    watchlist,
    config,
    looks,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `little-space-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function normalizeUrl(url: string): string {
  let v = url.trim();
  if (v && !/^[a-z][a-z0-9+.-]*:/i.test(v)) {
    v = 'https://' + v;
  }
  const parsed = new URL(v);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error('Only http and https links are supported.');
  }
  return parsed.href;
}

export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function parseHtmlBookmarks(html: string): { bookmarks: Partial<Bookmark>[]; categories: string[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a[href^="http"]');
  const seen = new Set<string>();
  const parsedBookmarks: Partial<Bookmark>[] = [];
  const categoriesSet = new Set<string>();

  links.forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || seen.has(href)) return;
    seen.add(href);

    let category = '';
    const dlParent = a.closest('dl');
    if (dlParent && dlParent.previousElementSibling) {
      const header = dlParent.previousElementSibling;
      if (header.tagName === 'H3' && header.textContent) {
        category = header.textContent.trim().slice(0, 30);
      }
    }

    const title = a.textContent?.trim() || extractHostname(href);
    const tags: string[] = [];
    if (category) {
      tags.push('@' + category);
      categoriesSet.add(category);
    }

    const icon = a.getAttribute('icon') || null;

    parsedBookmarks.push({
      url: href,
      title: title.slice(0, 100),
      tags,
      pinned: false,
      icon_url: icon && icon.startsWith('data:') ? icon : null,
      open_count: 0,
      position: parsedBookmarks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return { bookmarks: parsedBookmarks, categories: Array.from(categoriesSet) };
}
