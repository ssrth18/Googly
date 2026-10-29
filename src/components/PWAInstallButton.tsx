import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { haptic } from '../utils/haptics';

interface Props {
  onClose?: () => void;
  inline?: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({ onClose, inline = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const handleInstallClick = async () => {
    haptic.pop();
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
        haptic.success();
        setTimeout(() => {
          if (onClose) onClose();
        }, 1800);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isInstalled && !installedSuccess) {
    if (inline) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>App is installed as native PWA</span>
        </div>
      );
    }
    return null;
  }

  if (installedSuccess) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white font-semibold text-sm shadow-lg animate-in fade-in zoom-in-95">
        <CheckCircle2 className="w-4 h-4" />
        <span>Installed! Check your Home Screen</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`group flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-md ${
          inline
            ? 'w-full bg-[var(--ac)] text-[var(--on)] hover:brightness-105'
            : 'bg-[var(--sf)] text-[var(--tx)] border border-[var(--bd)] hover:bg-[var(--fill)] shadow-sm'
        }`}
      >
        <Smartphone className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
        <span>Install Native App</span>
      </button>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[var(--sf)] p-6 text-[var(--tx)] shadow-2xl border border-[var(--bd)] animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--sep)]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9dad91] to-[#52694d] flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Install on iPhone / iPad</h3>
                  <p className="text-xs text-[var(--mu)]">Standalone full-screen experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--mu)] hover:bg-[var(--fill)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--fill)]">
                <div className="w-7 h-7 rounded-full bg-[var(--ac)] text-[var(--on)] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--tx)]">Tap Share in Safari</p>
                  <p className="text-[var(--mu)] text-xs mt-0.5">
                    Look for the <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[var(--ac)]" /> Share icon in the bottom Safari toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--fill)]">
                <div className="w-7 h-7 rounded-full bg-[var(--ac)] text-[var(--on)] flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--tx)]">Choose 'Add to Home Screen'</p>
                  <p className="text-[var(--mu)] text-xs mt-0.5">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[var(--ac)]" /> Add to Home Screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--fill)]">
                <div className="w-7 h-7 rounded-full bg-[var(--ac)] text-[var(--on)] flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--tx)]">Tap Add</p>
                  <p className="text-[var(--mu)] text-xs mt-0.5">
                    Little Space will launch from your home screen in smooth native standalone mode!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-[var(--ac)] text-[var(--on)] font-semibold text-sm shadow-md hover:brightness-105 active:scale-98 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
