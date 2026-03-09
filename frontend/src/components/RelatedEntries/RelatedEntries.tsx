"use client";

import { useState, useEffect } from "react";
import styles from "./RelatedEntries.module.css";

interface RelatedEntry {
  id: string;
  text: string;
  createdAt: string;
  score: number;
}

interface RelatedEntriesProps {
  entryId: string;
  onSelect: (id: string) => void;
}

export function RelatedEntries({ entryId, onSelect }: RelatedEntriesProps) {
  const [entries, setEntries] = useState<RelatedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setEntries([]);
    fetch(`/api/analyze/similar?entryId=${encodeURIComponent(entryId)}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [entryId]);

  if (loading) return null;
  if (entries.length === 0) return null;

  function firstSentence(text: string): string {
    const end = text.search(/[.!?]/);
    return end > 0 ? text.slice(0, end + 1) : text.slice(0, 90) + (text.length > 90 ? "…" : "");
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.label}>You also wrote about this…</div>
      <ul className={styles.list}>
        {entries.map((e) => (
          <li key={e.id} className={styles.item} onClick={() => onSelect(e.id)}>
            <span className={styles.date}>{formatDate(e.createdAt)}</span>
            <span className={styles.text}>{firstSentence(e.text)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
