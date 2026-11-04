import {
  ExamPacket,
  ExamSchedule,
  ExamSubmission,
  LiveParticipant,
  SchoolSettings,
  Student,
  Teacher,
} from '../types/cbt';
import { LiveSyncMessage } from './liveProctorSync';

export interface SupabaseCloudConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseCloudStatus {
  ok: boolean;
  connected: boolean;
  projectUrl: string;
  updatedAt?: string;
  error?: string;
  counts?: {
    packets: number;
    schedules: number;
    students: number;
    teachers: number;
    submissions: number;
  };
}

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- JN ExamCBTCore — Skema Database Cloud Supabase (PostgreSQL)
-- Kapasitas Tinggi (600+ Santri Serentak) dengan Atomic Row-Level Upsert
-- Cara Pakai: Salin seluruh isi teks ini ke menu "SQL Editor" di Supabase
--             lalu klik tombol "Run".
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cbt_app_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  packets_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  schedules_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  students_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  teachers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cbt_submissions (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  nomor_peserta TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbt_submissions_packet ON public.cbt_submissions(packet_id);
CREATE INDEX IF NOT EXISTS idx_cbt_submissions_student ON public.cbt_submissions(student_id);

CREATE TABLE IF NOT EXISTS public.cbt_live_participants (
  schedule_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  nomor_peserta TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'MENGERJAKAN',
  payload_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (schedule_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_cbt_live_participants_schedule ON public.cbt_live_participants(schedule_id);

CREATE TABLE IF NOT EXISTS public.cbt_live_events (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbt_live_events_ts ON public.cbt_live_events(timestamp);

ALTER TABLE public.cbt_app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_live_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_live_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cbt_app_state_all" ON public.cbt_app_state;
CREATE POLICY "cbt_app_state_all" ON public.cbt_app_state
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cbt_submissions_all" ON public.cbt_submissions;
CREATE POLICY "cbt_submissions_all" ON public.cbt_submissions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cbt_live_participants_all" ON public.cbt_live_participants;
CREATE POLICY "cbt_live_participants_all" ON public.cbt_live_participants
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cbt_live_events_all" ON public.cbt_live_events;
CREATE POLICY "cbt_live_events_all" ON public.cbt_live_events
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/+$/, '');
}

const DEFAULT_CLOUD_SUPABASE_URL = 'https://zlxzgmtiufzjnqebkuih.supabase.co';
const DEFAULT_CLOUD_SUPABASE_ANON_KEY = 'sb_publishable_Oc_bXVJ8qDzhubprij59pw_BHXJ7Y8Z';

/**
 * Resolves Supabase URL & Anon Key from:
 * 1. Explicit SchoolSettings passed in
 * 2. Build-time environment variables (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)
 * 3. Saved localStorage SchoolSettings ('jn_cbt_settings_v3')
 * 4. Built-in Pondok Pesantren Jabal Nur Cloud Supabase project defaults
 */
export function getSupabaseConfig(settings?: SchoolSettings): SupabaseCloudConfig | null {
  const envUrl = normalizeSupabaseUrl(
    ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) ||
      DEFAULT_CLOUD_SUPABASE_URL
  );
  const envKey = (
    ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    DEFAULT_CLOUD_SUPABASE_ANON_KEY
  ).trim();

  if (settings?.supabaseUrl && settings?.supabaseAnonKey) {
    return {
      url: normalizeSupabaseUrl(settings.supabaseUrl),
      anonKey: settings.supabaseAnonKey.trim(),
    };
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('jn_cbt_settings_v3') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      const first: SchoolSettings | undefined = Array.isArray(parsed) ? parsed[0] : parsed;
      if (first?.supabaseUrl && first?.supabaseAnonKey) {
        return {
          url: normalizeSupabaseUrl(first.supabaseUrl),
          anonKey: first.supabaseAnonKey.trim(),
        };
      }
    }
  } catch {
    // Ignore localStorage parse error
  }

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return null;
}

