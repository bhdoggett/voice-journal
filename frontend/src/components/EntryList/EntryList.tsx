"use client";

import { useState } from "react";
import { JournalEntry } from "@/types/journal";
import styles from "./EntryList.module.css";

interface EntryListProps {
  entries: JournalEntry[];
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const preview = entry.text.length > 150 ? entry.text.slice(0, 150) + "…" : entry.text;
  const needsExpand = entry.text.length > 150 || entry.audioSegments.length > 0;

  function handleDelete() {
    if (window.confirm("Delete this journal entry? This cannot be undone.")) {
      onDelete(entry.id);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.meta}>
          <span className={styles.date}>{formatDate(entry.createdAt)}</span>
          {entry.audioSegments.length > 0 && (
            <span className={styles.audioBadge}>
              {entry.audioSegments.length} audio segment{entry.audioSegments.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className={styles.cardActions}>
          {needsExpand && (
            <button
              className={styles.expandButton}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          )}
          <button className={styles.deleteButton} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <p className={styles.fullText}>{entry.text}</p>
          {entry.audioSegments.length > 0 && (
            <div className={styles.audioSection}>
              <span className={styles.audioLabel}>Audio Recordings</span>
              {entry.audioSegments.map((seg) => (
                <div key={seg.id} className={styles.audioItem}>
                  <span className={styles.audioTime}>{formatDate(seg.timestamp)}</span>
                  <audio
                    className={styles.audioPlayer}
                    controls
                    src={seg.audioData}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className={styles.preview}>{preview}</p>
      )}
    </div>
  );
}

export function EntryList({ entries, onDelete }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>No entries yet. Record your first journal entry above.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Past Entries ({entries.length})</h2>
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
      ))}
    </div>
  );
}
