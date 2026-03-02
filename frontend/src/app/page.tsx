"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder/VoiceRecorder";
import { JournalEditor } from "@/components/JournalEditor/JournalEditor";
import { EntryList } from "@/components/EntryList/EntryList";
import { useJournalStorage } from "@/hooks/useJournalStorage";
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

export default function Home() {
  const [editableText, setEditableText] = useState("");
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { entries, saveEntry, deleteEntry, error: storageError } = useJournalStorage();

  // Always-current ref for editableText — lets callbacks read current value without
  // being recreated on every keystroke.
  const editableTextRef = useRef(editableText);
  useEffect(() => {
    editableTextRef.current = editableText;
  });

  // Text that was in the editor when the current recording session started.
  // Stored in a ref so handleLiveTranscriptChange doesn't need editableText as a dep.
  const baseTextRef = useRef("");

  // Called synchronously when the user clicks the mic (before getUserMedia).
  const handleRecordingStart = useCallback(() => {
    baseTextRef.current = editableTextRef.current;
  }, []);

  // Called whenever the speech recognition produces new finalized text.
  // Merges the session delta with whatever was in the editor before this session.
  const handleLiveTranscriptChange = useCallback((sessionText: string) => {
    const base = baseTextRef.current;
    setEditableText(base && sessionText ? base + "\n\n" + sessionText : base || sessionText);
  }, []);

  // Called when the MediaRecorder stops — formats text via Gemini and processes audio.
  const handleSegmentRecorded = useCallback(
    async (sessionText: string, audioBlob: Blob) => {
      // Format text via Gemini Lambda (fire in parallel with audio processing)
      const formatPromise = (async () => {
        if (!sessionText.trim()) return;
        setIsFormatting(true);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/format-text`,
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
          // Silently fall back — raw text already set by handleLiveTranscriptChange
        } finally {
          setIsFormatting(false);
        }
      })();

      // Audio processing
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

  const handleSave = useCallback(() => {
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

      const success = saveEntry(entry);
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Voice Journal</h1>
          <p>Record your thoughts, review your entries.</p>
        </header>

        <VoiceRecorder
          onSegmentRecorded={handleSegmentRecorded}
          onLiveTranscriptChange={handleLiveTranscriptChange}
          onRecordingStart={handleRecordingStart}
        />

        <JournalEditor
          text={editableText}
          audioSegments={audioSegments}
          sessionStartedAt={sessionStartedAt}
          onTextChange={setEditableText}
          onSave={handleSave}
          onClear={handleClear}
          isSaving={isSaving}
          isFormatting={isFormatting}
          error={saveError}
        />

        <hr className={styles.divider} />

        <EntryList entries={entries} onDelete={deleteEntry} />
      </div>
    </div>
  );
}
