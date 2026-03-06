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

function MicSvg({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Capsule body */}
      <rect x="9" y="2" width="6" height="12" rx="3" />
      {/* Stand arc */}
      <path d="M5 10a7 7 0 0 0 14 0" />
      {/* Stem */}
      <line x1="12" y1="17" x2="12" y2="21" />
      {/* Base */}
      <line x1="8" y1="21" x2="16" y2="21" />
      {active && <circle cx="19" cy="5" r="3" fill="#ef4444" stroke="none" />}
    </svg>
  );
}

interface VoiceRecorderProps {
  onSegmentRecorded: (sessionText: string, audioBlob: Blob) => void;
  onLiveTranscriptChange?: (sessionText: string) => void;
  onRecordingStart?: () => void;
  className?: string;
}

export function VoiceRecorder({
  onSegmentRecorded,
  onLiveTranscriptChange,
  onRecordingStart,
  className,
}: VoiceRecorderProps) {
  const { isSupported, isListening, transcript, startListening, stopListening } =
    useSpeechRecognition();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptSnapshotRef = useRef("");
  const isRecordingRef = useRef(false);

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  });

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
        const sessionText = transcriptRef.current
          .slice(transcriptSnapshotRef.current.length)
          .trim();
        onSegmentRecorded(sessionText, blob);

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

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
      <span className={styles.unsupportedInline} title="Speech recognition not supported">
        ✕ mic
      </span>
    );
  }

  return (
    <button
      className={`${styles.micButton} ${isListening ? styles.recording : ""} ${className ?? ""}`}
      onClick={handleClick}
      aria-label={isListening ? "Stop recording" : "Start recording"}
      title={isListening ? "Stop recording" : "Start recording"}
    >
      <MicSvg active={isListening} />
    </button>
  );
}
