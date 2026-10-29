import { ThemePreset } from '../types';

export const THEME_PRESETS: Record<ThemePreset, [accent: string, bg: string, surface: string]> = {
  cozy: ['#62745b', '#f5f1e9', '#fffdf8'],
  rose: ['#c47791', '#f8edf1', '#fff9fb'],
  ocean: ['#528c9a', '#edf5f6', '#fbffff'],
  mono: ['#737373', '#f1f1ef', '#ffffff'],
  sunset: ['#d58a45', '#fbf0df', '#fffaf0'],
  berry: ['#9364a8', '#f3edf8', '#fffaff'],
  mint: ['#578d78', '#edf5ef', '#fbfff9'],
  cyber: ['#3b82f6', '#090d16', '#121826'],
  custom: ['#62745b', '#f5f1e9', '#fffdf8'],
};

export const PRESET_NAMES: Record<ThemePreset, string> = {
  cozy: 'Garden',
  rose: 'Rosewater',
  ocean: 'Ocean',
  mono: 'Mono',
  sunset: 'Golden',
  berry: 'Berry',
  mint: 'Mint',
  cyber: 'Cyber',
  custom: 'Custom',
};

export const lum = (hex: string): number => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;
  const n = parseInt(cleanHex, 16);
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};

export const hexHue = (hex: string): number => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0;
  const n = parseInt(cleanHex, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (!d) return 0;
  const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((x * 60 + 360) % 360);
};

export const mixHex = (c1: string, c2: string, ratio: number): string => {
  const h1 = c1.replace('#', '');
  const h2 = c2.replace('#', '');
  const p1 = [0, 2, 4].map((i) => parseInt(h1.substring(i, i + 2), 16) || 0);
  const p2 = [0, 2, 4].map((i) => parseInt(h2.substring(i, i + 2), 16) || 0);
  const mixed = p1.map((v, i) => Math.round(v + (p2[i] - v) * ratio));
  return '#' + mixed.map((x) => x.toString(16).padStart(2, '0')).join('');
};

export const getContrastRatio = (c1: string, c2: string): number => {
  const l1 = lum(c1);
  const l2 = lum(c2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
};

export const stringToHue = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 360;
  }
  return hash;
};
