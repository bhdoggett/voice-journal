"use client";

import { useState } from "react";
import { EntryList } from "@/components/EntryList/EntryList";
import { ThemePicker } from "@/components/ThemePicker/ThemePicker";
import { AuthNav } from "@/components/AuthNav/AuthNav";
import { JournalEntry } from "@/types/journal";
import { ThemeName } from "@/hooks/useTheme";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  entries: JournalEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewEntry: () => void;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

export function Sidebar({
  entries,
  selectedId,
  onSelect,
  onDelete,
  onNewEntry,
  theme,
  setTheme,
}: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [entriesOpen, setEntriesOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

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

        <section className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => setEntriesOpen((o) => !o)}
          >
            <span>Entries</span>
            <span className={`${styles.chevron} ${entriesOpen ? styles.chevronOpen : ""}`}>›</span>
          </button>
          {entriesOpen && (
            <div className={styles.sectionBody}>
              <EntryList
                entries={entries}
                onDelete={onDelete}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          )}
        </section>

        <section className={styles.sectionSettings}>
          <button
            className={styles.sectionHeader}
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <span>Settings</span>
            <span className={`${styles.chevron} ${settingsOpen ? styles.chevronOpen : ""}`}>›</span>
          </button>
          {settingsOpen && (
            <div className={styles.sectionBody}>
              <ThemePicker theme={theme} setTheme={setTheme} />
            </div>
          )}
        </section>

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
