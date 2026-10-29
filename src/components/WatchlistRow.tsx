import React from 'react';
import { WatchlistItem, AppLooks } from '../types';
import { extractHostname } from '../services/storage';
import { Check, MoreVertical, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  item: WatchlistItem;
  looks: AppLooks;
  onToggleDone: (id: string) => void;
  onEdit: (item: WatchlistItem) => void;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
}

export const WatchlistRow: React.FC<Props> = ({
  item,
  looks,
  onToggleDone,
  onEdit,
  onDelete,
  onCopy,
}) => {
  const hostname = extractHostname(item.url);

  const getRelativeTime = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const days = Math.floor(diffMs / 86400000);
      if (days < 1) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 30) return `${days}d ago`;
      return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <article
      className={`group relative flex items-start gap-3.5 p-4 rounded-3xl bg-[var(--sf)] border border-[var(--bd)] shadow-sm hover:shadow-md transition-all ${
        item.done ? 'opacity-60 bg-[var(--sf)]/70' : ''
      }`}
    >
      {/* Done Checkbox */}
      <button
        type="button"
        onClick={() => {
          haptic.toggle();
          onToggleDone(item.id);
        }}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
          item.done
            ? 'bg-[var(--ac)] text-[var(--on)] scale-105'
            : 'border-2 border-[var(--mu)]/60 hover:border-[var(--ac)] hover:scale-105'
        }`}
        aria-label={item.done ? 'Mark as to watch' : 'Mark as completed'}
      >
        {item.done && <Check className="w-4 h-4 stroke-[3]" />}
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.tap()}
            className={`font-semibold text-base text-[var(--tx)] hover:text-[var(--ac)] transition-colors leading-snug break-words ${
              item.done ? 'line-through text-[var(--mu)]' : ''
            }`}
          >
            {item.title}
          </a>

          {/* External link small icon */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.tap()}
            className="text-[var(--mu)] hover:text-[var(--tx)] p-1 shrink-0"
            title="Open link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Host & Date */}
        <p className="text-xs text-[var(--mu)] mt-0.5">
          {hostname} · {getRelativeTime(item.created_at)}
        </p>

        {/* Why I saved it */}
        {item.why && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-[var(--fill)] text-xs text-[var(--tx)]">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[var(--ac)] mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Why I saved it</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{item.why}</p>
          </div>
        )}

        {/* How it helps me */}
        {item.benefit && (
          <div className="mt-2 p-2.5 rounded-2xl bg-[var(--fill)]/70 text-xs text-[var(--tx)]">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[var(--ac)] mb-1">
              <BookOpen className="w-3 h-3" />
              <span>How it will help me</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{item.benefit}</p>
          </div>
        )}
      </div>

      {/* Row Actions */}
      <div className="shrink-0 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            onEdit(item);
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--fill)]"
          title="Edit notes"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
};
