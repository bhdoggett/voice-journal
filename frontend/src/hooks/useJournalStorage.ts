"use client";

import { useState, useEffect } from "react";
import { JournalEntry, JournalEntryUpdate } from "@/types/journal";

const STORAGE_KEY = "voice-journal-entries";

function readFromStorage(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(entries: JournalEntry[]): string | null {
  if (typeof window === "undefined") return null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      return "Storage quota exceeded. Delete some entries to free up space.";
    }
    return "Failed to save entry.";
  }
}

export function useJournalStorage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEntries(readFromStorage());
  }, []);

  function saveEntry(entry: JournalEntry): boolean {
    let writeError: string | null = null;
    setEntries((prev) => {
      const next = [entry, ...prev];
      writeError = writeToStorage(next);
      if (writeError) return prev;
      return next;
    });
    if (writeError) {
      setError(writeError);
      return false;
    }
    setError(null);
    return true;
  }

  function deleteEntry(id: string): void {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeToStorage(next);
      return next;
    });
  }

  function updateEntry(id: string, updates: JournalEntryUpdate): void {
    setEntries((prev) => {
      const next = prev.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      );
      writeToStorage(next);
      return next;
    });
  }

  return { entries, saveEntry, deleteEntry, updateEntry, error, setError };
}