function buildHeaders(anonKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  retries = 3,
  delayMs = 600
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function checkSupabaseConnection(
  customUrl?: string,
  customAnonKey?: string
): Promise<SupabaseCloudStatus> {
  const cfg =
    customUrl && customAnonKey
      ? { url: normalizeSupabaseUrl(customUrl), anonKey: customAnonKey.trim() }
      : getSupabaseConfig();

  if (!cfg || !cfg.url || !cfg.anonKey) {
    return {
      ok: false,
      connected: false,
      projectUrl: '',
      error: 'URL atau Anon Key Supabase belum diisi.',
    };
  }

  try {
    const stateRes = await fetch(
      `${cfg.url}/rest/v1/cbt_app_state?id=eq.1&select=id,updated_at,packets_json,schedules_json,students_json,teachers_json`,
      { headers: buildHeaders(cfg.anonKey) }
    );
    if (!stateRes.ok) {
      const errText = await stateRes.text();
      return {
        ok: false,
        connected: false,
        projectUrl: cfg.url,
        error:
          stateRes.status === 404 || errText.includes('cbt_app_state')
            ? 'Tabel belum dibuat di Supabase. Klik "Salin Skema SQL Supabase" lalu jalankan di SQL Editor Supabase.'
            : `HTTP ${stateRes.status}: ${errText.slice(0, 120)}`,
      };
    }

    const rows = await stateRes.json();
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    const subRes = await fetch(`${cfg.url}/rest/v1/cbt_submissions?select=id`, {
      headers: buildHeaders(cfg.anonKey),
    });
    const subRows = subRes.ok ? await subRes.json() : [];

    const legacyDummyPackets = new Set([
      'pkt-mts-01',
      'pkt-ma-01',
      'pkt-wustho-01',
      'pkt-ulya-01',
    ]);
    const legacyDummySchedules = new Set(['sch-01', 'sch-02', 'sch-03', 'sch-04']);
    const legacyDummyTeachers = new Set(['tch-1', 'tch-2', 'tch-3', 'tch-4']);
    const cleanPacketsCount = Array.isArray(row?.packets_json)
      ? row.packets_json.filter((p: any) => !legacyDummyPackets.has(p?.id)).length
      : 0;
    const cleanSchedulesCount = Array.isArray(row?.schedules_json)
      ? row.schedules_json.filter((s: any) => !legacyDummySchedules.has(s?.id)).length
      : 0;
    const cleanTeachersCount = Array.isArray(row?.teachers_json)
      ? row.teachers_json.filter((t: any) => !legacyDummyTeachers.has(t?.id)).length
      : 0;

    return {
      ok: true,
      connected: true,
      projectUrl: cfg.url,
      updatedAt: row?.updated_at,
      counts: {
        packets: cleanPacketsCount,
        schedules: cleanSchedulesCount,
        students: Array.isArray(row?.students_json) ? row.students_json.length : 0,
        teachers: cleanTeachersCount,
        submissions: Array.isArray(subRows) ? subRows.length : 0,
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      connected: false,
      projectUrl: cfg.url,
      error: err?.message || 'Gagal menghubungi server Supabase.',
    };
  }
}

export async function loadStateFromSupabase(cfg?: SupabaseCloudConfig | null): Promise<{
  ok: boolean;
  empty: boolean;
  settings?: SchoolSettings;
  packets: ExamPacket[];
  schedules: ExamSchedule[];
  students: Student[];
  teachers: Teacher[];
  submissions: ExamSubmission[];
} | null> {
  const activeCfg = cfg || getSupabaseConfig();
  if (!activeCfg) return null;

  try {
    const [stateRes, lpRes, subRes] = await Promise.all([
      fetch(`${activeCfg.url}/rest/v1/cbt_app_state?id=eq.1&select=*`, {
        headers: buildHeaders(activeCfg.anonKey),
      }),
      fetch(`${activeCfg.url}/rest/v1/cbt_live_participants?select=*`, {
        headers: buildHeaders(activeCfg.anonKey),
      }),
      fetch(`${activeCfg.url}/rest/v1/cbt_submissions?select=*&order=updated_at.desc`, {
        headers: buildHeaders(activeCfg.anonKey),
      }),
    ]);

    if (!stateRes.ok) return null;
    const stateRows = await stateRes.json();
    if (!Array.isArray(stateRows) || stateRows.length === 0) {
      return {
        ok: true,
        empty: true,
        packets: [],
        schedules: [],
        students: [],
        teachers: [],
        submissions: [],
      };
    }

    const master = stateRows[0];
    const lpRows = lpRes.ok ? await lpRes.json() : [];
    const subRows = subRes.ok ? await subRes.json() : [];

    const bySchedule = new Map<string, LiveParticipant[]>();
    if (Array.isArray(lpRows)) {
      for (const r of lpRows) {
        const schId = r.schedule_id as string;
        const p = r.payload_json as LiveParticipant;
        if (!schId || !p) continue;
        const list = bySchedule.get(schId) || [];
        list.push(p);
        bySchedule.set(schId, list);
      }
    }

    const rawSchedules: ExamSchedule[] = Array.isArray(master.schedules_json)
      ? master.schedules_json
      : [];
    const mergedSchedules: ExamSchedule[] = rawSchedules.map((sch) => {
      const cloudParticipants = bySchedule.get(sch.id);
      if (!cloudParticipants || cloudParticipants.length === 0) return sch;
      const mergedMap = new Map<string, LiveParticipant>();
      for (const existing of sch.liveParticipants || []) {
        mergedMap.set(existing.studentId || existing.nomorPeserta, existing);
      }
      for (const cp of cloudParticipants) {
        mergedMap.set(cp.studentId || cp.nomorPeserta, cp);
      }
      const list = Array.from(mergedMap.values());
      const selesaiCount = list.filter((p) => p.status === 'SELESAI').length;
      const hadirCount = list.filter((p) => p.status !== 'BELUM_LOGIN').length;
      return {
        ...sch,
        liveParticipants: list,
        selesaiCount,
        hadirCount: Math.max(sch.hadirCount || 0, hadirCount),
      };
    });

    const submissions: ExamSubmission[] = Array.isArray(subRows)
      ? subRows
          .map((r: any) => r.payload_json as ExamSubmission)
          .filter((s): s is ExamSubmission => Boolean(s && s.id))
      : [];

    const loadedSettings = master.settings_json as SchoolSettings | undefined;
    if (loadedSettings && (!loadedSettings.supabaseUrl || !loadedSettings.supabaseAnonKey)) {
      loadedSettings.supabaseUrl = activeCfg.url;
      loadedSettings.supabaseAnonKey = activeCfg.anonKey;
      loadedSettings.syncMode = 'SUPABASE_HYBRID';
    }

    const legacyDummyPackets = new Set([
      'pkt-mts-01',
      'pkt-ma-01',
      'pkt-wustho-01',
      'pkt-ulya-01',
    ]);
    const legacyDummySchedules = new Set(['sch-01', 'sch-02', 'sch-03', 'sch-04']);
    const legacyDummyStudents = new Set([
      'std-mts-1',
      'std-mts-2',
      'std-mts-3',
      'std-ma-1',
      'std-ma-2',
      'std-wst-1',
      'std-wst-2',
      'std-uly-1',
      'std-uly-2',
      'std-imp-1793664205470-0',
      'std-imp-1793664205470-1',
      'std-imp-1793664205470-2',
    ]);
    const legacyDummyTeachers = new Set(['tch-1', 'tch-2', 'tch-3', 'tch-4']);
    const cleanPackets = Array.isArray(master.packets_json)
      ? (master.packets_json as ExamPacket[]).filter((p) => !legacyDummyPackets.has(p.id))
      : [];
    const cleanSchedules = mergedSchedules.filter((s) => !legacyDummySchedules.has(s.id));
    const cleanStudents = Array.isArray(master.students_json)
      ? (master.students_json as Student[]).filter((s) => !legacyDummyStudents.has(s.id))
      : [];
    const cleanTeachers = Array.isArray(master.teachers_json)
      ? (master.teachers_json as Teacher[]).filter((t) => !legacyDummyTeachers.has(t.id))
      : [];

    return {
      ok: true,
      empty: false,
      settings: loadedSettings,
      packets: cleanPackets,
      schedules: cleanSchedules,
      students: cleanStudents,
      teachers: cleanTeachers,
      submissions,
    };
  } catch {
    return null;
  }
}

const PENDING_PATCHES_KEY = 'jn_cbt_pending_cloud_patches_v1';

export interface MasterColumnsPatch {
  settings_json?: SchoolSettings;
  packets_json?: ExamPacket[];
  schedules_json?: ExamSchedule[];
  students_json?: Student[];
  teachers_json?: Teacher[];
}

export function getPendingCloudPatches(): MasterColumnsPatch {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(PENDING_PATCHES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MasterColumnsPatch;
  } catch {
    return {};
  }
}

function setPendingCloudPatches(next: MasterColumnsPatch): void {
  try {
    if (typeof window === 'undefined') return;
    if (Object.keys(next).length === 0) {
      localStorage.removeItem(PENDING_PATCHES_KEY);
    } else {
      localStorage.setItem(PENDING_PATCHES_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Immediately patches ONLY the modified column(s) in `cbt_app_state` (id = 1)
 * and persists a durable pending-patch journal in `localStorage` so even an
 * instant page refresh (`F5`) never loses unsynced teacher/student/packet/schedule changes.
 */
export async function patchMasterColumnInSupabase(
  columns: MasterColumnsPatch,
  customCfg?: SupabaseCloudConfig | null
): Promise<boolean> {
  const normalizedColumns: MasterColumnsPatch = { ...columns };
  const cfg = customCfg || getSupabaseConfig(columns.settings_json);
  if (normalizedColumns.settings_json && cfg) {
    normalizedColumns.settings_json = {
      ...normalizedColumns.settings_json,
      supabaseUrl: cfg.url,
      supabaseAnonKey: cfg.anonKey,
      syncMode: 'SUPABASE_HYBRID',
    };
  }

  // Record in durable pending journal synchronously before network call
  const snapshotBefore = { ...getPendingCloudPatches(), ...normalizedColumns };
  setPendingCloudPatches(snapshotBefore);

  if (!cfg) return false;

  try {
    const nowIso = new Date().toISOString();
    const patchBody = {
      ...normalizedColumns,
      updated_at: nowIso,
    };

    const res = await fetchWithRetry(
      `${cfg.url}/rest/v1/cbt_app_state?id=eq.1`,
      {
        method: 'PATCH',
        headers: buildHeaders(cfg.anonKey, {
          Prefer: 'return=representation',
        }),
        body: JSON.stringify(patchBody),
      },
      3
    );

    if (!res.ok) return false;

    const updatedRows = await res.json().catch(() => []);
    if (Array.isArray(updatedRows) && updatedRows.length === 0) {
      // Row id=1 does not exist yet; insert with defaults + patched columns
      const insertRes = await fetchWithRetry(
        `${cfg.url}/rest/v1/cbt_app_state?on_conflict=id`,
        {
          method: 'POST',
          headers: buildHeaders(cfg.anonKey, {
            Prefer: 'resolution=merge-duplicates,return=minimal',
          }),
          body: JSON.stringify({
            id: 1,
            ...patchBody,
          }),
        },
        2
      );
      if (!insertRes.ok) return false;
    }

    if (
      Array.isArray(normalizedColumns.schedules_json) &&
      normalizedColumns.schedules_json.length === 0
    ) {
      await fetch(`${cfg.url}/rest/v1/cbt_live_participants?schedule_id=neq.__none__`, {
        method: 'DELETE',
        headers: buildHeaders(cfg.anonKey),
      }).catch(() => {});
    }

    // Clear only the keys whose values still match what we just flushed
    const latestPending = getPendingCloudPatches();
    for (const key of Object.keys(normalizedColumns) as (keyof MasterColumnsPatch)[]) {
      if (
        JSON.stringify(latestPending[key]) === JSON.stringify(normalizedColumns[key])
      ) {
        delete latestPending[key];
      }
    }
    setPendingCloudPatches(latestPending);

    return true;
  } catch {
    return false;
  }
}

export async function upsertSubmissionToSupabase(sub: ExamSubmission): Promise<boolean> {
  const cfg = getSupabaseConfig();
  if (!cfg || !sub || !sub.id) return false;
  try {
    const nowIso = new Date().toISOString();
    const res = await fetchWithRetry(
      `${cfg.url}/rest/v1/cbt_submissions?on_conflict=id`,
      {
        method: 'POST',
        headers: buildHeaders(cfg.anonKey, {
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify({
          id: sub.id,
          schedule_id: sub.scheduleId || '',
          packet_id: sub.packetId || '',
          student_id: sub.studentId || '',
          nomor_peserta: sub.nomorPeserta || '',
          payload_json: sub,
          updated_at: nowIso,
        }),
      },
      2
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveMasterStateToSupabase(
  payload: {
    settings: SchoolSettings;
    packets: ExamPacket[];
    schedules: ExamSchedule[];
    students: Student[];
    teachers: Teacher[];
    submissions?: ExamSubmission[];
  },
  customCfg?: SupabaseCloudConfig | null
): Promise<boolean> {
  const cfg = customCfg || getSupabaseConfig(payload.settings);
  if (!cfg) return false;

  try {
    const nowIso = new Date().toISOString();
    const stateBody = {
      id: 1,
      settings_json: {
        ...payload.settings,
        supabaseUrl: cfg.url,
        supabaseAnonKey: cfg.anonKey,
        syncMode: 'SUPABASE_HYBRID',
      },
      packets_json: payload.packets,
      schedules_json: payload.schedules,
      students_json: payload.students,
      teachers_json: payload.teachers,
      updated_at: nowIso,
    };

    const res = await fetchWithRetry(
      `${cfg.url}/rest/v1/cbt_app_state?on_conflict=id`,
      {
        method: 'POST',
        headers: buildHeaders(cfg.anonKey, {
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(stateBody),
      },
      2
    );

    if (!res.ok) return false;

    if (payload.schedules.length === 0) {
      await fetch(`${cfg.url}/rest/v1/cbt_live_participants?schedule_id=neq.__none__`, {
        method: 'DELETE',
        headers: buildHeaders(cfg.anonKey),
      });
    }

    // Also upsert any graded or existing submissions without deleting concurrent ones
    if (Array.isArray(payload.submissions) && payload.submissions.length > 0) {
      const subRows = payload.submissions.map((sub) => ({
        id: sub.id,
        schedule_id: sub.scheduleId || '',
        packet_id: sub.packetId || '',
        student_id: sub.studentId || '',
        nomor_peserta: sub.nomorPeserta || '',
        payload_json: sub,
        updated_at: nowIso,
      }));
      await fetch(`${cfg.url}/rest/v1/cbt_submissions?on_conflict=id`, {
        method: 'POST',
        headers: buildHeaders(cfg.anonKey, {
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(subRows),
      });
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Atomic Row-Level Upsert for 600+ Concurrent Students on Supabase Cloud.
 * Ensures zero race conditions when hundreds of students submit at the same second.
 */
export async function pushAtomicEventToSupabase(message: LiveSyncMessage): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  const nowIso = new Date().toISOString();

  try {
    if (message.type === 'STUDENT_PROGRESS' || message.type === 'STUDENT_SUBMITTED') {
      const lp = message.participant;
      const schId = message.scheduleId || message.packetId || 'default-schedule';
      if (lp && lp.studentId) {
        await fetchWithRetry(
          `${cfg.url}/rest/v1/cbt_live_participants?on_conflict=schedule_id,student_id`,
          {
            method: 'POST',
            headers: buildHeaders(cfg.anonKey, {
              Prefer: 'resolution=merge-duplicates,return=minimal',
            }),
            body: JSON.stringify({
              schedule_id: schId,
              student_id: lp.studentId,
              nomor_peserta: lp.nomorPeserta || '',
              status: lp.status || 'MENGERJAKAN',
              payload_json: lp,
              updated_at: nowIso,
            }),
          },
          message.type === 'STUDENT_SUBMITTED' ? 3 : 1
        );
      }
    }

    if (message.type === 'STUDENT_SUBMITTED' && message.submission) {
      const sub = message.submission;
      await fetchWithRetry(
        `${cfg.url}/rest/v1/cbt_submissions?on_conflict=id`,
        {
          method: 'POST',
          headers: buildHeaders(cfg.anonKey, {
            Prefer: 'resolution=merge-duplicates,return=minimal',
          }),
          body: JSON.stringify({
            id: sub.id,
            schedule_id: sub.scheduleId || message.scheduleId || '',
            packet_id: sub.packetId || message.packetId || '',
            student_id: sub.studentId || '',
            nomor_peserta: sub.nomorPeserta || '',
            payload_json: sub,
            updated_at: nowIso,
          }),
        },
        3
      );
    }

    if (message.type === 'PROCTOR_ACTION' && message.action === 'RESET_SUBMIT') {
      if (message.studentId) {
        await fetch(
          `${cfg.url}/rest/v1/cbt_submissions?student_id=eq.${encodeURIComponent(
            message.studentId
          )}&packet_id=eq.${encodeURIComponent(message.packetId)}`,
          {
            method: 'DELETE',
            headers: buildHeaders(cfg.anonKey),
          }
        );
      }
      if (message.nomorPeserta) {
        await fetch(
          `${cfg.url}/rest/v1/cbt_submissions?nomor_peserta=eq.${encodeURIComponent(
            message.nomorPeserta
          )}&packet_id=eq.${encodeURIComponent(message.packetId)}`,
          {
            method: 'DELETE',
            headers: buildHeaders(cfg.anonKey),
          }
        );
      }
    }

    // Push proctor actions, broadcasts, and final submissions to cbt_live_events bus
    if (
      message.type === 'PROCTOR_ACTION' ||
      message.type === 'PROCTOR_BULK_ACTION' ||
      message.type === 'PROCTOR_BROADCAST' ||
      message.type === 'STUDENT_SUBMITTED'
    ) {
      await fetch(`${cfg.url}/rest/v1/cbt_live_events`, {
        method: 'POST',
        headers: buildHeaders(cfg.anonKey, { Prefer: 'return=minimal' }),
        body: JSON.stringify({
          timestamp: message.timestamp || Date.now(),
          payload_json: message,
        }),
      });
    }
  } catch {
    // Ignore transient network errors on background sync
  }
}

export async function deleteScheduleFromSupabase(scheduleId: string): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg || !scheduleId) return;
  try {
    await fetch(
      `${cfg.url}/rest/v1/cbt_live_participants?schedule_id=eq.${encodeURIComponent(scheduleId)}`,
      {
        method: 'DELETE',
        headers: buildHeaders(cfg.anonKey),
      }
    );
  } catch {
    // ignore
  }
}

export async function deleteStudentFromSupabase(studentId: string): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg || !studentId) return;
  try {
    await Promise.all([
      fetch(
        `${cfg.url}/rest/v1/cbt_live_participants?student_id=eq.${encodeURIComponent(studentId)}`,
        {
          method: 'DELETE',
          headers: buildHeaders(cfg.anonKey),
        }
      ),
      fetch(`${cfg.url}/rest/v1/cbt_submissions?student_id=eq.${encodeURIComponent(studentId)}`, {
        method: 'DELETE',
        headers: buildHeaders(cfg.anonKey),
      }),
    ]);
  } catch {
    // ignore
  }
}

export async function deleteSubmissionFromSupabase(submissionId: string): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg || !submissionId) return;
  try {
    await fetch(`${cfg.url}/rest/v1/cbt_submissions?id=eq.${encodeURIComponent(submissionId)}`, {
      method: 'DELETE',
      headers: buildHeaders(cfg.anonKey),
    });
  } catch {
    // ignore
  }
}

export async function pollEventsFromSupabase(sinceTs: number): Promise<LiveSyncMessage[]> {
  const cfg = getSupabaseConfig();
  if (!cfg) return [];

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/cbt_live_events?timestamp=gt.${sinceTs}&order=id.asc&limit=100`,
      { headers: buildHeaders(cfg.anonKey) }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .map((r: any) => r.payload_json as LiveSyncMessage)
      .filter((m): m is LiveSyncMessage => Boolean(m && m.type));
  } catch {
    return [];
  }
}
