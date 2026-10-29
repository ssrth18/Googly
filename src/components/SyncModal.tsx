import React, { useState } from 'react';
import { Cloud, Copy, Check, Key, Database, Smartphone, X } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string | null;
  onEnableSync: (code: string) => void;
  onTurnOffSync: () => void;
}

export const SyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  syncCode,
  onEnableSync,
  onTurnOffSync,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'db'>('sync');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Supabase direct settings
  const [dbUrl, setDbUrl] = useState(localStorage.getItem('lp_url') || '');
  const [dbKey, setDbKey] = useState(localStorage.getItem('lp_key') || '');
  const [dbSaved, setDbSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerateNewCode = () => {
    haptic.pop();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const formatted = code.match(/.{4}/g)?.join('-') || code;
    onEnableSync(formatted);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length !== 16) {
      alert('Please enter a 16-character sync code.');
      return;
    }
    haptic.success();
    const formatted = cleaned.match(/.{4}/g)?.join('-') || cleaned;
    onEnableSync(formatted);
  };

  const handleCopyCode = () => {
    if (!syncCode) return;
    haptic.tap();
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setupPromptText = `Set up the backend for my "Little Space" bookmarks app with your Supabase tools.
1. Create table lp_bookmarks (id uuid primary key, user_id uuid, url text, title text, tags text[], pinned boolean, icon_url text, emoji text, position integer, open_count integer, created_at timestamptz, updated_at timestamptz);
2. Create table lp_watchlist (id uuid primary key, user_id uuid, url text, title text, why text, benefit text, done boolean, created_at timestamptz, updated_at timestamptz);
3. Enable Row Level Security (RLS) and grant authenticated access.`;

  const handleCopySetupPrompt = () => {
    haptic.tap();
    navigator.clipboard.writeText(setupPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleSaveDbSettings = (e: React.FormEvent) => {
    e.preventDefault();
    haptic.success();
    localStorage.setItem('lp_url', dbUrl.trim());
    localStorage.setItem('lp_key', dbKey.trim());
    setDbSaved(true);
    setTimeout(() => setDbSaved(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[var(--sf)] border border-[var(--bd)] p-6 shadow-2xl text-[var(--tx)] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--sep)]">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[var(--ac)]" />
            <h3 className="text-base font-bold">Cloud Sync &amp; Database</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:bg-[var(--fill)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-[var(--fill)]/70 rounded-2xl my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'sync'
                ? 'bg-[var(--sf)] text-[var(--tx)] shadow-xs'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Sync Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('db')}
            className={`flex-1 py-1.5 rounded-xl transition ${
              activeTab === 'db'
                ? 'bg-[var(--sf)] text-[var(--tx)] shadow-xs'
                : 'text-[var(--mu)] hover:text-[var(--tx)]'
            }`}
          >
            Custom Supabase DB
          </button>
        </div>

        {activeTab === 'sync' ? (
          /* ================= SYNC CODE TAB ================= */
          <div className="space-y-4">
            {syncCode ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    <Check className="w-4 h-4" />
                    <span>Sync is Active</span>
                  </div>
                  <p className="text-xs text-[var(--mu)] mb-3">
                    Enter this code on your other devices to access the same bookmarks:
                  </p>
                  <div className="font-mono text-lg font-bold tracking-widest p-3 bg-[var(--sf)] rounded-xl border border-[var(--bd)] select-all text-[var(--tx)]">
                    {syncCode}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--ac)] text-[var(--on)] font-semibold text-xs shadow-md flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Code Copied!' : 'Copy Sync Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Turn off sync on this device?')) {
                        onTurnOffSync();
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl border border-red-500/30 text-red-500 font-semibold text-xs hover:bg-red-500/10"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[var(--mu)] leading-relaxed">
                  Keep your bookmarks identical across your phone, tablet, and laptop without creating an account or providing an email.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateNewCode}
                  className="w-full py-3 rounded-2xl bg-[var(--ac)] text-[var(--on)] font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Generate New Sync Code</span>
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-[var(--sep)] w-full" />
                  <span className="bg-[var(--sf)] px-3 text-[11px] text-[var(--mu)] uppercase tracking-wider font-semibold absolute">
                    or join device
                  </span>
                </div>

                <form onSubmit={handleJoinWithCode} className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--mu)]">
                    Already have a sync code?
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] font-mono text-center tracking-widest text-sm outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[var(--fill)] font-semibold text-xs hover:bg-[var(--fill)]/80 transition"
                  >
                    Connect Code
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* ================= CUSTOM SUPABASE DB TAB ================= */
          <form onSubmit={handleSaveDbSettings} className="space-y-4">
            <p className="text-xs text-[var(--mu)] leading-relaxed">
              Connect your own Supabase project for 100% self-hosted ownership of your launchpad data.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
                Project URL
              </label>
              <input
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mu)] mb-1">
                Publishable Key (Anon Key)
              </label>
              <input
                type="text"
                value={dbKey}
                onChange={(e) => setDbKey(e.target.value)}
                placeholder="sb_publishable_... or anon public key"
                className="w-full p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--bd)] text-xs outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleCopySetupPrompt}
              className="w-full py-2.5 rounded-xl bg-[var(--fill)] text-[var(--tx)] text-xs font-semibold hover:bg-[var(--fill)]/80 flex items-center justify-center gap-1.5"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--ac)]" />}
              <span>{copiedPrompt ? 'Setup Prompt Copied!' : 'Copy SQL Setup Prompt'}</span>
            </button>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[var(--ac)] text-[var(--on)] text-xs font-semibold shadow-md"
            >
              {dbSaved ? 'Saved Settings!' : 'Save Database Configuration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
