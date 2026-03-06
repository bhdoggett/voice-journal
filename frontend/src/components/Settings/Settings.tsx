"use client";

import { ThemeName } from "@/hooks/useTheme";
import { FontName } from "@/hooks/useFont";
import { TextSizeName } from "@/hooks/useTextSize";
import { LineSpacingName } from "@/hooks/useLineSpacing";
import styles from "./Settings.module.css";

const THEMES: { name: ThemeName; label: string; color: string }[] = [
  { name: "moleskine", label: "Moleskine", color: "#1c1c1c" },
  { name: "field-notes", label: "Field Notes", color: "#4a3520" },
  { name: "leuchtturm", label: "Leuchtturm", color: "#1a2340" },
];

const FONTS: { name: FontName; label: string }[] = [
  { name: "lora", label: "Lora" },
  { name: "merriweather", label: "Merriweather" },
  { name: "eb-garamond", label: "EB Garamond" },
  { name: "crimson", label: "Crimson" },
];

interface SettingsProps {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  font: FontName;
  setFont: (f: FontName) => void;
  textSize: TextSizeName;
  setTextSize: (s: TextSizeName) => void;
  lineSpacing: LineSpacingName;
  setLineSpacing: (l: LineSpacingName) => void;
}

export function Settings({
  theme, setTheme,
  font, setFont,
  textSize, setTextSize,
  lineSpacing, setLineSpacing,
}: SettingsProps) {
  return (
    <div className={styles.settings}>
      <div className={styles.row}>
        <span className={styles.label}>Theme</span>
        <div className={styles.swatchRow}>
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
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Font</span>
        <div className={styles.btnGroup}>
          {FONTS.map((f) => (
            <button
              key={f.name}
              className={`${styles.btn} ${font === f.name ? styles.btnActive : ""}`}
              onClick={() => setFont(f.name)}
              aria-pressed={font === f.name}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Size</span>
        <div className={styles.btnGroup}>
          {(["small", "medium", "large"] as TextSizeName[]).map((s, i) => (
            <button
              key={s}
              className={`${styles.btn} ${textSize === s ? styles.btnActive : ""}`}
              onClick={() => setTextSize(s)}
              aria-pressed={textSize === s}
            >
              {["S", "M", "L"][i]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Spacing</span>
        <div className={styles.btnGroup}>
          {(["compact", "normal", "relaxed"] as LineSpacingName[]).map((l) => (
            <button
              key={l}
              className={`${styles.btn} ${lineSpacing === l ? styles.btnActive : ""}`}
              onClick={() => setLineSpacing(l)}
              aria-pressed={lineSpacing === l}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
