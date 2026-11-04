export type Jenjang = 'MTs' | 'MA' | 'Wustho' | 'Ulya';

export type JenjangFilter = 'ALL' | Jenjang;

export type UserRole = 'admin' | 'guru' | 'siswa';

export type QuestionType = 'PG' | 'PG_KOMPLEKS' | 'BENAR_SALAH' | 'ESAI';

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  arabicText?: string;
}

export interface Question {
  id: string;
  nomor: number;
  type: QuestionType;
  prompt: string;
  arabicPrompt?: string;
  kitabReference?: string; // e.g. "Matan Al-Ajurrumiyah Bab I'rab" or "Fathul Mu'in Juz 1"
  isRtl?: boolean;
  mediaImageUrl?: string; // Base64 DataURL, SVG DataURL, or external image URL
  mediaAudioUrl?: string; // Base64 audio DataURL, external audio URL, or 'SYNTH_ISTIMA_...' preset
  mediaCaption?: string; // Caption for image/audio attachment
  options?: QuestionOption[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | 'E'; // For PG
  correctAnswers?: ('A' | 'B' | 'C' | 'D' | 'E')[]; // For PG_KOMPLEKS
  correctBoolean?: boolean; // For BENAR_SALAH (true = Benar / Shahih, false = Salah / Khatha')
  essayRubric?: string; // Keywords / Pedoman penskoran esai
  weight: number; // Bobot nilai
  pembahasan?: string;
}

export interface ExamPacket {
  id: string;
  code: string;
  title: string;
  mapel: string;
  jenjang: Jenjang;
  kelas: string; // e.g., "VIII-A", "XII Keagamaan", " II Wustho", "III 'Ulya"
  guruNama: string;
  optionCount: 4 | 5; // 4 (A-D) or 5 (A-E)
  kkm: number;
  hasArabicKitab: boolean;
  updatedAt: string;
  questions: Question[];
}

export type ParticipantLiveStatus = 'MENGERJAKAN' | 'SELESAI' | 'BELUM_LOGIN' | 'MELANGGAR';

export interface LiveParticipant {
  studentId: string;
  studentName: string;
  nomorPeserta: string;
  kelas: string;
  status: ParticipantLiveStatus;
  answeredCount: number;
  totalQuestions: number;
  remainingMinutes: number;
  violations: number;
  ipAddress: string;
  lastActivity: string;
}

export interface ExamSchedule {
  id: string;
  packetId: string;
  packetTitle: string;
  mapel: string;
  jenjang: Jenjang;
  kelasTarget: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  durasiMenit: number;
  token: string;
  ruang: string;
  pengawas: string;
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED';
  announcement?: string;
  acakSoal: boolean;
  acakOpsi: boolean;
  totalPeserta: number;
  hadirCount: number;
  selesaiCount: number;
  liveParticipants: LiveParticipant[];
}

export interface Student {
  id: string;
  nomorPeserta: string;
  nisn: string;
  nama: string;
  jenjang: Jenjang;
  kelas: string;
  ruang: string;
  sesi: 'Sesi 1 (Pagi)' | 'Sesi 2 (Siang)';
  pin: string;
  gender: 'L' | 'P';
  statusAktif: boolean;
}

export type TeacherPeran =
  | 'Kepala Madrasah / Mudir'
  | 'Wali Kelas'
  | 'Guru Mapel'
  | 'Pengawas CBT'
  | 'Koordinator Kurikulum';

export type NavTab =
  | 'dashboard'
  | 'bank-soal'
  | 'jadwal-live'
  | 'peserta-kartu'
  | 'rekap-nilai'
  | 'pengaturan';

export interface Teacher {
  id: string;
  nip: string;
  username: string;
  password: string;
  nama: string;
  gelar: string;
  mapelAmpu: string;
  kelasBinaan?: string;
  jenjangAmpu: Jenjang[];
  peran: TeacherPeran;
  hakAkses: NavTab[];
  noHp: string;
  statusAktif?: boolean;
}

export interface ExamSubmission {
  id: string;
  scheduleId: string;
  packetId: string;
  studentId: string;
  studentName: string;
  nomorPeserta: string;
  jenjang: Jenjang;
  kelas: string;
  mapel: string;
  submittedAt: string;
  durationUsedMinutes: number;
  pgScore: number;
  pgKompleksScore: number;
  benarSalahScore: number;
  esaiScore: number;
  totalScore: number;
  kkm: number;
  isEsaiGraded: boolean;
  violations: number;
  essayAnswerSample?: string;
  essayQuestionPrompt?: string;
  itemResponses?: Record<string, string>; // Question ID -> Student's selected option/answer
}

export interface SchoolSettings {
  namaYayasan: string;
  namaAplikasi: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  alamat: string;
  kota: string;
  kepalaMTs: string;
  kepalaMA: string;
  mudirWustho: string;
  mudirUlya: string;
  ketuaPanitia: string;
  adminName?: string;
  adminUsername?: string;
  adminPassword?: string;
  antiCheatFullscreen: boolean;
  antiCheatBlockTabSwitch: boolean;
  maxViolationsAllowed: number;
  autoRotateTokenMinutes: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  syncMode: 'LOCAL_STORAGE' | 'SUPABASE_HYBRID';
}
