"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Web Speech API — SpeechRecognitionAlternative/Result/ResultList are in lib.dom.d.ts
// but SpeechRecognition and SpeechRecognitionEvent are not yet in the standard lib.
declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedRef = useRef("");
  // True when the user wants the mic on; used to auto-restart after silence gaps
  const shouldBeListeningRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;

    if (!SpeechRecognitionCtor) return;

    setIsSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true; // Don't stop on silence
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let sessionFinal = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          sessionFinal += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (sessionFinal) {
        accumulatedRef.current += sessionFinal;
        setTranscript(accumulatedRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      setInterimTranscript("");
      if (shouldBeListeningRef.current) {
        // Browser ended recognition (e.g. brief network hiccup, tab focus change).
        // Restart silently so the user never notices a gap.
        try {
          recognition.start();
        } catch {
          // If start fails the mic is genuinely unavailable — give up.
          shouldBeListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setInterimTranscript("");
      // On error, let onend handle restart logic (onerror is always followed by onend).
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      recognition.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldBeListeningRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already running — ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    // Clear flag BEFORE calling stop() so onend doesn't restart.
    shouldBeListeningRef.current = false;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
