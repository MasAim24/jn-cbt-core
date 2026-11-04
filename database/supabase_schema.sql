-- ============================================================================
-- JN ExamCBTCore — Skema Database Cloud Supabase (PostgreSQL)
-- Kapasitas Tinggi (600+ Santri Serentak) dengan Atomic Row-Level Upsert
-- Cara Pakai: Salin seluruh isi file ini ke menu "SQL Editor" di Supabase
--             lalu klik tombol "Run".
-- ============================================================================

-- 1. Tabel Master Konfigurasi, Bank Soal, Jadwal, Data Santri & Dewan Asatidz
CREATE TABLE IF NOT EXISTS public.cbt_app_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  packets_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  schedules_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  students_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  teachers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabel Pengumpulan Nilai & Jawaban Santri (Atomic Per-Santri untuk 600+ Peserta)
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

-- 3. Tabel Pantauan Ruang Pengawas Live (Atomic Per-Santri per Jadwal)
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

-- 4. Tabel Bus Komando Pengawas Real-Time (Reset Login, Tambah Waktu, Pengumuman)
CREATE TABLE IF NOT EXISTS public.cbt_live_events (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cbt_live_events_ts ON public.cbt_live_events(timestamp);

-- ============================================================================
-- Row Level Security (RLS) & Kebijakan Akses API Aplikasi CBT
-- ============================================================================
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
