"use client";

import { useState, useEffect } from "react";

export type ThemeName = "moleskine" | "field-notes" | "leuchtturm";

const STORAGE_KEY = "vj-theme";

function applyTheme(name: ThemeName) {
  document.documentElement.setAttribute("data-theme", name);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>("moleskine");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    applyTheme(saved ?? "moleskine");
    if (saved) setThemeState(saved);
  }, []);

  function setTheme(name: ThemeName) {
    applyTheme(name);
    localStorage.setItem(STORAGE_KEY, name);
    setThemeState(name);
  }

  return { theme, setTheme };
}
