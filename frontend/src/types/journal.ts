export interface AudioSegment {
  id: string;
  timestamp: string; // ISO 8601
  audioData: string; // base64 data URL
  mimeType: string;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  text: string;
  audioSegments: AudioSegment[];
}

export type JournalEntryUpdate = Partial<Pick<JournalEntry, "text" | "audioSegments" | "updatedAt">>;
