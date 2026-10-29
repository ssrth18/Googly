import React, { useRef } from 'react';
import { Search, Settings, WifiOff, Sparkles } from 'lucide-react';
import { AppLooks, AppConfig } from '../types';
import { haptic } from '../utils/haptics';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  mode: 'books' | 'watch';
  onSetMode: (m: 'books' | 'watch') => void;
  watchlistCount: number;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  isOnline: boolean;
  looks: AppLooks;
  config: AppConfig;
}

export const Header: React.FC<Props> = ({
  mode,
  onSetMode,
  watchlistCount,
  onOpenSearch,
  onOpenSettings,
  isOnline,
  looks,
  config,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full transition-all duration-300">
      <div
        className={`mx-auto max-w-5xl px-4 pt-3 pb-2.5 flex items-center justify-between gap-3 ${
          looks.hdr === 'blur'
            ? 'backdrop-blur-xl bg-[var(--bg)]/85 border-b border-[var(--sep)] shadow-[0_1px_12px_rgba(0,0,0,0.03)]'
            : looks.hdr === 'solid'
            ? 'bg-[var(--sf)] border-b border-[var(--bd)] shadow-sm'
            : 'bg-transparent'
        }`}
      >
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--ac)] to-[color-mix(in_srgb,var(--ac)_65%,black)] flex items-center justify-center text-[var(--on)] shadow-md">
            <svg className="w-5 h-5 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:inline text-[var(--tx)]">
            Little Space
          </span>
        </div>

        {/* Center Pill Segmented Switcher */}
        <div className="relative flex items-center p-1 rounded-2xl bg-[var(--sf)] border border-[var(--bd)] shadow-xs">
          {/* Animated sliding background pill */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-[var(--ac)] shadow-sm transition-all duration-300 ease-spring ${
              mode === 'watch' ? 'left-[calc(50%+2px)]' : 'left-1'
            }`}
          />

          <button
            type="button"
            onClick={() => {
              if (mode !== 'books') {
                haptic.pop();
                onSetMode('books');
              }
            }}
            className={`relative z-10 px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer ${
              mode === 'books' ? 'text-[var(--on)]' : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Bookmarks
          </button>

          <button
            type="button"
            onClick={() => {
              if (mode !== 'watch') {
                haptic.pop();
                onSetMode('watch');
              }
            }}
            className={`relative z-10 px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'watch' ? 'text-[var(--on)]' : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            <span>Saved</span>
            {watchlistCount > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  mode === 'watch'
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--ac)] text-[var(--on)]'
                }`}
              >
                {watchlistCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Actions: Install PWA + Search + Settings */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          {!isOnline && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold"
              title="Offline — using cached data"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Offline</span>
            </div>
          )}

          {/* Quick Search trigger */}
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              onOpenSearch();
            }}
            className="w-9 h-9 rounded-xl bg-[var(--sf)] border border-[var(--bd)] flex items-center justify-center text-[var(--tx)] hover:bg-[var(--fill)] transition-transform active:scale-90 cursor-pointer shadow-xs"
            aria-label="Search bookmarks"
            title="Search (Press /)"
          >
            <Search className="w-4 h-4 text-[var(--mu)]" />
          </button>

          {/* Settings trigger */}
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              onOpenSettings();
            }}
            className="w-9 h-9 rounded-xl bg-[var(--sf)] border border-[var(--bd)] flex items-center justify-center text-[var(--tx)] hover:bg-[var(--fill)] transition-transform active:scale-90 cursor-pointer shadow-xs"
            aria-label="Settings"
            title="Appearance and Preferences"
          >
            <Settings className="w-4 h-4 text-[var(--tx)]" />
          </button>
        </div>
      </div>
    </header>
  );
};
