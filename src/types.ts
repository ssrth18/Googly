export interface Bookmark {
  id: string;
  url: string;
  title: string;
  tags: string[]; // Categories are stored as tags starting with '@'
  pinned: boolean;
  icon_url?: string | null;
  emoji?: string | null;
  position: number;
  open_count: number;
  last_opened_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  url: string;
  title: string;
  why: string;
  benefit: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export type ThemePreset =
  | 'cozy'
  | 'rose'
  | 'ocean'
  | 'mono'
  | 'sunset'
  | 'berry'
  | 'mint'
  | 'cyber'
  | 'custom';

export type WallpaperStyle =
  | 'aurora'
  | 'glow'
  | 'wash'
  | 'mesh'
  | 'spotlight'
  | 'haze'
  | 'sunset'
  | 'midnight'
  | 'oceanbg'
  | 'forestbg'
  | 'candy'
  | 'twilight'
  | 'prism'
  | 'shaderwaves'
  | 'sc-mountains'
  | 'sc-lake'
  | 'sc-aurora'
  | 'sc-galaxy'
  | 'sc-hills'
  | 'grain'
  | 'dots'
  | 'grid'
  | 'lines'
  | 'waves'
  | 'starsbg'
  | 'photo'
  | 'plain';

export type AmbientEffect =
  | 'off'
  | 'warp'
  | 'aurora'
  | 'fireflies'
  | 'net'
  | 'orbs'
  | 'waves'
  | 'stars'
  | 'bubbles';

export type IconShape = 'rounded' | 'circle' | 'squircle' | 'square';

export type IconTone =
  | 'vivid'
  | 'soft'
  | 'pastel'
  | 'mono'
  | 'accent'
  | 'glass';

export type IconRing =
  | 'soft'
  | 'none'
  | 'accent'
  | 'double'
  | 'gradient'
  | 'stitch'
  | 'halo'
  | 'glow'
  | 'neon'
  | 'pulse'
  | 'lifted'
  | 'spin'
  | 'aurora'
  | 'rainbow'
  | 'holo'
  | 'dash'
  | 'gold'
  | 'silver'
  | 'rose'
  | 'glassedge'
  | 'bevel'
  | 'frame'
  | 'pearl'
  | 'candy';

export type MotionStyle =
  | 'alive'
  | 'bubbly'
  | 'float'
  | 'breathe'
  | 'jelly'
  | 'drift'
  | 'orbit'
  | 'sway'
  | 'hop'
  | 'glow'
  | 'shimmer'
  | 'pulse'
  | 'none';

export type TouchReaction = 'magnet' | 'repel' | 'depth' | 'off';

export type PageTransition =
  | 'slide'
  | 'fade'
  | 'zoom'
  | 'flip'
  | 'blur'
  | 'curtain'
  | 'rise'
  | 'swirl'
  | 'wave'
  | 'ic-scatter'
  | 'ic-vortex'
  | 'ic-drop'
  | 'ic-swing'
  | 'ic-flip3d'
  | 'ic-pop'
  | 'ic-spring'
  | 'ic-cascade'
  | 'ic-zoom'
  | 'ic-blur'
  | 'ic-tilt'
  | 'ic-soft'
  | 'none';

export interface AppLooks {
  preset: ThemePreset;
  accent: string;
  bg: string;
  surface: string;
  motion: MotionStyle;
  level: number; // 0..100
  speed: number; // 50..200
  bgfx: WallpaperStyle;
  bgs: number; // 20..100
  density: 'compact' | 'comfortable' | 'airy';
  depth: 'flat' | 'soft' | 'lifted' | 'glow';
  shape: IconShape;
  ictone: IconTone;
  width: 'narrow' | 'normal' | 'wide';
  fab: 'left' | 'center' | 'right';
  tabs: 'pills' | 'underline' | 'minimal';
  counts: 'show' | 'hide';
  heads: 'show' | 'hide';
  dark: 'soft' | 'black';
  lw: 'regular' | 'medium' | 'bold';
  pin: 'badge' | 'ring' | 'hidden';
  ring: IconRing;
  rw: 'thin' | 'medium' | 'bold';
  hdr: 'blur' | 'solid' | 'clear';
  bar: 'top' | 'bottom';
  lst: 'cards' | 'plain';
  amb: AmbientEffect;
  react: TouchReaction;
  launch: 'auto' | 'on' | 'off';
  rm: 'follow' | 'ignore';
  perf: 'auto' | 'lite' | 'full';
  txt: 'auto' | 'light' | 'dark' | 'custom';
  txc: string;
}

export interface AppConfig {
  theme: 'auto' | 'light' | 'dark';
  view: 'grid' | 'list';
  sort: 'manual' | 'recent' | 'popular' | 'az';
  group: boolean;
  cols: number; // 0 for auto, or 2..8
  tile: number; // 44..96
  gap: number; // 8..40
  rad: number; // 0..50
  fs: number; // 9..22
  lines: number; // 0..3
  ff: number; // font index
  hf: string; // headings font index or 'same'
  ts: number; // text scale % (60..150)
  host: number; // 0 or 1
  open: 'new' | 'same';
  start: 'first' | 'last';
  tord?: string[]; // category order
  looks?: Partial<AppLooks>;
}
