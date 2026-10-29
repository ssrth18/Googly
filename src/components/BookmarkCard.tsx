import React, { useState, useRef } from 'react';
import { Bookmark, AppLooks, AppConfig } from '../types';
import { extractHostname, normalizeUrl } from '../services/storage';
import { stringToHue } from '../utils/colors';
import { Star, MoreVertical, Check } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  bookmark: Bookmark;
  index: number;
  looks: AppLooks;
  config: AppConfig;
  isSelecting: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpenMenu: (b: Bookmark, x: number, y: number) => void;
  onLaunch: (b: Bookmark, el: HTMLElement) => void;
}

export const BookmarkCard: React.FC<Props> = ({
  bookmark,
  index,
  looks,
  config,
  isSelecting,
  isSelected,
  onSelect,
  onOpenMenu,
  onLaunch,
}) => {
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);

  const hostname = extractHostname(bookmark.url);
  const hue = stringToHue(bookmark.title || hostname);
  const letter = (bookmark.title || hostname || '?').charAt(0).toUpperCase();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSelecting) return;
    pressTimerRef.current = window.setTimeout(() => {
      haptic.pop();
      onOpenMenu(bookmark, e.clientX, e.clientY);
    }, 450);
  };

  const handlePointerUpOrLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelecting) {
      e.preventDefault();
      haptic.tap();
      onSelect(bookmark.id);
      return;
    }

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // Launch animation or immediate open
    if (looks.launch !== 'off' && cardRef.current) {
      e.preventDefault();
      haptic.tap();
      onLaunch(bookmark, cardRef.current);
    } else {
      haptic.tap();
      if (config.open === 'same') {
        window.location.href = bookmark.url;
      } else {
        window.open(bookmark.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    haptic.pop();
    onOpenMenu(bookmark, e.clientX, e.clientY);
  };

  // Determine icon ring styling
  const getRingStyle = () => {
    const rw = looks.rw === 'thin' ? '2px' : looks.rw === 'bold' ? '4px' : '3px';
    switch (looks.ring) {
      case 'accent':
        return `outline: ${rw} solid var(--ac); outline-offset: 2px;`;
      case 'double':
        return `outline: ${rw} solid var(--ac); outline-offset: 3px; box-shadow: 0 0 0 1.5px rgba(255,255,255,0.7);`;
      case 'glow':
        return `box-shadow: 0 0 14px 2px var(--ac);`;
      case 'neon':
        return `box-shadow: 0 0 6px 1px #ffffff, 0 0 16px 3px var(--ac);`;
      case 'gold':
        return `outline: ${rw} solid #e5b838; outline-offset: 2px; box-shadow: 0 0 12px rgba(229,184,56,0.4);`;
      case 'silver':
        return `outline: ${rw} solid #d1d5db; outline-offset: 2px; box-shadow: 0 0 10px rgba(209,213,219,0.5);`;
      case 'halo':
        return `box-shadow: 0 0 0 3px color-mix(in srgb, var(--ac) 40%, transparent), 0 0 0 6px color-mix(in srgb, var(--ac) 20%, transparent);`;
      default:
        return '';
    }
  };

  // Determine Icon Shape
  const getShapeClass = () => {
    switch (looks.shape) {
      case 'circle':
        return 'rounded-full';
      case 'square':
        return 'rounded-xl';
      case 'squircle':
        return 'rounded-[30%]';
      default:
        return 'rounded-[22%]';
    }
  };

  const getMotionAnimationClass = () => {
    if (looks.level === 0 || looks.motion === 'none') return '';
    switch (looks.motion) {
      case 'alive':
        return 'animate-alive';
      case 'float':
        return 'animate-float';
      case 'breathe':
        return 'animate-breathe';
      case 'jelly':
        return 'animate-jelly';
      case 'bubbly':
        return 'animate-bubbly';
      case 'pulse':
        return 'animate-pulse-subtle';
      default:
        return '';
    }
  };

  const isList = config.view === 'list';

  if (isList) {
    return (
      <div
        ref={cardRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        className={`group relative flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all cursor-pointer select-none active:scale-[0.98] ${
          looks.lst === 'cards'
            ? 'bg-[var(--sf)] border border-[var(--bd)] shadow-sm hover:border-[var(--ac)]/40 hover:shadow-md'
            : 'hover:bg-[var(--fill)] border-b border-[var(--sep)] last:border-0'
        } ${isSelected ? 'ring-2 ring-[var(--ac)] bg-[var(--ac)]/10' : ''}`}
      >
        {/* Selection Checkbox */}
        {isSelecting && (
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isSelected ? 'bg-[var(--ac)] text-[var(--on)]' : 'border-2 border-[var(--mu)]'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        )}

        {/* List Icon */}
        <div
          className={`relative w-10 h-10 ${getShapeClass()} overflow-hidden shrink-0 flex items-center justify-center shadow-sm text-white font-bold text-base transition-transform group-hover:scale-105`}
          style={{
            background:
              !imgError && bookmark.icon_url
                ? '#ffffff'
                : `linear-gradient(145deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 35) % 360}, 75%, 45%))`,
          }}
        >
          {bookmark.emoji ? (
            <span className="text-xl">{bookmark.emoji}</span>
          ) : !imgError && bookmark.icon_url ? (
            <img
              src={bookmark.icon_url}
              alt=""
              className="w-full h-full object-contain p-1.5"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{letter}</span>
          )}

          {bookmark.pinned && looks.pin === 'badge' && (
            <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[var(--ac)] text-[var(--on)] flex items-center justify-center shadow">
              <Star className="w-2 h-2 fill-current" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate text-[var(--tx)]">
              {bookmark.title}
            </span>
            {bookmark.pinned && looks.pin === 'ring' && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--ac)]/15 text-[var(--ac)] font-bold">
                PINNED
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--mu)] truncate block mt-0.5">
            {hostname}
          </span>
        </div>

        {/* More Actions button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            haptic.tap();
            onOpenMenu(bookmark, e.clientX, e.clientY);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--fill)] shrink-0 transition"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Grid Card View
  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      className={`group relative flex flex-col items-center gap-2 p-2 rounded-2xl cursor-pointer select-none transition-all active:scale-[0.92] ${
        isSelected ? 'scale-95' : ''
      }`}
    >
      {/* Selection Badge */}
      {isSelecting && (
        <div
          className={`absolute top-0 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform ${
            isSelected
              ? 'bg-[var(--ac)] text-[var(--on)] scale-110'
              : 'bg-[var(--sf)] border-2 border-[var(--mu)]'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      )}

      {/* Main Tile Icon */}
      <div
        className={`relative flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105 ${getShapeClass()} ${getMotionAnimationClass()}`}
        style={{
          width: `${config.tile}px`,
          height: `${config.tile}px`,
          fontSize: `${config.tile * 0.42}px`,
          boxShadow:
            looks.depth === 'flat'
              ? 'none'
              : looks.depth === 'lifted'
              ? '0 12px 24px -4px rgba(0,0,0,0.18), 0 3px 6px rgba(0,0,0,0.1)'
              : looks.depth === 'glow'
              ? '0 0 20px 2px color-mix(in srgb, var(--ac) 50%, transparent)'
              : '0 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          background:
            !imgError && bookmark.icon_url
              ? '#ffffff'
              : `linear-gradient(150deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 75%, 45%))`,
        }}
      >
        {bookmark.emoji ? (
          <span>{bookmark.emoji}</span>
        ) : !imgError && bookmark.icon_url ? (
          <img
            src={bookmark.icon_url}
            alt=""
            className="w-full h-full object-contain p-2"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-bold text-white drop-shadow-sm">{letter}</span>
        )}

        {/* Pinned Marker */}
        {bookmark.pinned && looks.pin === 'badge' && (
          <div
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--ac)] text-[var(--on)] flex items-center justify-center shadow-md"
            title="Pinned"
          >
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
        )}

        {/* Outline ring effect */}
        {looks.ring !== 'none' && (
          <div
            className={`absolute inset-0 pointer-events-none ${getShapeClass()}`}
            style={{
              boxShadow:
                looks.ring === 'accent'
                  ? 'inset 0 0 0 2px var(--ac)'
                  : looks.ring === 'double'
                  ? 'inset 0 0 0 1.5px rgba(255,255,255,0.7), 0 0 0 2px var(--ac)'
                  : looks.ring === 'neon'
                  ? 'inset 0 0 0 1.5px #fff, 0 0 12px var(--ac)'
                  : 'inset 0 0 0 1px rgba(255,255,255,0.3)',
            }}
          />
        )}
      </div>

      {/* Title & Hostname */}
      {config.lines > 0 && (
        <div className="w-full text-center px-1">
          <p
            className={`text-xs text-[var(--tx)] font-semibold leading-tight line-clamp-${config.lines} break-words`}
            style={{ fontSize: `${config.fs}px` }}
          >
            {bookmark.title}
          </p>
          {config.host === 1 && (
            <p className="text-[10px] text-[var(--mu)] truncate mt-0.5">
              {hostname}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
