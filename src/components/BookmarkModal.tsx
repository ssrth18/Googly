import React, { useState, useEffect } from 'react';
import { Bookmark } from '../types';
import { normalizeUrl, extractHostname } from '../services/storage';
import { X, Trash2, Pin, Sparkles, Image as ImageIcon, Smile } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookmark: Bookmark | null;
  onSave: (data: Partial<Bookmark>) => void;
  onDelete?: (id: string) => void;
  existingCategories: string[];
}

export const BookmarkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bookmark,
  onSave,
  onDelete,
  existingCategories,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [pinned, setPinned] = useState(false);
  const [iconUrl, setIconUrl] = useState('');
  const [emoji, setEmoji] = useState('');
  const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url);
      setTitle(bookmark.title);
      const cat = bookmark.tags.find((t) => t.startsWith('@'))?.slice(1) || '';
      setCategory(cat);
      setPinned(bookmark.pinned);
      setIconUrl(bookmark.icon_url?.startsWith('data:') ? '' : bookmark.icon_url || '');
      setUploadedIcon(bookmark.icon_url?.startsWith('data:') ? bookmark.icon_url : null);
      setEmoji(bookmark.emoji || '');
    } else {
      setUrl('');
      setTitle('');
      setCategory('');
      setPinned(false);
      setIconUrl('');
      setUploadedIcon(null);
      setEmoji('');
    }
    setError('');
    setShowAdvanced(false);
  }, [bookmark, isOpen]);

  if (!isOpen) return null;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!title && newUrl) {
      const host = extractHostname(newUrl);
      if (host) {
        setTitle(host.charAt(0).toUpperCase() + host.slice(1));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const size = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 128, 128);
        setUploadedIcon(canvas.toDataURL('image/webp', 0.85));
      }
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalized = normalizeUrl(url);
      const finalTitle = title.trim() || extractHostname(normalized);
      const tags: string[] = [];
      if (category.trim()) {
        tags.push('@' + category.trim().replace(/^@+/, ''));
      }

      onSave({
        url: normalized,
        title: finalTitle,
        tags,
        pinned,
        icon_url: uploadedIcon || (iconUrl.trim() ? normalizeUrl(iconUrl) : null),
        emoji: emoji.trim() || null,
      });
      haptic.success();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Please check link URL.');
    }
  };

  const currentHostname = url ? extractHostname(url) : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-6 shadow-2xl text-[var(--tx)] animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--sep)]">
          <h3 className="text-lg font-bold">
            {bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:bg-[var(--fill)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Icon */}
        <div className="flex items-center justify-center my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9dad91] to-[#52694d] shadow-md flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative">
            {emoji ? (
              <span>{emoji}</span>
            ) : uploadedIcon ? (
              <img src={uploadedIcon} alt="" className="w-full h-full object-contain p-2" />
            ) : iconUrl ? (
              <img src={iconUrl} alt="" className="w-full h-full object-contain p-2" />
            ) : (
              <span>{(title || currentHostname || '?').charAt(0).toUpperCase()}</span>
            )}
            {pinned && (
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--ac)] text-[var(--on)] flex items-center justify-center text-[10px]">
                ★
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link URL */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Link URL *
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="e.g. github.com or https://linear.app"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none focus:border-[var(--ac)] focus:ring-2 focus:ring-[var(--ac)]/20 transition"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Site or app title"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none focus:border-[var(--ac)] focus:ring-2 focus:ring-[var(--ac)]/20 transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Work, Design, Dev, Reading"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none focus:border-[var(--ac)] focus:ring-2 focus:ring-[var(--ac)]/20 transition"
            />
            {existingCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {existingCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      haptic.tap();
                      setCategory(category === cat ? '' : cat);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      category === cat
                        ? 'bg-[var(--ac)] text-[var(--on)]'
                        : 'bg-[var(--fill)] text-[var(--mu)] hover:text-[var(--tx)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => {
                haptic.tap();
                setPinned(e.target.checked);
              }}
              className="w-4 h-4 rounded text-[var(--ac)] accent-[var(--ac)]"
            />
            <span className="text-sm font-medium">Pin to top of launchpad</span>
          </label>

          {/* Icon Customization accordion */}
          <div className="border border-[var(--bd)] rounded-2xl overflow-hidden bg-[var(--fill)]/50">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[var(--mu)] hover:text-[var(--tx)]"
            >
              <span>Custom Icon & Emoji (Optional)</span>
              <span>{showAdvanced ? '−' : '＋'}</span>
            </button>

            {showAdvanced && (
              <div className="p-4 pt-1 space-y-3 border-t border-[var(--sep)]">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mu)] mb-1">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="e.g. 🚀, 🎨, ⚡"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mu)] mb-1">
                    Custom Icon URL
                  </label>
                  <input
                    type="text"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--mu)] mb-1">
                    Upload icon image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-[var(--mu)] file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-[var(--ac)] file:text-[var(--on)] file:font-semibold"
                  />
                  {uploadedIcon && (
                    <button
                      type="button"
                      onClick={() => setUploadedIcon(null)}
                      className="mt-2 text-xs text-red-500 hover:underline"
                    >
                      Remove uploaded image
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <div className="text-xs text-red-500 font-medium">{error}</div>}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {bookmark && onDelete && (
              <button
                type="button"
                onClick={() => {
                  haptic.warning();
                  if (confirm('Delete this bookmark?')) {
                    onDelete(bookmark.id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition"
                title="Delete bookmark"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[var(--fill)] text-sm font-semibold hover:bg-[var(--fill)]/80 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[var(--ac)] text-[var(--on)] text-sm font-semibold shadow-md hover:brightness-105 active:scale-95 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
