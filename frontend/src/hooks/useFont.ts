"use client";

import { useState, useEffect } from "react";

export type FontName = "lora" | "merriweather" | "eb-garamond" | "crimson";

const STORAGE_KEY = "vj-font";

export function useFont() {
  const [font, setFontState] = useState<FontName>("lora");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as FontName | null;
    if (saved && saved !== "lora") {
      document.documentElement.setAttribute("data-font", saved);
      setFontState(saved);
    }
  }, []);

  function setFont(name: FontName) {
    if (name === "lora") {
      document.documentElement.removeAttribute("data-font");
    } else {
      document.documentElement.setAttribute("data-font", name);
    }
    localStorage.setItem(STORAGE_KEY, name);
    setFontState(name);
  }

  return { font, setFont };
}
