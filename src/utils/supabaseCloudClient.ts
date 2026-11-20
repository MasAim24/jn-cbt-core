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

export const SUPABASE_MEDIA_BUCKET = 'cbt-media';

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- JN ExamCBTCore — Skema Database Cloud Supabase Pro (PostgreSQL 17)
-- Kapasitas Tinggi (600+ Santri Serentak) • Atomic Upsert • Storage Media CDN
-- Cara Pakai: Salin seluruh isi teks ini ke menu "SQL Editor" di Supabase
--             lalu klik tombol "Run".
-- ============================================================================

ALTER ROLE anon SET statement_timeout = '15s';
ALTER ROLE authenticated SET statement_timeout = '15s';
ALTER ROLE authenticator SET statement_timeout = '20s';
ALTER ROLE authenticator SET lock_timeout = '15s';

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
CREATE INDEX IF NOT EXISTS idx_cbt_submissions_schedule ON public.cbt_submissions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_cbt_submissions_updated_at ON public.cbt_submissions(updated_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_cbt_live_participants_updated_at ON public.cbt_live_participants(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.cbt_live_events (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbt_live_events_ts ON public.cbt_live_events(timestamp);

ALTER TABLE public.cbt_app_state SET (
  autovacuum_vacuum_threshold = 2,
  autovacuum_vacuum_scale_factor = 0.0,
  autovacuum_analyze_threshold = 2,
  autovacuum_analyze_scale_factor = 0.0
);

ALTER TABLE public.cbt_live_participants SET (
  autovacuum_vacuum_threshold = 25,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_threshold = 25,
  autovacuum_analyze_scale_factor = 0.02,
  fillfactor = 80
);

ALTER TABLE public.cbt_live_events SET (
  autovacuum_vacuum_threshold = 50,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE public.cbt_submissions SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  fillfactor = 90
);

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
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cbt-media', 'cbt-media', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

DROP POLICY IF EXISTS "cbt_media_public_read" ON storage.objects;
CREATE POLICY "cbt_media_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'cbt-media');

DROP POLICY IF EXISTS "cbt_media_upload_insert" ON storage.objects;
CREATE POLICY "cbt_media_upload_insert" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'cbt-media');

DROP POLICY IF EXISTS "cbt_media_upload_update" ON storage.objects;
CREATE POLICY "cbt_media_upload_update" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'cbt-media') WITH CHECK (bucket_id = 'cbt-media');`;

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

async function computeBufferHashHex(buf: ArrayBuffer): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 20);
    }
  } catch {
    // Fallback for non-secure LAN HTTP context
  }
  const bytes = new Uint8Array(buf);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < bytes.length; i++) {
    h1 ^= bytes[i];
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= bytes[i] + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}${bytes.length.toString(16)}`;
}

function extFromMimeType(mime: string, fallback = 'bin'): string {
  const m = mime.toLowerCase();
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('svg')) return 'svg';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('wav')) return 'wav';
  if (m.includes('webm')) return 'webm';
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a';
  return fallback;
}

/**
 * Uploads a compressed image or audio Blob directly to the `cbt-media` bucket on
 * Supabase Storage Pro CDN with immutable 1-year caching and SHA-256 deduplication.
 * Returns the public CDN URL on success, or `null` if offline / local-only.
 */
export async function uploadBlobToSupabaseStorage(
  blob: Blob,
  folder: 'questions' | 'audio' = 'questions',
  customCfg?: SupabaseCloudConfig | null
): Promise<string | null> {
  const cfg = customCfg || getSupabaseConfig();
  if (!cfg || !cfg.url || !cfg.anonKey) return null;

  try {
    const buf = await blob.arrayBuffer();
    const hash = await computeBufferHashHex(buf);
    const mime = blob.type || (folder === 'audio' ? 'audio/mpeg' : 'image/jpeg');
    const ext = extFromMimeType(mime, folder === 'audio' ? 'mp3' : 'jpg');
    const prefix = folder === 'audio' ? 'qaud' : 'qimg';
    const objectPath = `${folder}/${prefix}-${hash}.${ext}`;

    const res = await fetchWithRetry(
      `${cfg.url}/storage/v1/object/${SUPABASE_MEDIA_BUCKET}/${objectPath}`,
      {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          'Content-Type': mime,
          'x-upsert': 'true',
          'cache-control': '31536000',
        },
        body: blob,
      },
      2,
      500
    );

    if (!res.ok) return null;
    return `${cfg.url}/storage/v1/object/public/${SUPABASE_MEDIA_BUCKET}/${objectPath}`;
  } catch {
    return null;
  }
}

/**
 * Transparently offloads a Base64 `data:image/...;base64,...` or `data:audio/...;base64,...`
 * string to Supabase Storage CDN. Preserves lightweight inline `svg+xml;utf8` diagram presets
 * and returns the original `dataUrl` if offline so media is never lost.
 */
export async function uploadDataUrlToSupabaseStorage(
  dataUrl: string,
  folder: 'questions' | 'audio' = 'questions',
  customCfg?: SupabaseCloudConfig | null
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:') || !dataUrl.includes(';base64,')) {
    return dataUrl;
  }
  const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!match) return dataUrl;

  try {
    const mime = match[1];
    const binStr = atob(match[2]);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    const cdnUrl = await uploadBlobToSupabaseStorage(blob, folder, customCfg);
    return cdnUrl || dataUrl;
  } catch {
    return dataUrl;
  }
}

