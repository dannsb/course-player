import { useState } from 'react';

export interface Preferences {
  autoNext: boolean;
  loadThumbnails: boolean;
  saveLastFolder: boolean;
}

const DEFAULT_PREFS: Preferences = {
  autoNext: true,
  loadThumbnails: true,
  saveLastFolder: false
};

const PREFS_KEY = 'course-player-prefs';

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to parse preferences", e);
    }
    return DEFAULT_PREFS;
  });

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { preferences, updatePreference };
};
