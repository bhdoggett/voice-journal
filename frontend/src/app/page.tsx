"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder/VoiceRecorder";
import { JournalEditor } from "@/components/JournalEditor/JournalEditor";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { RelatedEntries } from "@/components/RelatedEntries/RelatedEntries";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useTheme } from "@/hooks/useTheme";
import { useFont } from "@/hooks/useFont";
import { useTextSize } from "@/hooks/useTextSize";
import { useLineSpacing } from "@/hooks/useLineSpacing";
import { AudioSegment } from "@/types/journal";
import styles from "./page.module.css";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatPageDate(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

export default function Home() {
  const [editableText, setEditableText] = useState("");
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const { entries, saveEntry, deleteEntry, error: storageError } = useJournalEntries();
  const { theme, setTheme } = useTheme();
  const { font, setFont } = useFont();
  const { textSize, setTextSize } = useTextSize();
  const { lineSpacing, setLineSpacing } = useLineSpacing();

  const editableTextRef = useRef(editableText);
  useEffect(() => {
    editableTextRef.current = editableText;
  });

  const baseTextRef = useRef("");

  const handleRecordingStart = useCallback(() => {
    baseTextRef.current = editableTextRef.current;
    setIsRecording(true);
  }, []);

  const handleLiveTranscriptChange = useCallback((sessionText: string) => {
    const base = baseTextRef.current;
    setEditableText(base && sessionText ? base + "\n\n" + sessionText : base || sessionText);
  }, []);

  const handleSegmentRecorded = useCallback(
    async (sessionText: string, audioBlob: Blob) => {
      setIsRecording(false);

      const formatPromise = (async () => {
        if (!sessionText.trim()) return;
        setIsFormatting(true);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/format-text-nlp`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: sessionText }),
            }
          );
          if (res.ok) {
            const { formattedText } = await res.json();
            const base = baseTextRef.current;
            setEditableText(
              base && formattedText ? base + "\n\n" + formattedText : base || formattedText
            );
          }
        } catch (err) {
          console.error("Failed to format text:", err);
        } finally {
          setIsFormatting(false);
        }
      })();

      try {
        const [audioData] = await Promise.all([blobToBase64(audioBlob), formatPromise]);
        const now = new Date().toISOString();
        const segment: AudioSegment = {
          id: crypto.randomUUID(),
          timestamp: now,
          audioData,
          mimeType: audioBlob.type,
        };
        setAudioSegments((prev) => [...prev, segment]);
        setSessionStartedAt((prev) => prev ?? now);
      } catch (err) {
        console.error("Failed to process audio segment:", err);
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!editableText.trim()) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const now = new Date().toISOString();
      const entry = {
        id: crypto.randomUUID(),
        createdAt: sessionStartedAt ?? now,
        updatedAt: now,
        text: editableText.trim(),
        audioSegments,
      };

      const success = await saveEntry(entry);
      if (success) {
        setEditableText("");
        setAudioSegments([]);
        setSessionStartedAt(null);
      } else {
        setSaveError(storageError ?? "Failed to save entry.");
      }
    } catch {
      setSaveError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }, [editableText, audioSegments, sessionStartedAt, saveEntry, storageError]);

  const handleClear = useCallback(() => {
    setEditableText("");
    setAudioSegments([]);
    setSessionStartedAt(null);
    setSaveError(null);
  }, []);

  const viewedEntry = selectedEntryId
    ? entries.find((e) => e.id === selectedEntryId) ?? null
    : null;

  const pageDate = viewedEntry
    ? formatPageDate(viewedEntry.createdAt)
    : formatPageDate(sessionStartedAt);

  const totalEntries = entries.length;

  // entries are sorted newest-first, so chronological position = totalEntries - index
  const pageNumber = viewedEntry
    ? totalEntries - entries.findIndex((e) => e.id === viewedEntry.id)
    : totalEntries + 1;

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <Sidebar
        entries={entries}
        selectedId={selectedEntryId}
        onSelect={setSelectedEntryId}
        onDelete={deleteEntry}
        onNewEntry={() => setSelectedEntryId(null)}
        onInsightEntrySelect={setSelectedEntryId}
        theme={theme}
        setTheme={setTheme}
        font={font}
        setFont={setFont}
        textSize={textSize}
        setTextSize={setTextSize}
        lineSpacing={lineSpacing}
        setLineSpacing={setLineSpacing}
      />

      {/* Journal area */}
      <main className={styles.journalArea}>
        <div className={styles.journalPage}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <span className={styles.pageDate}>{pageDate}</span>
            {!viewedEntry && (
              <VoiceRecorder
                onSegmentRecorded={handleSegmentRecorded}
                onLiveTranscriptChange={handleLiveTranscriptChange}
                onRecordingStart={handleRecordingStart}
              />
            )}
            {viewedEntry && (
              <span className={styles.pageDate}>{formatPageDate(viewedEntry.createdAt)}</span>
            )}
          </div>

          {/* Body: editor or read-only view */}
          {viewedEntry ? (
            <>
              <div className={styles.readOnlyBody}>
                <div className={styles.readOnlyText}>{viewedEntry.text}</div>
              </div>
              <div className={styles.readOnlyFooter} />
              <RelatedEntries
                entryId={viewedEntry.id}
                onSelect={setSelectedEntryId}
              />
            </>
          ) : (
            <JournalEditor
              text={editableText}
              audioSegments={audioSegments}
              isRecording={isRecording}
              onTextChange={setEditableText}
              onSave={handleSave}
              onClear={handleClear}
              isSaving={isSaving}
              isFormatting={isFormatting}
              error={saveError}
            />
          )}

          {/* Page footer */}
          <div className={styles.pageFooter}>
            <span className={styles.pageNumber}>{pageNumber}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