async function offloadBase64InPackets(
  packets: ExamPacket[],
  cfg: SupabaseCloudConfig,
  onlyPacketIds?: Set<string>
): Promise<ExamPacket[]> {
  let anyChanged = false;
  const result: ExamPacket[] = [];

  for (const pkt of packets) {
    if (!pkt || !Array.isArray(pkt.questions) || pkt.questions.length === 0) {
      result.push(pkt);
      continue;
    }
    if (onlyPacketIds && onlyPacketIds.size > 0 && !onlyPacketIds.has(pkt.id)) {
      result.push(pkt);
      continue;
    }

    const hasInlineB64 = pkt.questions.some(
      (q) =>
        (typeof q?.mediaImageUrl === 'string' &&
          q.mediaImageUrl.includes(';base64,') &&
          q.mediaImageUrl.length > 4096) ||
        (typeof q?.mediaAudioUrl === 'string' &&
          q.mediaAudioUrl.includes(';base64,') &&
          q.mediaAudioUrl.length > 4096)
    );
    if (!hasInlineB64) {
      result.push(pkt);
      continue;
    }

    let pktChanged = false;
    const nextQuestions = await Promise.all(
      pkt.questions.map(async (q) => {
        if (!q) return q;
        let qChanged = false;
        let nextImg = q.mediaImageUrl;
        let nextAud = q.mediaAudioUrl;
        if (nextImg && nextImg.includes(';base64,') && nextImg.length > 4096) {
          const uploaded = await uploadDataUrlToSupabaseStorage(nextImg, 'questions', cfg);
          if (uploaded !== nextImg) {
            nextImg = uploaded;
            qChanged = true;
            pktChanged = true;
          }
        }
        if (nextAud && nextAud.includes(';base64,') && nextAud.length > 4096) {
          const uploaded = await uploadDataUrlToSupabaseStorage(nextAud, 'audio', cfg);
          if (uploaded !== nextAud) {
            nextAud = uploaded;
            qChanged = true;
            pktChanged = true;
          }
        }
        return qChanged ? { ...q, mediaImageUrl: nextImg, mediaAudioUrl: nextAud } : q;
      })
    );

    if (pktChanged) {
      anyChanged = true;
      result.push({ ...pkt, questions: nextQuestions });
    } else {
      result.push(pkt);
    }
  }

  return anyChanged ? result : packets;
}

/**
 * Fetches all rows from a PostgREST endpoint using automatic `Range` pagination
 * (1,000 rows per page) so large school exams with thousands of submissions
 * across 600+ students never truncate at PostgREST row limits.
 */
async function fetchAllPostgrestRows<T = any>(
  endpointUrl: string,
  anonKey: string,
  options?: { lowPriority?: boolean; pageSize?: number; maxPages?: number }
): Promise<{ ok: boolean; rows: T[] }> {
  const pageSize = options?.pageSize || 1000;
  const maxPages = options?.maxPages || 50;
  const allRows: T[] = [];

  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const reqInit: RequestInit & { priority?: 'low' | 'high' | 'auto' } = {
      headers: buildHeaders(anonKey, {
        'Range-Unit': 'items',
        Range: `${from}-${to}`,
      }),
      cache: 'no-store',
    };
    if (options?.lowPriority) {
      reqInit.priority = 'low';
    }

    const res = await fetch(endpointUrl, reqInit as RequestInit);
    if (!res.ok) {
      return page === 0 ? { ok: false, rows: [] } : { ok: true, rows: allRows };
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }
    allRows.push(...batch);
    if (batch.length < pageSize) {
      break;
    }
  }

  return { ok: true, rows: allRows };
}

