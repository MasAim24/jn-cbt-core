import {
  ExamPacket,
  ExamSchedule,
  ExamSubmission,
  SchoolSettings,
  Student,
  Teacher,
} from '../types/cbt';

export interface SqliteServerStatus {
  ok: boolean;
  engine: string;
  dbPath: string;
  sizeBytes: number;
  sizeKb: number;
  counts: {
    packets: number;
    questions: number;
    schedules: number;
    students: number;
    teachers: number;
    submissions: number;
    settings: number;
  };
  hasInitialData: boolean;
  timestamp: string;
}

export interface SqliteLoadedState {
  ok: boolean;
  empty?: boolean;
  settings?: SchoolSettings | null;
  packets?: ExamPacket[];
  schedules?: ExamSchedule[];
  students?: Student[];
  teachers?: Teacher[];
  submissions?: ExamSubmission[];
}

export interface SqliteSavePayload {
  settings?: SchoolSettings;
  packets?: ExamPacket[];
  schedules?: ExamSchedule[];
  students?: Student[];
  teachers?: Teacher[];
  submissions?: ExamSubmission[];
}

let sqliteServerAvailable: boolean | null = null;

export function isLocalSqliteHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h.endsWith('github.io') || h.endsWith('.online') || h.endsWith('.vercel.app') || h.endsWith('.netlify.app')) {
    return false;
  }
  if (sqliteServerAvailable === false) return false;
  return true;
}

export async function fetchSqliteStatus(): Promise<SqliteServerStatus | null> {
  if (!isLocalSqliteHost()) return null;
  try {
    const res = await fetch('/api/cbt/status');
    if (!res.ok) {
      sqliteServerAvailable = false;
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      sqliteServerAvailable = false;
      return null;
    }
    const data = (await res.json()) as SqliteServerStatus;
    sqliteServerAvailable = Boolean(data.ok);
    return data.ok ? data : null;
  } catch {
    sqliteServerAvailable = false;
    return null;
  }
}

export async function loadStateFromSqlite(): Promise<SqliteLoadedState | null> {
  if (!isLocalSqliteHost()) return null;
  try {
    const res = await fetch('/api/cbt/state');
    if (!res.ok) {
      sqliteServerAvailable = false;
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      sqliteServerAvailable = false;
      return null;
    }
    const data = (await res.json()) as SqliteLoadedState;
    sqliteServerAvailable = Boolean(data.ok);
    return data.ok ? data : null;
  } catch {
    sqliteServerAvailable = false;
    return null;
  }
}

export async function saveStateToSqlite(
  payload: SqliteSavePayload
): Promise<SqliteServerStatus | null> {
  if (!isLocalSqliteHost()) return null;
  try {
    const res = await fetch('/api/cbt/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SqliteServerStatus;
    return data.ok ? data : null;
  } catch {
    return null;
  }
}
