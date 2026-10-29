// Native touch and haptic feedback utilities

export const haptic = {
  tap: () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate(8);
    } catch {
      // ignore
    }
  },
  pop: () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate(14);
    } catch {
      // ignore
    }
  },
  toggle: () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate([10, 20, 10]);
    } catch {
      // ignore
    }
  },
  success: () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate([12, 40, 18]);
    } catch {
      // ignore
    }
  },
  warning: () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate([25, 40, 25]);
    } catch {
      // ignore
    }
  },
};
