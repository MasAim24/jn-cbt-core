-- ============================================================================
-- JN ExamCBTCore — Skema Database Lokal Server Sekolah (SQLite WAL Mode)
-- Mendukung 4 Jenjang: MTs, Madrasah Aliyah (MA), PDF Wustho, & Ma'had 'Ulya
-- ============================================================================

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cbt_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nama_yayasan TEXT NOT NULL,
  nama_aplikasi TEXT NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  semester TEXT NOT NULL,
  alamat TEXT NOT NULL,
  kota TEXT NOT NULL,
  kepala_mts TEXT NOT NULL,
  kepala_ma TEXT NOT NULL,
  mudir_wustho TEXT NOT NULL,
  mudir_ulya TEXT NOT NULL,
  ketua_panitia TEXT NOT NULL,
  admin_name TEXT NOT NULL DEFAULT 'Administrator Utama CBT',
  admin_username TEXT NOT NULL DEFAULT 'admin',
  admin_password TEXT NOT NULL DEFAULT 'admin123',
  anti_cheat_fullscreen INTEGER NOT NULL DEFAULT 1,
  anti_cheat_block_tab_switch INTEGER NOT NULL DEFAULT 1,
  max_violations_allowed INTEGER NOT NULL DEFAULT 3,
  auto_rotate_token_minutes INTEGER NOT NULL DEFAULT 15,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cbt_teachers (
  id TEXT PRIMARY KEY,
  nip TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  nama TEXT NOT NULL,
  gelar TEXT NOT NULL,
  mapel_ampu TEXT NOT NULL,
  kelas_binaan TEXT,
  jenjang_ampu_json TEXT NOT NULL,
  peran TEXT NOT NULL,
  hak_akses_json TEXT NOT NULL,
  no_hp TEXT NOT NULL,
  status_aktif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cbt_students (
  id TEXT PRIMARY KEY,
  nomor_peserta TEXT NOT NULL UNIQUE,
  nisn TEXT NOT NULL,
  nama TEXT NOT NULL,
  jenjang TEXT NOT NULL,
  kelas TEXT NOT NULL,
  ruang TEXT NOT NULL,
  sesi TEXT NOT NULL,
  pin TEXT NOT NULL,
  gender TEXT NOT NULL,
  status_aktif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cbt_packets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  mapel TEXT NOT NULL,
  jenjang TEXT NOT NULL,
  kelas TEXT NOT NULL,
  guru_id TEXT,
  guru_nama TEXT NOT NULL,
  option_count INTEGER NOT NULL DEFAULT 4,
  kkm INTEGER NOT NULL DEFAULT 75,
  has_arabic_kitab INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cbt_questions (
  id TEXT PRIMARY KEY,
  packet_id TEXT NOT NULL,
  nomor INTEGER NOT NULL,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  arabic_prompt TEXT,
  kitab_reference TEXT,
  is_rtl INTEGER DEFAULT 0,
  media_image_url TEXT,
  media_audio_url TEXT,
  media_caption TEXT,
  options_json TEXT,
  correct_answer TEXT,
  correct_answers_json TEXT,
  correct_boolean INTEGER,
  essay_rubric TEXT,
  weight INTEGER NOT NULL DEFAULT 25,
  pembahasan TEXT,
  FOREIGN KEY (packet_id) REFERENCES cbt_packets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cbt_schedules (
  id TEXT PRIMARY KEY,
  packet_id TEXT NOT NULL,
  packet_title TEXT NOT NULL,
  mapel TEXT NOT NULL,
  jenjang TEXT NOT NULL,
  kelas_target TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  waktu_mulai TEXT NOT NULL,
  waktu_selesai TEXT NOT NULL,
  durasi_menit INTEGER NOT NULL DEFAULT 90,
  token TEXT NOT NULL,
  ruang TEXT NOT NULL,
  pengawas TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LIVE',
  announcement TEXT,
  acak_soal INTEGER NOT NULL DEFAULT 1,
  acak_opsi INTEGER NOT NULL DEFAULT 1,
  total_peserta INTEGER NOT NULL DEFAULT 0,
  hadir_count INTEGER NOT NULL DEFAULT 0,
  selesai_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cbt_live_participants (
  schedule_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  nomor_peserta TEXT NOT NULL,
  kelas TEXT NOT NULL,
  status TEXT NOT NULL,
  answered_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  remaining_minutes INTEGER NOT NULL DEFAULT 0,
  violations INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT NOT NULL,
  last_activity TEXT NOT NULL,
  PRIMARY KEY (schedule_id, student_id),
  FOREIGN KEY (schedule_id) REFERENCES cbt_schedules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cbt_submissions (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  nomor_peserta TEXT NOT NULL,
  jenjang TEXT NOT NULL,
  kelas TEXT NOT NULL,
  mapel TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  duration_used_minutes INTEGER NOT NULL DEFAULT 0,
  pg_score INTEGER NOT NULL DEFAULT 0,
  pg_kompleks_score INTEGER NOT NULL DEFAULT 0,
  benar_salah_score INTEGER NOT NULL DEFAULT 0,
  esai_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  kkm INTEGER NOT NULL DEFAULT 75,
  is_esai_graded INTEGER NOT NULL DEFAULT 0,
  violations INTEGER NOT NULL DEFAULT 0,
  essay_answer_sample TEXT,
  essay_question_prompt TEXT,
  item_responses_json TEXT
);

CREATE TABLE IF NOT EXISTS cbt_live_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  payload_json TEXT NOT NULL
);
