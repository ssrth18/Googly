import React, { useState } from 'react';
import {
  AppLooks,
  AppConfig,
  ThemePreset,
  WallpaperStyle,
  AmbientEffect,
  IconShape,
  IconTone,
  IconRing,
  MotionStyle,
  TouchReaction,
} from '../types';
import { THEME_PRESETS, PRESET_NAMES } from '../utils/colors';
import { exportBackup } from '../services/storage';
import { Bookmark, WatchlistItem } from '../types';
import {
  X,
  Palette,
  LayoutGrid,
  Sparkles,
  Type,
  Activity,
  HardDrive,
  Dices,
  RotateCcw,
  Upload,
  Download,
  Smartphone,
  Check,
} from 'lucide-react';
import { haptic } from '../utils/haptics';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  looks: AppLooks;
  config: AppConfig;
  onUpdateLooks: (newLooks: Partial<AppLooks>) => void;
  onUpdateConfig: (newConfig: Partial<AppConfig>) => void;
  onResetAppearance: () => void;
  bookmarks: Bookmark[];
  watchlist: WatchlistItem[];
  onImportBookmarks: (file: File) => void;
  onOpenWallpaperCrop?: () => void;
  onOpenSync?: () => void;
  onOpenReorder?: () => void;
}

export const SettingsSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  looks,
  config,
  onUpdateLooks,
  onUpdateConfig,
  onResetAppearance,
  bookmarks,
  watchlist,
  onImportBookmarks,
  onOpenWallpaperCrop,
  onOpenSync,
  onOpenReorder,
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'layout' | 'icons' | 'text' | 'motion' | 'data'>('colors');
  const [undoHistory, setUndoHistory] = useState<AppLooks[]>([]);

  if (!isOpen) return null;

  const handleShuffle = () => {
    haptic.pop();
    setUndoHistory((prev) => [looks, ...prev.slice(0, 5)]);

    const presets: ThemePreset[] = ['cozy', 'rose', 'ocean', 'mono', 'sunset', 'berry', 'mint', 'cyber'];
    const chosenPreset = presets[Math.floor(Math.random() * presets.length)];
    const [accent, bg, surface] = THEME_PRESETS[chosenPreset];

    const motions: MotionStyle[] = ['alive', 'float', 'breathe', 'jelly', 'drift', 'bubbly', 'glow', 'pulse'];
    const chosenMotion = motions[Math.floor(Math.random() * motions.length)];

    const rings: IconRing[] = ['soft', 'accent', 'double', 'glow', 'neon', 'spin', 'aurora', 'rainbow', 'gold', 'silver', 'halo'];
    const chosenRing = rings[Math.floor(Math.random() * rings.length)];

    const wallpapers: WallpaperStyle[] = ['aurora', 'glow', 'mesh', 'sunset', 'midnight', 'oceanbg', 'forestbg', 'candy', 'shaderwaves', 'sc-mountains', 'sc-lake', 'sc-aurora'];
    const chosenWallpaper = wallpapers[Math.floor(Math.random() * wallpapers.length)];

    const shapes: IconShape[] = ['rounded', 'circle', 'squircle', 'square'];
    const chosenShape = shapes[Math.floor(Math.random() * shapes.length)];

    const ambients: AmbientEffect[] = ['off', 'aurora', 'fireflies', 'orbs', 'stars', 'bubbles', 'net'];
    const chosenAmbient = ambients[Math.floor(Math.random() * ambients.length)];

    onUpdateLooks({
      preset: chosenPreset,
      accent,
      bg,
      surface,
      motion: chosenMotion,
      ring: chosenRing,
      bgfx: chosenWallpaper,
      shape: chosenShape,
      amb: chosenAmbient,
      level: Math.floor(Math.random() * 30) + 50,
    });
  };

  const handleUndoShuffle = () => {
    if (undoHistory.length > 0) {
      haptic.tap();
      const previous = undoHistory[0];
      setUndoHistory((prev) => prev.slice(1));
      onUpdateLooks(previous);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] rounded-t-[32px] sm:rounded-[32px] sm:mb-6 bg-[var(--sf)] border border-[var(--bd)] shadow-2xl flex flex-col text-[var(--tx)] animate-in slide-in-from-bottom-12 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Grab Handle & Header */}
        <div className="pt-3 pb-2 px-6 border-b border-[var(--sep)] shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-[var(--fill)] mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">Settings</h3>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-[var(--ac)] text-[var(--on)] text-xs font-semibold shadow-xs hover:brightness-105 active:scale-95 transition"
            >
              Done
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-3 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'layout', label: 'Layout', icon: LayoutGrid },
              { id: 'icons', label: 'Icons', icon: Sparkles },
              { id: 'text', label: 'Text', icon: Type },
              { id: 'motion', label: 'Motion', icon: Activity },
              { id: 'data', label: 'Data & App', icon: HardDrive },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    haptic.tap();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-[var(--ac)] text-[var(--on)] shadow-xs'
                      : 'text-[var(--mu)] hover:bg-[var(--fill)] hover:text-[var(--tx)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: COLORS */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              {/* Preset Palettes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-3">
                  Color Theme Presets
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((presetKey) => {
                    if (presetKey === 'custom') return null;
                    const isSelected = looks.preset === presetKey;
                    const [acc, bg] = THEME_PRESETS[presetKey];
                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          const [accent, bg, surface] = THEME_PRESETS[presetKey];
                          onUpdateLooks({ preset: presetKey, accent, bg, surface });
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--ac)] ring-2 ring-[var(--ac)]/20 bg-[var(--fill)]'
                            : 'border-[var(--bd)] hover:bg-[var(--fill)]/60'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center border border-black/10 transition-transform active:scale-95"
                          style={{
                            backgroundColor: acc,
                            boxShadow: isSelected ? `0 0 0 2.5px var(--sf), 0 0 0 4.5px ${acc}` : undefined,
                          }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-semibold truncate max-w-full text-[var(--tx)]">
                          {PRESET_NAMES[presetKey]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Mode & Dark Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                    Theme Mode
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[var(--sf)] rounded-xl border border-[var(--bd)]">
                    {(['auto', 'light', 'dark'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          onUpdateConfig({ theme: m });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                          config.theme === m
                            ? 'bg-[var(--ac)] text-[var(--on)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                    Dark Appearance
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[var(--sf)] rounded-xl border border-[var(--bd)]">
                    {(['soft', 'black'] as const).map((ds) => (
                      <button
                        key={ds}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          onUpdateLooks({ dark: ds });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                          looks.dark === ds
                            ? 'bg-[var(--ac)] text-[var(--on)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {ds === 'soft' ? 'Warm Graphite' : 'True OLED Black'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Colors */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-3">
                  Custom Brand Colors
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col items-center gap-1 text-xs font-semibold text-[var(--mu)] cursor-pointer">
                    <input
                      type="color"
                      value={looks.accent}
                      onChange={(e) =>
                        onUpdateLooks({ preset: 'custom', accent: e.target.value })
                      }
                      className="w-full h-10 rounded-xl cursor-pointer bg-[var(--sf)] border border-[var(--bd)] p-1"
                    />
                    <span>Accent</span>
                  </label>

                  <label className="flex flex-col items-center gap-1 text-xs font-semibold text-[var(--mu)] cursor-pointer">
                    <input
                      type="color"
                      value={looks.bg}
                      onChange={(e) =>
                        onUpdateLooks({ preset: 'custom', bg: e.target.value })
                      }
                      className="w-full h-10 rounded-xl cursor-pointer bg-[var(--sf)] border border-[var(--bd)] p-1"
                    />
                    <span>Background</span>
                  </label>

                  <label className="flex flex-col items-center gap-1 text-xs font-semibold text-[var(--mu)] cursor-pointer">
                    <input
                      type="color"
                      value={looks.surface}
                      onChange={(e) =>
                        onUpdateLooks({ preset: 'custom', surface: e.target.value })
                      }
                      className="w-full h-10 rounded-xl cursor-pointer bg-[var(--sf)] border border-[var(--bd)] p-1"
                    />
                    <span>Card Surface</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              {/* View & Grouping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                    Layout View
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[var(--sf)] rounded-xl border border-[var(--bd)]">
                    {(['grid', 'list'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          onUpdateConfig({ view: v });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                          config.view === v
                            ? 'bg-[var(--ac)] text-[var(--on)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {v} View
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                    Home Screen Mode
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[var(--sf)] rounded-xl border border-[var(--bd)]">
                    {[
                      { val: true, label: 'Categorized' },
                      { val: false, label: 'Single List' },
                    ].map((opt) => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          onUpdateConfig({ group: opt.val });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                          config.group === opt.val
                            ? 'bg-[var(--ac)] text-[var(--on)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Density & Header Bar Placement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                    Grid Density
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[var(--sf)] rounded-xl border border-[var(--bd)]">
                    {(['compact', 'comfortable', 'airy'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          onUpdateLooks({ density: d });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                          looks.density === d
                            ? 'bg-[var(--ac)] text-[var(--on)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                    Dock / Header Position
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-[var(--sf)] rounded-xl border border-[var(--bd)]">
                    {(['top', 'bottom'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          onUpdateLooks({ bar: pos });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                          looks.bar === pos
                            ? 'bg-[var(--ac)] text-[var(--on)]'
                            : 'text-[var(--mu)] hover:text-[var(--tx)]'
                        }`}
                      >
                        {pos === 'top' ? 'Top Navigation' : 'iOS Bottom Dock'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sorting */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Bookmark Order
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'manual', label: 'Custom' },
                    { key: 'recent', label: 'Newest First' },
                    { key: 'popular', label: 'Most Used' },
                    { key: 'az', label: 'Alphabetical' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateConfig({ sort: s.key as any });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        config.sort === s.key
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)] shadow-xs'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column control slider */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
                    Icons per Row
                  </label>
                  <span className="text-xs font-bold text-[var(--ac)]">
                    {config.cols === 0 ? 'Auto Responsive' : `${config.cols} Columns`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={config.cols}
                  onChange={(e) => onUpdateConfig({ cols: Number(e.target.value) })}
                  className="w-full accent-[var(--ac)] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ICONS */}
          {activeTab === 'icons' && (
            <div className="space-y-6">
              {/* Shape */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Icon Geometry Shape
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['rounded', 'circle', 'squircle', 'square'] as const).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateLooks({ shape: sh });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition ${
                        looks.shape === sh
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)] shadow-xs'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Size Slider */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
                    Icon Size
                  </label>
                  <span className="text-xs font-bold text-[var(--ac)]">{config.tile}px</span>
                </div>
                <input
                  type="range"
                  min="44"
                  max="92"
                  value={config.tile}
                  onChange={(e) => onUpdateConfig({ tile: Number(e.target.value) })}
                  className="w-full accent-[var(--ac)] cursor-pointer"
                />
              </div>

              {/* Icon Rings & Outline Style */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Edge & Glow Finish
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'soft', label: 'Soft Edge' },
                    { key: 'accent', label: 'Accent Border' },
                    { key: 'double', label: 'Double Line' },
                    { key: 'glow', label: 'Soft Glow' },
                    { key: 'neon', label: 'Neon Cyber' },
                    { key: 'gold', label: 'Gold Foil' },
                    { key: 'silver', label: 'Silver Chrome' },
                    { key: 'halo', label: 'Pulsing Halo' },
                    { key: 'none', label: 'Clean Borderless' },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateLooks({ ring: r.key as any });
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border truncate transition ${
                        looks.ring === r.key
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)] shadow-xs'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shadow Depth */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Icon Shadow Depth
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['flat', 'soft', 'lifted', 'glow'] as const).map((dp) => (
                    <button
                      key={dp}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateLooks({ depth: dp });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition ${
                        looks.depth === dp
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)] shadow-xs'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {dp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEXT */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              {/* App Font */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  App Typography
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 0, label: 'Bricolage Grotesque' },
                    { id: 1, label: 'Inter SF Pro' },
                    { id: 2, label: 'Outfit' },
                    { id: 3, label: 'Space Grotesk' },
                    { id: 4, label: 'JetBrains Mono' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateConfig({ ff: font.id });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                        config.ff === font.id
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)]'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Size Slider */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
                    App Text Scale
                  </label>
                  <span className="text-xs font-bold text-[var(--ac)]">{config.ts}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="135"
                  value={config.ts}
                  onChange={(e) => onUpdateConfig({ ts: Number(e.target.value) })}
                  className="w-full accent-[var(--ac)] cursor-pointer"
                />
              </div>

              {/* Title Lines */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Bookmark Title Lines
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 0, label: 'Hidden' },
                    { val: 1, label: '1 Line' },
                    { val: 2, label: '2 Lines' },
                    { val: 3, label: '3 Lines' },
                  ].map((lineOpt) => (
                    <button
                      key={lineOpt.val}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateConfig({ lines: lineOpt.val });
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                        config.lines === lineOpt.val
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)]'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {lineOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MOTION & WALLPAPERS */}
          {activeTab === 'motion' && (
            <div className="space-y-6">
              {/* Shuffle Vibe Composer */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--ac)]/15 via-[var(--ac)]/5 to-transparent border border-[var(--ac)]/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm">🎲 Magic Shuffle</h4>
                    <p className="text-xs text-[var(--mu)] mt-0.5">
                      Generate balanced cohesive aesthetic looks in 1-tap
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {undoHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUndoShuffle}
                        className="p-2 rounded-xl bg-[var(--sf)] border border-[var(--bd)] text-[var(--mu)] hover:text-[var(--tx)]"
                        title="Undo shuffle"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleShuffle}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ac)] text-[var(--on)] font-bold text-xs shadow-md active:scale-95 transition"
                    >
                      <Dices className="w-4 h-4" />
                      <span>Remix</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Wallpaper Picker */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
                    Wallpaper Background
                  </label>
                  {onOpenWallpaperCrop && (
                    <button
                      type="button"
                      onClick={onOpenWallpaperCrop}
                      className="text-xs font-semibold text-[var(--ac)] hover:underline"
                    >
                      Upload Photo
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'aurora', label: 'Aurora' },
                    { key: 'glow', label: 'Radial Glow' },
                    { key: 'mesh', label: 'Color Mesh' },
                    { key: 'sunset', label: 'Sunset Dusk' },
                    { key: 'midnight', label: 'Midnight Sky' },
                    { key: 'oceanbg', label: 'Deep Ocean' },
                    { key: 'forestbg', label: 'Pine Forest' },
                    { key: 'candy', label: 'Pastel Dream' },
                    { key: 'shaderwaves', label: 'WebGL Waves' },
                    { key: 'grain', label: 'Paper Grain' },
                    { key: 'dots', label: 'Retro Dots' },
                    { key: 'plain', label: 'Solid Minimal' },
                  ].map((bgItem) => (
                    <button
                      key={bgItem.key}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateLooks({ bgfx: bgItem.key as any });
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border truncate transition ${
                        looks.bgfx === bgItem.key
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)] shadow-xs'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {bgItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Particle Overlays */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Live Atmosphere Overlay
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'off', label: 'None' },
                    { key: 'aurora', label: 'Ribbons' },
                    { key: 'fireflies', label: 'Fireflies' },
                    { key: 'orbs', label: 'Floating Orbs' },
                    { key: 'stars', label: 'Starfield' },
                    { key: 'bubbles', label: 'Bubbles' },
                    { key: 'net', label: 'Constellations' },
                  ].map((amb) => (
                    <button
                      key={amb.key}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateLooks({ amb: amb.key as any });
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border truncate transition ${
                        looks.amb === amb.key
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)] shadow-xs'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {amb.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Intensity Slider */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--mu)]">
                    Animation Intensity
                  </label>
                  <span className="text-xs font-bold text-[var(--ac)]">{looks.level}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={looks.level}
                  onChange={(e) => onUpdateLooks({ level: Number(e.target.value) })}
                  className="w-full accent-[var(--ac)] cursor-pointer"
                />
              </div>

              {/* Touch Reaction */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Icon Touch Reaction
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['magnet', 'repel', 'depth', 'off'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onUpdateLooks({ react: r });
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border transition ${
                        looks.react === r
                          ? 'border-[var(--ac)] bg-[var(--ac)] text-[var(--on)] shadow-xs'
                          : 'border-[var(--bd)] bg-[var(--sf)] text-[var(--tx)] hover:bg-[var(--fill)]'
                      }`}
                    >
                      {r === 'magnet' ? 'Magnetic' : r === 'depth' ? '3D Tilt' : r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATA & APP */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* PWA Install Action */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Standalone Native App
                </label>
                <p className="text-xs text-[var(--mu)] mb-3">
                  Install Little Space to your Home Screen or Dock for offline launch, no browser bars, and instantaneous startup.
                </p>
                <PWAInstallButton inline />
              </div>

              {/* Sync Across Devices */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[var(--tx)]">Sync Across Devices</h4>
                    <p className="text-[11px] text-[var(--mu)] mt-0.5">Use 16-character code or Supabase database</p>
                  </div>
                  {onOpenSync && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        onOpenSync();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--ac)] text-[var(--on)] text-xs font-semibold shadow-xs hover:brightness-105 active:scale-95 transition"
                    >
                      Configure
                    </button>
                  )}
                </div>
              </div>

              {/* Backup & Restore */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mu)] mb-2">
                  Data Backup &amp; Sync
                </label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.success();
                      exportBackup(bookmarks, watchlist, config, looks);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--sf)] border border-[var(--bd)] font-semibold text-xs hover:bg-[var(--fill)] transition"
                  >
                    <Download className="w-4 h-4 text-[var(--ac)]" />
                    <span>Export JSON</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--sf)] border border-[var(--bd)] font-semibold text-xs hover:bg-[var(--fill)] transition cursor-pointer">
                    <Upload className="w-4 h-4 text-[var(--ac)]" />
                    <span>Import HTML/JSON</span>
                    <input
                      type="file"
                      accept=".json,.html,.htm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          haptic.tap();
                          onImportBookmarks(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset */}
              <div className="p-4 rounded-2xl bg-[var(--fill)]/50 border border-[var(--bd)] flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-[var(--tx)]">Reset Appearance</h4>
                  <p className="text-[11px] text-[var(--mu)]">Restore defaults while preserving bookmarks</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptic.warning();
                    if (confirm('Reset appearance settings to default?')) {
                      onResetAppearance();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500/10 transition"
                >
                  Reset
                </button>
              </div>

              <div className="text-center text-xs text-[var(--mu)] pt-2">
                Version 2.2
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
