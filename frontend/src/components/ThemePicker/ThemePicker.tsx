"use client";

import { ThemeName } from "@/hooks/useTheme";
import styles from "./ThemePicker.module.css";

const THEMES: { name: ThemeName; label: string; color: string }[] = [
  { name: "moleskine", label: "Moleskine", color: "#1c1c1c" },
  { name: "field-notes", label: "Field Notes", color: "#4a3520" },
  { name: "leuchtturm", label: "Leuchtturm", color: "#1a2340" },
];

interface ThemePickerProps {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
}

export function ThemePicker({ theme, setTheme }: ThemePickerProps) {
  return (
    <div className={styles.picker}>
      {THEMES.map((t) => (
        <button
          key={t.name}
          title={t.label}
          className={`${styles.swatch} ${theme === t.name ? styles.swatchActive : ""}`}
          style={{ backgroundColor: t.color }}
          onClick={() => setTheme(t.name)}
          aria-label={`Switch to ${t.label} theme`}
          aria-pressed={theme === t.name}
        />
      ))}
    </div>
  );
}
