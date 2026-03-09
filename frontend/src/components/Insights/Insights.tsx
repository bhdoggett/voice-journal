"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./Insights.module.css";

interface Theme {
  theme: string;
  count: number;
  exampleEntryIds: string[];
}

interface InsightsProps {
  onThemeSelect?: (entryIds: string[]) => void;
  onEntrySelect?: (id: string) => void;
}

export function Insights({ onEntrySelect }: InsightsProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themesOpen, setThemesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [digest, setDigest] = useState<string | null>(null);
  const [isDigesting, setIsDigesting] = useState(false);
  const [digestPeriod, setDigestPeriod] = useState<"week" | "month">("month");

  useEffect(() => {
    fetch("/api/analyze/themes")
      .then((r) => r.json())
      .then((data) => setThemes(data.themes ?? []))
      .catch(console.error);
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch("/api/analyze/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSearchResults(data.entries ?? []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleDigest = useCallback(async () => {
    setIsDigesting(true);
    setDigest(null);
    try {
      const res = await fetch("/api/analyze/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: digestPeriod }),
      });
      const data = await res.json();
      setDigest(data.digest ?? "");
    } catch (err) {
      console.error("Digest failed:", err);
    } finally {
      setIsDigesting(false);
    }
  }, [digestPeriod]);

  function firstSentence(text: string): string {
    const end = text.search(/[.!?]/);
    return end > 0 ? text.slice(0, end + 1) : text.slice(0, 80) + (text.length > 80 ? "…" : "");
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className={styles.insights}>
      {/* Themes */}
      <div className={styles.block}>
        <button className={styles.blockToggle} onClick={() => setThemesOpen((o) => !o)}>
          <span className={styles.blockLabel}>Themes</span>
          <span className={`${styles.chevron} ${themesOpen ? styles.chevronOpen : ""}`}>›</span>
        </button>
        {themesOpen && (
          themes.length === 0 ? (
            <p className={styles.empty}>No themes yet — save a few entries first.</p>
          ) : (
            <ul className={styles.themeList}>
              {themes.slice(0, 8).map((t) => (
                <li key={t.theme} className={styles.themeItem}>
                  <span className={styles.themeName}>{t.theme}</span>
                  <span className={styles.themeCount}>{t.count}</span>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {/* Semantic search */}
      <div className={styles.block}>
        <div className={styles.blockLabel}>Semantic Search</div>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by meaning…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn} disabled={isSearching}>
            {isSearching ? "…" : "Go"}
          </button>
        </form>
        {searchResults.length > 0 && (
          <ul className={styles.resultList}>
            {searchResults.map((r) => (
              <li
                key={r.id}
                className={styles.resultItem}
                onClick={() => onEntrySelect?.(r.id)}
              >
                <span className={styles.resultDate}>{formatDate(r.createdAt)}</span>
                <span className={styles.resultText}>{firstSentence(r.text)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Monthly digest */}
      <div className={styles.block}>
        <div className={styles.blockLabel}>Reflection</div>
        <div className={styles.digestControls}>
          <select
            className={styles.periodSelect}
            value={digestPeriod}
            onChange={(e) => setDigestPeriod(e.target.value as "week" | "month")}
          >
            <option value="week">Past week</option>
            <option value="month">Past month</option>
          </select>
          <button
            className={styles.digestBtn}
            onClick={handleDigest}
            disabled={isDigesting}
          >
            {isDigesting ? "Reflecting…" : "Reflect"}
          </button>
        </div>
        {digest && (
          <p className={styles.digestText}>{digest}</p>
        )}
      </div>
    </div>
  );
}
