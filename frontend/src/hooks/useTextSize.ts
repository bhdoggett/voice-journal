"use client";

import { useState, useEffect } from "react";

export type TextSizeName = "small" | "medium" | "large";

const STORAGE_KEY = "vj-text-size";

export function useTextSize() {
  const [textSize, setTextSizeState] = useState<TextSizeName>("medium");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as TextSizeName | null;
    if (saved && saved !== "medium") {
      document.documentElement.setAttribute("data-text-size", saved);
      setTextSizeState(saved);
    }
  }, []);

  function setTextSize(name: TextSizeName) {
    if (name === "medium") {
      document.documentElement.removeAttribute("data-text-size");
    } else {
      document.documentElement.setAttribute("data-text-size", name);
    }
    localStorage.setItem(STORAGE_KEY, name);
    setTextSizeState(name);
  }

  return { textSize, setTextSize };
}
