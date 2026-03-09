"use client";

import { useState } from "react";
import { EntryList } from "@/components/EntryList/EntryList";
import { Settings } from "@/components/Settings/Settings";
import { Insights } from "@/components/Insights/Insights";
import { AuthNav } from "@/components/AuthNav/AuthNav";
import { JournalEntry } from "@/types/journal";
import { ThemeName } from "@/hooks/useTheme";
import { FontName } from "@/hooks/useFont";
import { TextSizeName } from "@/hooks/useTextSize";
import { LineSpacingName } from "@/hooks/useLineSpacing";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  entries: JournalEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewEntry: () => void;
  onInsightEntrySelect?: (id: string) => void;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  font: FontName;
  setFont: (f: FontName) => void;
  textSize: TextSizeName;
  setTextSize: (s: TextSizeName) => void;
  lineSpacing: LineSpacingName;
  setLineSpacing: (l: LineSpacingName) => void;
}

export function Sidebar({
  entries,
  selectedId,
  onSelect,
  onDelete,
  onNewEntry,
  onInsightEntrySelect,
  theme,
  setTheme,
  font,
  setFont,
  textSize,
  setTextSize,
  lineSpacing,
  setLineSpacing,
}: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [entriesOpen, setEntriesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [insightsOpen, setInsightsOpen] = useState(true);

  return (
    <>
      <aside className={`${styles.sidebar} ${sidebarOpen ? "" : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <span>Voice Journal</span>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse sidebar"
          >
            ‹
          </button>
        </div>

        <button className={styles.newEntryBtn} onClick={onNewEntry}>
          New Entry
        </button>

        <div className={styles.sidebarBody}>
          <section className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => setEntriesOpen((o) => !o)}
            >
              <span>Entries</span>
              <span className={`${styles.chevron} ${entriesOpen ? styles.chevronOpen : ""}`}>›</span>
            </button>
            {entriesOpen && (
              <div className={styles.entriesBody}>
                <EntryList
                  entries={entries}
                  onDelete={onDelete}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              </div>
            )}
          </section>

          <section className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => setSettingsOpen((o) => !o)}
            >
              <span>Settings</span>
              <span className={`${styles.chevron} ${settingsOpen ? styles.chevronOpen : ""}`}>›</span>
            </button>
            {settingsOpen && (
              <div className={styles.sectionBody}>
                <Settings
                  theme={theme} setTheme={setTheme}
                  font={font} setFont={setFont}
                  textSize={textSize} setTextSize={setTextSize}
                  lineSpacing={lineSpacing} setLineSpacing={setLineSpacing}
                />
              </div>
            )}
          </section>

          <section className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => setInsightsOpen((o) => !o)}
            >
              <span>Insights</span>
              <span className={`${styles.chevron} ${insightsOpen ? styles.chevronOpen : ""}`}>›</span>
            </button>
            {insightsOpen && (
              <div className={styles.sectionBody}>
                <Insights onEntrySelect={onInsightEntrySelect} />
              </div>
            )}
          </section>
        </div>

        <div className={styles.authNavWrapper}>
          <AuthNav />
        </div>
      </aside>

      {!sidebarOpen && (
        <button
          className={styles.sidebarTab}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          ›
        </button>
      )}
    </>
  );
}