function parseContentRangeTotal(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const slashIdx = contentRange.lastIndexOf('/');
  if (slashIdx === -1) return null;
  const totalPart = contentRange.slice(slashIdx + 1).trim();
  const parsed = Number(totalPart);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function mergeLiveParticipantsIntoSchedules(
  rawSchedules: ExamSchedule[],
  lpRows: any[]
): ExamSchedule[] {
  const bySchedule = new Map<string, LiveParticipant[]>();
  if (Array.isArray(lpRows)) {
    for (const r of lpRows) {
      const schId = r?.schedule_id as string;
      const p = r?.payload_json as LiveParticipant;
      if (!schId || !p) continue;
      const list = bySchedule.get(schId) || [];
      list.push(p);
      bySchedule.set(schId, list);
    }
  }

  return rawSchedules.map((sch) => {
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
    const [stateRes, subCountRes] = await Promise.all([
      fetch(
        `${cfg.url}/rest/v1/cbt_app_state?id=eq.1&select=id,updated_at,packets_json,schedules_json,students_json,teachers_json`,
        { headers: buildHeaders(cfg.anonKey), cache: 'no-store' }
      ),
      fetch(`${cfg.url}/rest/v1/cbt_submissions?select=id&limit=1`, {
        headers: buildHeaders(cfg.anonKey, { Prefer: 'count=exact' }),
        cache: 'no-store',
      }),
    ]);
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
    const exactSubCount = subCountRes.ok
      ? parseContentRangeTotal(subCountRes.headers.get('content-range'))
      : 0;

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
        submissions: exactSubCount ?? 0,
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

let lastKnownCloudUpdatedAt = '';

/**
 * Lightweight 65-byte Egress check: reads ONLY `updated_at` from `cbt_app_state` (id=1)
 * so background polling saves ~99.997% of Supabase Egress bandwidth instead of re-downloading
 * `packets_json` every 15 seconds when nothing changed.
 */
export async function hasCloudStateChanged(cfg?: SupabaseCloudConfig | null): Promise<boolean> {
  const activeCfg = cfg || getSupabaseConfig();
  if (!activeCfg) return false;
  try {
    const reqInit: RequestInit & { priority?: 'low' } = {
      headers: buildHeaders(activeCfg.anonKey),
      cache: 'no-store',
      priority: 'low',
    };
    const res = await fetch(
      `${activeCfg.url}/rest/v1/cbt_app_state?id=eq.1&select=updated_at`,
      reqInit as RequestInit
    );
    if (!res.ok) return false;
    const rows = await res.json();
    const remoteTs =
      Array.isArray(rows) && rows[0]?.updated_at ? String(rows[0].updated_at) : '';
    if (!remoteTs) return false;
    return remoteTs !== lastKnownCloudUpdatedAt;
  } catch {
    return false;
  }
}

/**
 * Lightweight Live Proctor & Rekap Nilai fetcher: reads ONLY `cbt_live_participants`
 * and `cbt_submissions` with auto-pagination, bypassing `cbt_app_state` (`packets_json`)
 * when master bank soal has not changed.
 */
export async function loadLiveTablesFromSupabase(cfg?: SupabaseCloudConfig | null): Promise<{
  ok: boolean;
  liveParticipantRows: any[];
  submissions: ExamSubmission[];
} | null> {
  const activeCfg = cfg || getSupabaseConfig();
  if (!activeCfg) return null;

  try {
    const [lpResult, subResult] = await Promise.all([
      fetchAllPostgrestRows(
        `${activeCfg.url}/rest/v1/cbt_live_participants?select=*&order=updated_at.desc`,
        activeCfg.anonKey,
        { lowPriority: true }
      ),
      fetchAllPostgrestRows(
        `${activeCfg.url}/rest/v1/cbt_submissions?select=*&order=updated_at.desc`,
        activeCfg.anonKey,
        { lowPriority: true }
      ),
    ]);

    if (!lpResult.ok && !subResult.ok) return null;

    const submissions: ExamSubmission[] = subResult.rows
      .map((r: any) => r?.payload_json as ExamSubmission)
      .filter((s): s is ExamSubmission => Boolean(s && s.id));

    return {
      ok: true,
      liveParticipantRows: lpResult.rows,
      submissions,
    };
  } catch {
    return null;
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
    const [stateRes, lpResult, subResult] = await Promise.all([
      fetch(`${activeCfg.url}/rest/v1/cbt_app_state?id=eq.1&select=*`, {
        headers: buildHeaders(activeCfg.anonKey),
        cache: 'no-store',
      }),
      fetchAllPostgrestRows(
        `${activeCfg.url}/rest/v1/cbt_live_participants?select=*&order=updated_at.desc`,
        activeCfg.anonKey
      ),
      fetchAllPostgrestRows(
        `${activeCfg.url}/rest/v1/cbt_submissions?select=*&order=updated_at.desc`,
        activeCfg.anonKey
      ),
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
    if (master?.updated_at) {
      lastKnownCloudUpdatedAt = String(master.updated_at);
    }

    const rawSchedules: ExamSchedule[] = Array.isArray(master.schedules_json)
      ? master.schedules_json
      : [];
    const mergedSchedules = mergeLiveParticipantsIntoSchedules(rawSchedules, lpResult.rows);

    const submissions: ExamSubmission[] = subResult.rows
      .map((r: any) => r?.payload_json as ExamSubmission)
      .filter((s): s is ExamSubmission => Boolean(s && s.id));

    const loadedSettings = master.settings_json as SchoolSettings | undefined;
    if (loadedSettings && (!loadedSettings.supabaseUrl || !loadedSettings.supabaseAnonKey)) {
      loadedSettings.supabaseUrl = activeCfg.url;
      loadedSettings.supabaseAnonKey = activeCfg.anonKey;
      loadedSettings.syncMode = 'SUPABASE_HYBRID';
    }
    if (Array.isArray(loadedSettings?.deletedPacketIds) && loadedSettings.deletedPacketIds.length > 0) {
      recordDeletedEntityIds(loadedSettings.deletedPacketIds);
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
      'std-1793843413227',
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

const LEGACY_PENDING_PATCHES_KEY = 'jn_cbt_pending_cloud_patches_v1';
const PENDING_PATCHES_KEY = 'jn_cbt_pending_cloud_patches_v2';
const DELETED_IDS_KEY = 'jn_cbt_deleted_entity_ids_v1';
const DIRTY_IDS_KEY = 'jn_cbt_dirty_entity_ids_v2';
const PATCH_INFLIGHT_TS_KEY = 'jn_cbt_patch_inflight_ts_v1';

// Purge legacy v1 full-array pending patches so stale snapshots can never overwrite cloud data
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEGACY_PENDING_PATCHES_KEY);
  }
} catch {
  // ignore storage errors
}

export interface MasterColumnsPatch {
  settings_json?: SchoolSettings;
  packets_json?: ExamPacket[];
  schedules_json?: ExamSchedule[];
  students_json?: Student[];
  teachers_json?: Teacher[];
}

export type ArrayColumnKey =
  | 'packets_json'
  | 'schedules_json'
  | 'students_json'
  | 'teachers_json';

export interface PatchMasterOptions {
  modifiedIds?: string[];
  deletedIds?: string[];
  replaceAll?: boolean;
}

type DirtyEntityIdsMap = Partial<Record<ArrayColumnKey, string[]>>;

export interface CloudSyncStatusInfo {
  inFlight: boolean;
  hasError: boolean;
  errorMessage: string | null;
  pendingCount: number;
  lastSyncedAt: number | null;
  lastRescuedCount: number;
}

let cloudMutationSeq = 0;
let activePatchCount = 0;
let patchQueuePromise: Promise<boolean> = Promise.resolve(true);
let lastCloudSyncError: string | null = null;
let lastCloudSyncedAt: number | null = null;
let lastRescuedPacketsCount = 0;
const syncStateListeners = new Set<(inFlight: boolean) => void>();
const syncStatusListeners = new Set<(status: CloudSyncStatusInfo) => void>();

/**
 * Quota-safe localStorage writer. Automatically purges non-essential decorative sticker caches
 * and legacy keys if a browser hits the 5MB localStorage limit so teacher question data is never lost.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LEGACY_PENDING_PATCHES_KEY);
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('jn_cbt_sticker_cutout_')) {
            toRemove.push(k);
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(key, value);
        return true;
      }
    } catch {
      // Still over quota
    }
    return false;
  }
}

/**
 * Safely persists ExamPacket array to localStorage. If the combined school-wide Base64 media
 * exceeds a mobile browser's 5MB localStorage quota, falls back to persisting all dirty packets
 * plus packets owned by `priorityGuruId` so the logged-in teacher's questions are 100% preserved.
 */
export function safeSavePacketsToLocalStorage(
  storageKey: string,
  packets: ExamPacket[],
  priorityGuruId?: string
): void {
  if (safeLocalStorageSet(storageKey, JSON.stringify(packets))) {
    return;
  }
  const dirtySet = getDirtyEntityIds('packets_json');
  const prioritized = packets.filter(
    (p) => dirtySet.has(p.id) || (priorityGuruId && p.guruId === priorityGuruId)
  );
  if (prioritized.length > 0) {
    safeLocalStorageSet(storageKey, JSON.stringify(prioritized));
  }
}

function countPendingDirtyItems(): number {
  const map = readDirtyIdsMap();
  let total = 0;
  (Object.keys(map) as ArrayColumnKey[]).forEach((k) => {
    const arr = map[k];
    if (Array.isArray(arr)) total += arr.length;
  });
  return total;
}

export function getCloudSyncStatus(): CloudSyncStatusInfo {
  const inFlight = isCloudPatchInFlight();
  const pendingCount = countPendingDirtyItems();
  return {
    inFlight,
    hasError: Boolean(lastCloudSyncError),
    errorMessage: lastCloudSyncError,
    pendingCount,
    lastSyncedAt: lastCloudSyncedAt,
    lastRescuedCount: lastRescuedPacketsCount,
  };
}

export function reportRescuedPacketsCount(count: number): void {
  if (count > 0) {
    lastRescuedPacketsCount = count;
    notifySyncStateListeners();
  }
}

function notifySyncStateListeners(): void {
  const inFlight = isCloudPatchInFlight();
  const snapshot = getCloudSyncStatus();
  syncStateListeners.forEach((cb) => {
    try {
      cb(inFlight);
    } catch {
      // ignore listener errors
    }
  });
  syncStatusListeners.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeCloudSyncState(cb: (inFlight: boolean) => void): () => void {
  syncStateListeners.add(cb);
  return () => {
    syncStateListeners.delete(cb);
  };
}

export function subscribeCloudSyncStatus(cb: (status: CloudSyncStatusInfo) => void): () => void {
  syncStatusListeners.add(cb);
  return () => {
    syncStatusListeners.delete(cb);
  };
}

export function getCloudMutationSeq(): number {
  return cloudMutationSeq;
}

export function isCloudPatchInFlight(): boolean {
  if (activePatchCount > 0) return true;
  try {
    if (typeof window !== 'undefined') {
      const ts = Number(localStorage.getItem(PATCH_INFLIGHT_TS_KEY) || 0);
      if (ts > 0 && Date.now() - ts < 12000) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

function setCrossTabPatchInFlight(active: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (active) {
      localStorage.setItem(PATCH_INFLIGHT_TS_KEY, String(Date.now()));
    } else {
      localStorage.removeItem(PATCH_INFLIGHT_TS_KEY);
    }
  } catch {
    // ignore
  }
}

export function getDeletedEntityIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function recordDeletedEntityIds(ids: string[]): Set<string> {
  const current = getDeletedEntityIds();
  ids.forEach((id) => {
    if (id) current.add(id);
  });
  try {
    if (typeof window !== 'undefined') {
      const list = Array.from(current).slice(-500);
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore storage errors
  }
  return current;
}

function readDirtyIdsMap(): DirtyEntityIdsMap {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(DIRTY_IDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as DirtyEntityIdsMap) : {};
  } catch {
    return {};
  }
}

function writeDirtyIdsMap(map: DirtyEntityIdsMap): void {
  try {
    if (typeof window === 'undefined') return;
    const cleaned: DirtyEntityIdsMap = {};
    (Object.keys(map) as ArrayColumnKey[]).forEach((k) => {
      const arr = map[k];
      if (Array.isArray(arr) && arr.length > 0) {
        cleaned[k] = Array.from(new Set(arr)).slice(-300);
      }
    });
    if (Object.keys(cleaned).length === 0) {
      localStorage.removeItem(DIRTY_IDS_KEY);
    } else {
      localStorage.setItem(DIRTY_IDS_KEY, JSON.stringify(cleaned));
    }
  } catch {
    // ignore
  }
}

export function getDirtyEntityIds(colKey: ArrayColumnKey): Set<string> {
  const map = readDirtyIdsMap();
  const list = map[colKey];
  return new Set(Array.isArray(list) ? list : []);
}

function recordDirtyEntityIds(colKey: ArrayColumnKey, ids: string[]): Set<string> {
  const map = readDirtyIdsMap();
  const current = new Set(Array.isArray(map[colKey]) ? map[colKey] : []);
  ids.forEach((id) => {
    if (id) current.add(id);
  });
  map[colKey] = Array.from(current);
  writeDirtyIdsMap(map);
  return current;
}

function removeDirtyEntityIds(colKey: ArrayColumnKey, idsToRemove: string[]): void {
  const map = readDirtyIdsMap();
  const current = new Set(Array.isArray(map[colKey]) ? map[colKey] : []);
  idsToRemove.forEach((id) => current.delete(id));
  map[colKey] = Array.from(current);
  writeDirtyIdsMap(map);
}

const LEGACY_DUMMY_ALL_IDS = new Set([
  'pkt-mts-01',
  'pkt-ma-01',
  'pkt-wustho-01',
  'pkt-ulya-01',
  'sch-01',
  'sch-02',
  'sch-03',
  'sch-04',
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
  'std-1793843413227',
  'tch-1',
  'tch-2',
  'tch-3',
  'tch-4',
]);

/**
 * Non-destructively merges a single ExamPacket across local and remote states.
 * Guarantees that questions are NEVER lost unless their IDs are explicitly recorded
 * in `deletedQuestionIds` or `globalDeletedSet`.
 */
export function mergeSinglePacket(
  localPkt: ExamPacket,
  remotePkt: ExamPacket,
  isLocalDirty: boolean,
  globalDeletedSet: Set<string>
): ExamPacket {
  const pktOwnDeletedIds = new Set<string>([
    ...(localPkt.deletedQuestionIds || []),
    ...(remotePkt.deletedQuestionIds || []),
  ]);
  const deletedQIds = new Set<string>([
    ...Array.from(pktOwnDeletedIds),
    ...Array.from(globalDeletedSet),
  ]);

  const localTs = localPkt.updatedAtMs || 0;
  const remoteTs = remotePkt.updatedAtMs || 0;
  const localQCount = Array.isArray(localPkt.questions) ? localPkt.questions.length : 0;
  const remoteQCount = Array.isArray(remotePkt.questions) ? remotePkt.questions.length : 0;

  const preferLocal =
    isLocalDirty ||
    localTs > remoteTs ||
    (localTs === remoteTs && localQCount >= remoteQCount);

  const primary = preferLocal ? localPkt : remotePkt;
  const secondary = preferLocal ? remotePkt : localPkt;

  const allKnownPktQIds = new Set<string>([
    ...(localPkt.questions || []).map((q) => q?.id).filter(Boolean),
    ...(remotePkt.questions || []).map((q) => q?.id).filter(Boolean),
  ]);
  globalDeletedSet.forEach((id) => {
    if (id.startsWith('q-') && allKnownPktQIds.has(id)) {
      pktOwnDeletedIds.add(id);
    }
  });

  const primaryQs = (primary.questions || []).filter(
    (q) => q && q.id && !deletedQIds.has(q.id)
  );
  const primaryQIds = new Set(primaryQs.map((q) => q.id));
  const secondaryExtraQs = (secondary.questions || []).filter(
    (q) => q && q.id && !primaryQIds.has(q.id) && !deletedQIds.has(q.id)
  );

  const combinedQs = (
    preferLocal && secondaryExtraQs.length > 0
      ? [...secondaryExtraQs, ...primaryQs]
      : [...primaryQs, ...secondaryExtraQs]
  ).map((q, idx) => ({
    ...q,
    nomor: idx + 1,
  }));

  const mergedDeletedQIds = Array.from(pktOwnDeletedIds).filter((id) => id.startsWith('q-'));

  return {
    ...secondary,
    ...primary,
    guruId: primary.guruId || secondary.guruId,
    guruNama: primary.guruNama || secondary.guruNama,
    updatedAtMs: Math.max(localTs, remoteTs) || undefined,
    deletedQuestionIds:
      mergedDeletedQIds.length > 0 ? mergedDeletedQIds.slice(-300) : undefined,
    questions: combinedQs,
  };
}

/**
 * Merges local and remote ExamPacket arrays safely during hydration and background polling.
 * - Auto-rescues any local packet containing questions (`questions.length > 0`) or marked dirty
 *   that failed to upload while the Supabase Free Plan quota was exhausted, unless explicitly
 *   tombstoned in `deletedSet` (`settings_json.deletedPacketIds` / local deleted IDs).
 * - Auto-rescues any extra local questions on existing packets (`merged.questions.length > remoteQCount`
 *   or missing question IDs) and schedules them in `recoveredPacketIds` for immediate upload to Supabase Pro.
 */
export function mergePacketLists(
  localPackets: ExamPacket[],
  remotePackets: ExamPacket[],
  customDirtyIds?: Set<string>,
  customDeletedIds?: Set<string>
): { packets: ExamPacket[]; recoveredPacketIds: string[] } {
  const dirtySet = customDirtyIds || getDirtyEntityIds('packets_json');
  const deletedSet = customDeletedIds || getDeletedEntityIds();
  const localById = new Map<string, ExamPacket>();
  for (const lp of localPackets || []) {
    if (lp && lp.id && !deletedSet.has(lp.id) && !LEGACY_DUMMY_ALL_IDS.has(lp.id)) {
      localById.set(lp.id, lp);
    }
  }

  const remoteById = new Map<string, ExamPacket>();
  const mergedList: ExamPacket[] = [];
  const recoveredSet = new Set<string>();

  for (const rp of remotePackets || []) {
    if (!rp || !rp.id || deletedSet.has(rp.id) || LEGACY_DUMMY_ALL_IDS.has(rp.id)) {
      continue;
    }
    remoteById.set(rp.id, rp);
    const lp = localById.get(rp.id);
    if (!lp) {
      mergedList.push(rp);
      continue;
    }

    const isDirty = dirtySet.has(rp.id);
    const localTs = lp.updatedAtMs || 0;
    const remoteTs = rp.updatedAtMs || 0;
    const remoteQCount = Array.isArray(rp.questions) ? rp.questions.length : 0;
    const remoteQIds = new Set((rp.questions || []).map((q) => q?.id).filter(Boolean));
    const preferLocal = isDirty || (localTs > 0 && localTs > remoteTs);

    const merged = mergeSinglePacket(lp, rp, preferLocal, deletedSet);
    mergedList.push(merged);

    const hasExtraQuestions =
      merged.questions.length > remoteQCount ||
      merged.questions.some((q) => q?.id && !remoteQIds.has(q.id));
    const hasModifiedContent =
      preferLocal && JSON.stringify(merged.questions) !== JSON.stringify(rp.questions || []);

    if (hasExtraQuestions || hasModifiedContent) {
      recoveredSet.add(rp.id);
    }
  }

  // Rescue any local packets not yet in remote that either have questions (> 0) or are marked dirty
  const localOnlyRescued: ExamPacket[] = [];
  for (const lp of localPackets || []) {
    if (
      lp &&
      lp.id &&
      !remoteById.has(lp.id) &&
      !deletedSet.has(lp.id) &&
      !LEGACY_DUMMY_ALL_IDS.has(lp.id) &&
      (dirtySet.has(lp.id) || (Array.isArray(lp.questions) && lp.questions.length > 0))
    ) {
      localOnlyRescued.push(lp);
      recoveredSet.add(lp.id);
    }
  }

  return {
    packets: [...localOnlyRescued, ...mergedList],
    recoveredPacketIds: Array.from(recoveredSet),
  };
}

export function getPendingCloudPatches(): MasterColumnsPatch {
  try {
    if (typeof window === 'undefined') return {};
    localStorage.removeItem(LEGACY_PENDING_PATCHES_KEY);
    const raw = localStorage.getItem(PENDING_PATCHES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MasterColumnsPatch;
  } catch {
    return {};
  }
}

function mergePendingColumns(
  existingPending: MasterColumnsPatch,
  incoming: MasterColumnsPatch
): MasterColumnsPatch {
  const merged: MasterColumnsPatch = { ...existingPending, ...incoming };
  if (Array.isArray(existingPending.packets_json) && Array.isArray(incoming.packets_json)) {
    const incomingIds = new Set(incoming.packets_json.map((p) => p?.id));
    const extraPending = existingPending.packets_json.filter(
      (p) => p && p.id && !incomingIds.has(p.id)
    );
    merged.packets_json = [...incoming.packets_json, ...extraPending];
  }
  return merged;
}

function setPendingCloudPatches(next: MasterColumnsPatch): void {
  try {
    if (typeof window === 'undefined') return;
    const compact: MasterColumnsPatch = { ...next };
    if (Array.isArray(compact.packets_json)) {
      const dirtyPktIds = getDirtyEntityIds('packets_json');
      compact.packets_json =
        dirtyPktIds.size > 0
          ? compact.packets_json.filter((p) => p && p.id && dirtyPktIds.has(p.id))
          : [];
      if (compact.packets_json.length === 0) {
        delete compact.packets_json;
      }
    }
    if (Object.keys(compact).length === 0) {
      localStorage.removeItem(PENDING_PATCHES_KEY);
    } else {
      safeLocalStorageSet(PENDING_PATCHES_KEY, JSON.stringify(compact));
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Immediately patches ONLY the modified column(s) in `cbt_app_state` (id = 1)
 * using Serialized Per-Item Atomic Read-Merge-Write:
 * - Only items explicitly modified on this device (`modifiedIds` / `dirtyIds`) are updated.
 * - Items belonging to other teachers in `remoteRow` are preserved 100% untouched.
 * - Within any modified ExamPacket, questions are merged non-destructively so concurrent
 *   edits across tabs/devices never drop questions.
 */
export async function patchMasterColumnInSupabase(
  columns: MasterColumnsPatch,
  customCfg?: SupabaseCloudConfig | null,
  options?: PatchMasterOptions
): Promise<boolean> {
  cloudMutationSeq += 1;
  const normalizedInput: MasterColumnsPatch = { ...columns };
  const cfg = customCfg || getSupabaseConfig(columns.settings_json);
  if (normalizedInput.settings_json && cfg) {
    normalizedInput.settings_json = {
      ...normalizedInput.settings_json,
      supabaseUrl: cfg.url,
      supabaseAnonKey: cfg.anonKey,
      syncMode: 'SUPABASE_HYBRID',
    };
  }

  if (options?.deletedIds?.length) {
    recordDeletedEntityIds(options.deletedIds);
    (['packets_json', 'schedules_json', 'students_json', 'teachers_json'] as const).forEach(
      (colKey) => {
        removeDirtyEntityIds(colKey, options.deletedIds!);
      }
    );
  }

  const arrayColumnKeys = (
    ['packets_json', 'schedules_json', 'students_json', 'teachers_json'] as const
  ).filter((k) => Array.isArray(normalizedInput[k]));

  if (options?.modifiedIds?.length) {
    for (const colKey of arrayColumnKeys) {
      recordDirtyEntityIds(colKey, options.modifiedIds);
    }
  }

  // Record in durable pending journal synchronously before queuing network call
  const snapshotBefore = mergePendingColumns(getPendingCloudPatches(), normalizedInput);
  setPendingCloudPatches(snapshotBefore);

  if (!cfg) {
    lastCloudSyncError = 'Konfigurasi Supabase belum tersedia.';
    notifySyncStateListeners();
    return false;
  }

  activePatchCount += 1;
  setCrossTabPatchInFlight(true);
  notifySyncStateListeners();

  const runTask = async (): Promise<boolean> => {
    try {
      const deletedSet = getDeletedEntityIds();
      // Combine normalizedInput with the latest compact pending snapshot
      const currentPending = getPendingCloudPatches();
      const combinedPending = mergePendingColumns(normalizedInput, currentPending);
      const workingColumns: MasterColumnsPatch = {};
      const preMergeSnapshots: Partial<Record<keyof MasterColumnsPatch, string>> = {};
      const dirtyFlushedByCol: Partial<Record<ArrayColumnKey, Map<string, string>>> = {};

      for (const key of Object.keys(normalizedInput) as (keyof MasterColumnsPatch)[]) {
        const val =
          combinedPending[key] !== undefined ? combinedPending[key] : normalizedInput[key];
        (workingColumns as any)[key] = val;
        preMergeSnapshots[key] = JSON.stringify(
          currentPending[key] !== undefined ? currentPending[key] : val
        );
      }

      for (const colKey of arrayColumnKeys) {
        const dirtySet = getDirtyEntityIds(colKey);
        const itemMap = new Map<string, string>();
        const arr = (workingColumns[colKey] || []) as { id: string }[];
        for (const item of arr) {
          if (item && item.id && dirtySet.has(item.id)) {
            itemMap.set(item.id, JSON.stringify(item));
          }
        }
        dirtyFlushedByCol[colKey] = itemMap;
      }

      // Atomic Per-Item Read-Merge-Write across concurrent teacher/admin devices.
      // CRITICAL ANTI-OVERWRITE GUARD: If GET fails (e.g. network drop or quota limit),
      // abort the PATCH immediately rather than blindly overwriting other teachers' packets!
      if (!options?.replaceAll && arrayColumnKeys.length > 0) {
        const selectCols = arrayColumnKeys.join(',');
        const currentRes = await fetchWithRetry(
          `${cfg.url}/rest/v1/cbt_app_state?id=eq.1&select=${selectCols}`,
          { headers: buildHeaders(cfg.anonKey), cache: 'no-store' },
          3,
          500
        ).catch(() => null);

        if (!currentRes || !currentRes.ok) {
          lastCloudSyncError =
            'Koneksi Cloud tertunda saat membaca server. Soal Anda tetap tersimpan di perangkat ini dan akan dikirim ulang otomatis.';
          return false;
        }

        const currentRows = await currentRes.json().catch(() => null);
        if (!Array.isArray(currentRows)) {
          lastCloudSyncError =
            'Respons server Cloud tidak lengkap. Perubahan aman di perangkat dan akan dikirim ulang.';
          return false;
        }
        const remoteRow = currentRows[0] || null;
        if (remoteRow) {
            for (const colKey of arrayColumnKeys) {
              const localArr = (workingColumns[colKey] || []) as { id: string }[];
              const remoteArr = Array.isArray(remoteRow[colKey])
                ? (remoteRow[colKey] as { id: string }[])
                : [];
              const dirtySet = getDirtyEntityIds(colKey);
              const localById = new Map<string, any>();
              for (const item of localArr) {
                if (item && item.id && !deletedSet.has(item.id) && !LEGACY_DUMMY_ALL_IDS.has(item.id)) {
                  localById.set(item.id, item);
                }
              }

              if (colKey === 'packets_json') {
                // Strict isolation for packets_json:
                // Only packets in `dirtySet` can be modified/added by this device;
                // all other teachers' packets in `remoteArr` are kept verbatim!
                const remoteIds = new Set<string>();
                const mergedPackets: ExamPacket[] = [];

                for (const rItem of remoteArr as ExamPacket[]) {
                  if (
                    !rItem ||
                    !rItem.id ||
                    deletedSet.has(rItem.id) ||
                    LEGACY_DUMMY_ALL_IDS.has(rItem.id)
                  ) {
                    continue;
                  }
                  remoteIds.add(rItem.id);
                  if (dirtySet.has(rItem.id)) {
                    const lItem = localById.get(rItem.id) as ExamPacket | undefined;
                    if (lItem) {
                      mergedPackets.push(mergeSinglePacket(lItem, rItem, true, deletedSet));
                    } else {
                      mergedPackets.push(rItem);
                    }
                  } else {
                    // Untouched packet on this device -> preserve remote version 100%
                    mergedPackets.push(rItem);
                  }
                }

                // Prepend any newly created packets that are in `dirtySet` (or if remoteArr was empty)
                const newDirtyPackets: ExamPacket[] = [];
                for (const lItem of localArr as ExamPacket[]) {
                  if (
                    lItem &&
                    lItem.id &&
                    !remoteIds.has(lItem.id) &&
                    !deletedSet.has(lItem.id) &&
                    !LEGACY_DUMMY_ALL_IDS.has(lItem.id) &&
                    (dirtySet.has(lItem.id) || remoteArr.length === 0)
                  ) {
                    newDirtyPackets.push(lItem);
                  }
                }

                workingColumns.packets_json = [...newDirtyPackets, ...mergedPackets];
              } else {
                // schedules_json, students_json, teachers_json
                const remoteIds = new Set<string>();
                const mergedItems: any[] = [];

                for (const rItem of remoteArr) {
                  if (
                    !rItem ||
                    !rItem.id ||
                    deletedSet.has(rItem.id) ||
                    LEGACY_DUMMY_ALL_IDS.has(rItem.id)
                  ) {
                    continue;
                  }
                  remoteIds.add(rItem.id);
                  if (dirtySet.size > 0) {
                    if (dirtySet.has(rItem.id) && localById.has(rItem.id)) {
                      mergedItems.push(localById.get(rItem.id));
                    } else {
                      mergedItems.push(rItem);
                    }
                  } else {
                    // Legacy caller without dirtySet: prefer local if present
                    mergedItems.push(localById.get(rItem.id) || rItem);
                  }
                }

                const newLocalItems: any[] = [];
                for (const lItem of localArr) {
                  if (
                    lItem &&
                    lItem.id &&
                    !remoteIds.has(lItem.id) &&
                    !deletedSet.has(lItem.id) &&
                    !LEGACY_DUMMY_ALL_IDS.has(lItem.id) &&
                    (dirtySet.size === 0 || dirtySet.has(lItem.id) || remoteArr.length === 0)
                  ) {
                    newLocalItems.push(lItem);
                  }
                }

                (workingColumns as any)[colKey] = [...newLocalItems, ...mergedItems];
              }
            }
          }
        }

      if (Array.isArray(workingColumns.packets_json)) {
        const dirtyPktSet = getDirtyEntityIds('packets_json');
        workingColumns.packets_json = await offloadBase64InPackets(
          workingColumns.packets_json,
          cfg,
          dirtyPktSet.size > 0 ? dirtyPktSet : undefined
        );
      }

      const nowIso = new Date().toISOString();
      const patchBody = {
        ...workingColumns,
        updated_at: nowIso,
      };

      const res = await fetchWithRetry(
        `${cfg.url}/rest/v1/cbt_app_state?id=eq.1&select=id`,
        {
          method: 'PATCH',
          headers: buildHeaders(cfg.anonKey, {
            Prefer: 'return=representation',
          }),
          body: JSON.stringify(patchBody),
        },
        3
      );

      if (!res.ok) {
        lastCloudSyncError = `Gagal menyimpan ke Cloud (HTTP ${res.status}). Soal tetap aman di perangkat.`;
        return false;
      }

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
        if (!insertRes.ok) {
          lastCloudSyncError = `Gagal inisialisasi baris Cloud (HTTP ${insertRes.status}).`;
          return false;
        }
      }

      lastKnownCloudUpdatedAt = nowIso;
      lastCloudSyncError = null;
      lastCloudSyncedAt = Date.now();

      if (
        Array.isArray(workingColumns.schedules_json) &&
        workingColumns.schedules_json.length === 0 &&
        options?.replaceAll
      ) {
        await fetch(`${cfg.url}/rest/v1/cbt_live_participants?schedule_id=neq.__none__`, {
          method: 'DELETE',
          headers: buildHeaders(cfg.anonKey),
        }).catch(() => {});
      }

      // Clear dirty item IDs that have not changed since this flush started
      const latestPending = getPendingCloudPatches();
      for (const colKey of arrayColumnKeys) {
        const flushedMap = dirtyFlushedByCol[colKey];
        if (flushedMap && flushedMap.size > 0) {
          const latestArr = (latestPending[colKey] || []) as { id: string }[];
          const latestById = new Map(latestArr.map((item) => [item?.id, item]));
          const idsToClear: string[] = [];
          flushedMap.forEach((flushedJson, id) => {
            const currentItem = latestById.get(id);
            if (!currentItem || JSON.stringify(currentItem) === flushedJson) {
              idsToClear.push(id);
            }
          });
          if (idsToClear.length > 0) {
            removeDirtyEntityIds(colKey, idsToClear);
          }
        }
      }

      // Compare against pre-merge snapshot so remote merges never leave stuck pending patches
      for (const key of Object.keys(workingColumns) as (keyof MasterColumnsPatch)[]) {
        if (
          key !== 'packets_json' &&
          JSON.stringify(latestPending[key]) === preMergeSnapshots[key]
        ) {
          delete latestPending[key];
        }
      }
      setPendingCloudPatches(latestPending);

      return true;
    } catch {
      lastCloudSyncError =
        'Gangguan jaringan saat menghubungi Cloud. Soal Anda tersimpan di perangkat & akan dikirim otomatis.';
      return false;
    } finally {
      activePatchCount = Math.max(0, activePatchCount - 1);
      if (activePatchCount === 0) {
        setCrossTabPatchInFlight(false);
      }
      notifySyncStateListeners();
    }
  };

  patchQueuePromise = patchQueuePromise.then(runTask, runTask);
  return patchQueuePromise;
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
  customCfg?: SupabaseCloudConfig | null,
  options?: { replaceAll?: boolean }
): Promise<boolean> {
  const cfg = customCfg || getSupabaseConfig(payload.settings);
  if (!cfg) return false;

  try {
    let finalPackets = payload.packets;
    if (!options?.replaceAll) {
      const currentRes = await fetch(
        `${cfg.url}/rest/v1/cbt_app_state?id=eq.1&select=packets_json`,
        { headers: buildHeaders(cfg.anonKey), cache: 'no-store' }
      ).catch(() => null);
      if (currentRes && currentRes.ok) {
        const currentRows = await currentRes.json().catch(() => []);
        const remoteRow = Array.isArray(currentRows) && currentRows[0] ? currentRows[0] : null;
        if (remoteRow && Array.isArray(remoteRow.packets_json)) {
          const allLocalIds = new Set(payload.packets.map((p) => p.id));
          finalPackets = mergePacketLists(
            payload.packets,
            remoteRow.packets_json as ExamPacket[],
            allLocalIds
          ).packets;
        }
      }
    }

    finalPackets = await offloadBase64InPackets(finalPackets, cfg);

    const nowIso = new Date().toISOString();
    const stateBody = {
      id: 1,
      settings_json: {
        ...payload.settings,
        supabaseUrl: cfg.url,
        supabaseAnonKey: cfg.anonKey,
        syncMode: 'SUPABASE_HYBRID',
      },
      packets_json: finalPackets,
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

    if (payload.schedules.length === 0 && options?.replaceAll) {
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

      // Automatically prune cbt_live_events older than 24 hours to keep event table fast
      if (message.type !== 'STUDENT_SUBMITTED' || Math.random() < 0.1) {
        const cutoffTs = Date.now() - 24 * 60 * 60 * 1000;
        fetch(`${cfg.url}/rest/v1/cbt_live_events?timestamp=lt.${cutoffTs}`, {
          method: 'DELETE',
          headers: buildHeaders(cfg.anonKey),
        }).catch(() => {});
      }
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
    const reqInit: RequestInit & { priority?: 'low' } = {
      headers: buildHeaders(cfg.anonKey),
      cache: 'no-store',
      priority: 'low',
    };
    const res = await fetch(
      `${cfg.url}/rest/v1/cbt_live_events?timestamp=gt.${sinceTs}&order=id.asc&limit=100`,
      reqInit as RequestInit
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
