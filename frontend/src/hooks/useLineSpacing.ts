"use client";

import { useState, useEffect } from "react";

export type LineSpacingName = "compact" | "normal" | "relaxed";

const STORAGE_KEY = "vj-line-spacing";

export function useLineSpacing() {
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingName>("normal");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LineSpacingName | null;
    if (saved && saved !== "normal") {
      document.documentElement.setAttribute("data-line-spacing", saved);
      setLineSpacingState(saved);
    }
  }, []);

  function setLineSpacing(name: LineSpacingName) {
    if (name === "normal") {
      document.documentElement.removeAttribute("data-line-spacing");
    } else {
      document.documentElement.setAttribute("data-line-spacing", name);
    }
    localStorage.setItem(STORAGE_KEY, name);
    setLineSpacingState(name);
  }

  return { lineSpacing, setLineSpacing };
}
