"use client";

import { useState, useEffect } from "react";
import { JournalEntry, JournalEntryUpdate } from "@/types/journal";

type DbRow = { id: string; text: string; createdAt: string; updatedAt: string };

function rowToEntry(row: DbRow): JournalEntry {
  return { ...row, audioSegments: [] };
}

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/journals")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(({ entries: rows }: { entries: DbRow[] }) => setEntries(rows.map(rowToEntry)))
      .catch(() => {}); // unauthenticated or network error — stay empty
  }, []);

  async function saveEntry(entry: JournalEntry): Promise<boolean> {
    const optimistic = [entry, ...entries];
    setEntries(optimistic);
    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          text: entry.text,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }),
      });
      if (!res.ok) throw new Error();
      setError(null);
      return true;
    } catch {
      setEntries(entries);
      setError("Failed to save entry.");
      return false;
    }
  }

  function deleteEntry(id: string): void {
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    fetch(`/api/journals/${id}`, { method: "DELETE" }).then((res) => {
      if (!res.ok) setEntries(previous);
    });
  }

  function updateEntry(id: string, updates: JournalEntryUpdate): void {
    const previous = entries;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      )
    );
    fetch(`/api/journals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: updates.text }),
    }).then((res) => {
      if (!res.ok) setEntries(previous);
    });
  }

  async function seedEntries(newEntries: JournalEntry[]): Promise<void> {
    await fetch("/api/journals/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: newEntries.map((e) => ({
          id: e.id,
          text: e.text,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        })),
      }),
    });
    const res = await fetch("/api/journals");
    if (res.ok) {
      const { entries: rows }: { entries: DbRow[] } = await res.json();
      setEntries(rows.map(rowToEntry));
    }
  }

  return { entries, saveEntry, deleteEntry, updateEntry, seedEntries, error, setError };
}
