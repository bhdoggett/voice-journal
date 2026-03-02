"use client";

import { useRef, useCallback, useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import styles from "./VoiceRecorder.module.css";

const PREFERRED_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getBestMimeType(): string {
  if (typeof window === "undefined") return "";
  return PREFERRED_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

interface VoiceRecorderProps {
  onSegmentRecorded: (sessionText: string, audioBlob: Blob) => void;
  /** Called whenever finalized speech text changes during a recording session. */
  onLiveTranscriptChange?: (sessionText: string) => void;
  /** Called synchronously when the user clicks to start recording. */
  onRecordingStart?: () => void;
}

export function VoiceRecorder({
  onSegmentRecorded,
  onLiveTranscriptChange,
  onRecordingStart,
}: VoiceRecorderProps) {
  const { isSupported, isListening, transcript, interimTranscript, startListening, stopListening } =
    useSpeechRecognition();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptSnapshotRef = useRef("");
  const isRecordingRef = useRef(false);

  // Always-current transcript ref — fixes the stale closure in recorder.onstop
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  });

  // Notify parent of live transcript changes while a session is active
  useEffect(() => {
    if (!isRecordingRef.current) return;
    const sessionText = transcript.slice(transcriptSnapshotRef.current.length).trim();
    onLiveTranscriptChange?.(sessionText);
  }, [transcript, onLiveTranscriptChange]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) return;
    isRecordingRef.current = false;
    stopListening();
    mediaRecorderRef.current.stop();
  }, [stopListening]);

  const startRecording = useCallback(async () => {
    // Notify parent synchronously (before the async getUserMedia call) so it
    // can snapshot editableText before any state updates.
    onRecordingStart?.();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getBestMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        // Use the ref — NOT the closure variable — to get the up-to-date transcript.
        const sessionText = transcriptRef.current
          .slice(transcriptSnapshotRef.current.length)
          .trim();
        onSegmentRecorded(sessionText, blob);

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      // Snapshot current transcript so we can compute the session delta later.
      transcriptSnapshotRef.current = transcriptRef.current;
      isRecordingRef.current = true;

      recorder.start();
      mediaRecorderRef.current = recorder;
      startListening();
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [onRecordingStart, onSegmentRecorded, startListening]);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, stopRecording, startRecording]);

  if (!isSupported) {
    return (
      <div className={styles.container}>
        <p className={styles.unsupported}>
          Speech recognition is not supported in this browser. Try Chrome or Edge for the best
          experience.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={`${styles.micButton} ${isListening ? styles.recording : ""}`}
        onClick={handleClick}
        aria-label={isListening ? "Stop recording" : "Start recording"}
        title={isListening ? "Stop recording" : "Start recording"}
      >
        {isListening ? "⏹" : "🎙"}
      </button>
      <span className={styles.label}>
        {isListening ? "Recording… click to stop" : "Click to record"}
      </span>
      {interimTranscript && (
        <p className={styles.interim}>{interimTranscript}</p>
      )}
    </div>
  );
}
