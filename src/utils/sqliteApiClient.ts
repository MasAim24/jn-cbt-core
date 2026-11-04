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

export async function fetchSqliteStatus(): Promise<SqliteServerStatus | null> {
  try {
    const res = await fetch('/api/cbt/status');
    if (!res.ok) return null;
    const data = (await res.json()) as SqliteServerStatus;
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

export async function loadStateFromSqlite(): Promise<SqliteLoadedState | null> {
  try {
    const res = await fetch('/api/cbt/state');
    if (!res.ok) return null;
    const data = (await res.json()) as SqliteLoadedState;
    return data.ok ? data : null;
  } catch {
    return null;
  }
}

export async function saveStateToSqlite(
  payload: SqliteSavePayload
): Promise<SqliteServerStatus | null> {
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
