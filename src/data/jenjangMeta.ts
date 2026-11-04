import { SchoolSettings } from '../types/cbt';

export const JENJANG_META = {
  MTs: {
    code: 'MTs',
    shortLabel: 'MTs',
    fullLabel: 'Madrasah Tsanawiyah',
    subtitle: 'Jenjang Menengah Pertama (Kelas VII–IX)',
    badgeBg: '#EAE6FF',
    badgeText: '#3B28CC',
    barColor: '#211955',
    accentHex: '#491ED9',
    defaultOptions: 4 as const,
  },
  MA: {
    code: 'MA',
    shortLabel: 'Aliyah',
    fullLabel: 'Madrasah Aliyah',
    subtitle: 'Jenjang Menengah Atas (Kelas X–XII)',
    badgeBg: '#FFF4D6',
    badgeText: '#D97706',
    barColor: '#F59E0B',
    accentHex: '#D97706',
    defaultOptions: 5 as const,
  },
  Wustho: {
    code: 'Wustho',
    shortLabel: 'Wustho',
    fullLabel: 'PDF / Diniyah Wustho',
    subtitle: 'Marhalah Wustho — Takhassus Kitab Turats',
    badgeBg: '#E0F8F5',
    badgeText: '#087963',
    barColor: '#14B894',
    accentHex: '#0B987C',
    defaultOptions: 4 as const,
  },
  Ulya: {
    code: 'Ulya',
    shortLabel: "'Ulya",
    fullLabel: "PDF / Diniyah 'Ulya",
    subtitle: "Marhalah 'Ulya — Ma'had & Bahtsul Masail",
    badgeBg: '#FFE8E5',
    badgeText: '#D93834',
    barColor: '#F0544F',
    accentHex: '#D93834',
    defaultOptions: 5 as const,
  },
};

const ENV_SUPABASE_URL =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  'https://zlxzgmtiufzjnqebkuih.supabase.co';
const ENV_SUPABASE_ANON_KEY =
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  'sb_publishable_Oc_bXVJ8qDzhubprij59pw_BHXJ7Y8Z';

export const INITIAL_SETTINGS: SchoolSettings = {
  namaYayasan: 'Pondok Pesantren Jabal Nur Kandis',
  namaAplikasi: 'JN ExamCBTCore',
  tahunAjaran: '2026/2027',
  semester: 'Ganjil',
  alamat: 'Jl. Raya Pekanbaru – Duri, Kec. Kandis, Kab. Siak',
  kota: 'Kandis, Kabupaten Siak — Riau',
  kepalaMTs: 'Belum Diatur (Input via Admin)',
  kepalaMA: 'Belum Diatur (Input via Admin)',
  mudirWustho: 'Belum Diatur (Input via Admin)',
  mudirUlya: 'Belum Diatur (Input via Admin)',
  ketuaPanitia: 'Administrator Utama CBT',
  adminName: 'Administrator Utama CBT',
  adminUsername: 'admin',
  adminPassword: 'admin123',
  antiCheatFullscreen: true,
  antiCheatBlockTabSwitch: true,
  maxViolationsAllowed: 3,
  autoRotateTokenMinutes: 15,
  supabaseUrl: ENV_SUPABASE_URL,
  supabaseAnonKey: ENV_SUPABASE_ANON_KEY,
  syncMode: ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY ? 'SUPABASE_HYBRID' : 'LOCAL_STORAGE',
};
