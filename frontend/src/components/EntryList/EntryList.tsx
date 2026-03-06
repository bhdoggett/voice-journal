"use client";

import { JournalEntry } from "@/types/journal";
import styles from "./EntryList.module.css";

interface EntryListProps {
  entries: JournalEntry[];
  onDelete: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function groupByDate(entries: JournalEntry[]): Array<{ label: string; items: JournalEntry[] }> {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const groups: Map<string, JournalEntry[]> = new Map();
  for (const entry of sorted) {
    const label = new Date(entry.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function EntryRow({
  entry,
  selected,
  onSelect,
  onDelete,
}: {
  entry: JournalEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const preview = entry.text.length > 60 ? entry.text.slice(0, 60) + "…" : entry.text;
  const hasAudio = entry.audioSegments.length > 0;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm("Delete this entry?")) onDelete(entry.id);
  }

  return (
    <div
      className={`${styles.row} ${selected ? styles.rowSelected : ""}`}
      onClick={() => onSelect(entry.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(entry.id)}
    >
      <span className={styles.rowPreview}>
        {hasAudio && <span className={styles.audioDot}>•</span>}
        {preview}
      </span>
      <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Delete entry">
        ×
      </button>
    </div>
  );
}

export function EntryList({ entries, onDelete, selectedId, onSelect }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <span>No entries yet</span>
      </div>
    );
  }

  const groups = groupByDate(entries);

  return (
    <div className={styles.list}>
      {groups.map(({ label, items }) => (
        <div key={label}>
          <div className={styles.dateLabel}>{label}</div>
          {items.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              selected={selectedId === entry.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
