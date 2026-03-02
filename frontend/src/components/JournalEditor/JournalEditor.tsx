"use client";

import { AudioSegment } from "@/types/journal";
import styles from "./JournalEditor.module.css";

interface JournalEditorProps {
  text: string;
  audioSegments: AudioSegment[];
  sessionStartedAt: string | null;
  onTextChange: (text: string) => void;
  onSave: () => void;
  onClear: () => void;
  isSaving: boolean;
  isFormatting: boolean;
  error: string | null;
}

export function JournalEditor({
  text,
  audioSegments,
  sessionStartedAt,
  onTextChange,
  onSave,
  onClear,
  isSaving,
  isFormatting,
  error,
}: JournalEditorProps) {
  const isEmpty = text.trim() === "";

  const formattedDate = sessionStartedAt
    ? new Date(sessionStartedAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={styles.container}>
      {formattedDate && (
        <p className={styles.timestamp}>
          {formattedDate} · {audioSegments.length} segment{audioSegments.length !== 1 ? "s" : ""}
        </p>
      )}
      {isFormatting && <p className={styles.formatting}>Formatting…</p>}
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Record your voice or type here…"
      />
      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={onSave}
          disabled={isEmpty || isSaving}
        >
          {isSaving ? "Saving…" : "Save Entry"}
        </button>
        <button
          className={styles.clearButton}
          onClick={onClear}
          disabled={isEmpty && audioSegments.length === 0}
        >
          Clear
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
