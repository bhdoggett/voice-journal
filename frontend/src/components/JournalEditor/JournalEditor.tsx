"use client";

import { AudioSegment } from "@/types/journal";
import styles from "./JournalEditor.module.css";

interface JournalEditorProps {
  text: string;
  audioSegments: AudioSegment[];
  isRecording: boolean;
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
  onTextChange,
  onSave,
  onClear,
  isSaving,
  isFormatting,
  error,
}: JournalEditorProps) {
  const isEmpty = text.trim() === "";

  return (
    <>
      <div className={styles.body}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Begin writing…"
        />
      </div>
      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          <button
            className={styles.saveButton}
            onClick={onSave}
            disabled={isEmpty || isSaving}
          >
            {isSaving ? "saving…" : "save"}
          </button>
          <button
            className={styles.clearButton}
            onClick={onClear}
            disabled={isEmpty && audioSegments.length === 0}
          >
            discard
          </button>
        </div>
        <div className={styles.actionsRight}>
          {isFormatting && (
            <span className={`${styles.formattingDot}`} title="Formatting…" />
          )}
          {error && <span className={styles.error}>{error}</span>}
          {audioSegments.length > 0 && (
            <span className={styles.segmentCount}>{audioSegments.length}</span>
          )}
        </div>
      </div>
    </>
  );
}
