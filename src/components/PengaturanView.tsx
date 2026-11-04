import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Copy,
  Database,
  Download,
  KeyRound,
  RotateCcw,
  Save,
  ShieldCheck,
  Sliders,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { NavTab, SchoolSettings, Student, Teacher } from '../types/cbt';
import { CornerTableSticker } from './common/CornerStickerBadge';
import { fetchSqliteStatus, SqliteServerStatus } from '../utils/sqliteApiClient';
import {
  checkSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  SupabaseCloudStatus,
} from '../utils/supabaseCloudClient';

interface PengaturanViewProps {
  settings: SchoolSettings;
  students?: Student[];
  teachers?: Teacher[];
  onNavigateTab?: (tab: NavTab) => void;
  onSaveSettings: (next: SchoolSettings) => void;
  onResetDemoData: () => void;
  onExportFullBackup: () => void;
  onImportFullBackup?: (jsonData: any) => void;
  onForceSyncSqlite?: (overrideSettings?: SchoolSettings) => Promise<void>;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  students = [],
  teachers = [],
  onNavigateTab,
  onSaveSettings,
  onResetDemoData,
  onExportFullBackup,
  onImportFullBackup,
  onForceSyncSqlite,
}) => {
  const [form, setForm] = useState<SchoolSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [sqliteStatus, setSqliteStatus] = useState<SqliteServerStatus | null>(null);
  const [syncingSqlite, setSyncingSqlite] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseCloudStatus | null>(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [copiedSqlNotice, setCopiedSqlNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    fetchSqliteStatus().then((st) => {
      if (st) setSqliteStatus(st);
    });
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      checkSupabaseConnection(settings.supabaseUrl, settings.supabaseAnonKey).then((st) => {
        setSupabaseStatus(st);
      });
    }
  }, [students.length, teachers.length, settings.supabaseUrl, settings.supabaseAnonKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportFullBackup) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        onImportFullBackup(parsed);
        if (parsed.settings) {
          setForm(parsed.settings);
        }
        setRestoreNotice('Backup JSON berhasil dipulihkan!');
        setTimeout(() => setRestoreNotice(null), 3000);
      } catch {
        setRestoreNotice('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const kepalaCount = teachers.filter((t) => t.peran === 'Kepala Madrasah / Mudir').length;
  const waliCount = teachers.filter((t) => t.peran === 'Wali Kelas').length;
  const guruMapelCount = teachers.filter(
    (t) =>
      t.peran === 'Guru Mapel' ||
      t.peran === 'Pengawas CBT' ||
      t.peran === 'Koordinator Kurikulum'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-elevated p-5 rounded-[24px] shadow-card border border-border-subtle/60">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-[#211955]">
            Konfigurasi Sistem, Akun &amp; Multi-Jenjang
          </span>
          <h1 className="text-xl font-extrabold text-text-main mt-1">
            Pengaturan Akun Admin, Pimpinan Lembaga &amp; Keamanan CBT
          </h1>
          {restoreNotice && (
            <p className="text-xs font-extrabold text-[#087963] mt-1">{restoreNotice}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-xs font-extrabold whitespace-nowrap transition"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span>Restore JSON</span>
          </button>
          <button
            type="button"
            onClick={onExportFullBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-indigo-50 text-text-main text-xs font-bold border border-border-subtle whitespace-nowrap transition"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Backup JSON</span>
          </button>
          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#D93834] text-xs font-bold whitespace-nowrap transition"
            title="Bersihkan seluruh data santri/guru kembali ke pengaturan awal Admin"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Bersih (Hanya Admin)</span>
          </button>
        </div>
      </div>

      {/* Ringkasan & Pintasan Manajemen Akun & Database Santri Real */}
      <div className="rounded-[26px] bg-gradient-to-r from-[#211955] to-[#302475] text-white p-6 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[#F8B478] text-[10px] font-extrabold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pusat Kendali Akun &amp; Database Lapangan</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold">
            Input Akun Kepala Madrasah/Diniyah, Wali Kelas, Guru Mapel &amp; Database Santri Real
          </h2>
          <p className="text-xs text-indigo-200 leading-relaxed">
            Seluruh data dummy telah dibersihkan. Gunakan menu{' '}
            <strong className="text-white">Database Santri &amp; Akun Guru</strong> untuk menambah
            akun pejabat/pendidik beserta hak akses loginnya serta menginput database santri real di
            lapangan.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-indigo-100">
              Kepala Madrasah/Mudir: <strong className="text-[#F8B478]">{kepalaCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-indigo-100">
              Wali Kelas: <strong className="text-[#F8B478]">{waliCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-indigo-100">
              Guru Mapel &amp; Pengawas: <strong className="text-[#F8B478]">{guruMapelCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-indigo-100">
              Database Santri Real: <strong className="text-[#14B894]">{students.length}</strong>
            </span>
          </div>
        </div>

        {onNavigateTab && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('peserta-kartu')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F8B478] hover:bg-[#f3a35c] text-[#1E1645] text-xs font-extrabold transition shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Kelola Akun Guru &amp; Input Santri Real</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left: Identitas Madrasah, Pimpinan 4 Jenjang & Akun Master Admin */}
        <div className="lg:col-span-7 space-y-6">
          {/* Kredensial Akun Master Admin */}
          <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
            <h2 className="text-base font-extrabold text-text-main flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#B85D19]" />
              <span>Pengaturan Akun Master Administrator CBT</span>
            </h2>
            <p className="text-[11px] text-text-muted">
              Akun Administrator Utama memiliki hak akses penuh untuk menginput akun Kepala
              Madrasah/Diniyah, Wali Kelas, Guru Mapel, serta mengelola database santri real.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Nama Tampilan Admin
                </label>
                <input
                  type="text"
                  value={form.adminName || 'Administrator Utama CBT'}
                  onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Username Login Admin
                </label>
                <input
                  type="text"
                  value={form.adminUsername || 'admin'}
                  onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Password Login Admin
                </label>
                <input
                  type="text"
                  value={form.adminPassword || 'admin123'}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Identitas Yayasan & Pimpinan 4 Jenjang */}
          <div className="relative overflow-hidden rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
            <CornerTableSticker
              type="pengaturan"
              glowTone="royal-teal"
              position="bottom-right"
              sizeClass="w-32 h-32 sm:w-40 sm:h-40"
              opacityClass="opacity-80"
            />
            <h2 className="relative z-10 text-base font-extrabold text-text-main flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--brand-text-accent)]" />
              <span>Identitas Yayasan &amp; Pejabat Penandatangan 4 Jenjang</span>
            </h2>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="font-bold text-text-main block mb-1">
                  Nama Yayasan / Pondok Pesantren
                </label>
                <input
                  type="text"
                  value={form.namaYayasan}
                  onChange={(e) => setForm({ ...form, namaYayasan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>

              <div>
                <label className="font-bold text-text-main block mb-1">Nama Aplikasi CBT</label>
                <input
                  type="text"
                  value={form.namaAplikasi}
                  onChange={(e) => setForm({ ...form, namaAplikasi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-text-main block mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={form.tahunAjaran}
                    onChange={(e) => setForm({ ...form, tahunAjaran: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                  />
                </div>
                <div>
                  <label className="font-bold text-text-main block mb-1">Semester</label>
                  <select
                    value={form.semester}
                    onChange={(e) =>
                      setForm({ ...form, semester: e.target.value as 'Ganjil' | 'Genap' })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-text-main block mb-1">
                  Kepala Madrasah Tsanawiyah (MTs)
                </label>
                <input
                  type="text"
                  value={form.kepalaMTs}
                  onChange={(e) => setForm({ ...form, kepalaMTs: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>

              <div>
                <label className="font-bold text-text-main block mb-1">
                  Kepala Madrasah Aliyah (MA)
                </label>
                <input
                  type="text"
                  value={form.kepalaMA}
                  onChange={(e) => setForm({ ...form, kepalaMA: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>

              <div>
                <label className="font-bold text-text-main block mb-1">
                  Mudir PDF / Diniyah Wustho
                </label>
                <input
                  type="text"
                  value={form.mudirWustho}
                  onChange={(e) => setForm({ ...form, mudirWustho: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>

              <div>
                <label className="font-bold text-text-main block mb-1">
                  Mudir PDF / Ma&apos;had &apos;Ulya
                </label>
                <input
                  type="text"
                  value={form.mudirUlya}
                  onChange={(e) => setForm({ ...form, mudirUlya: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-text-main block mb-1">
                  Ketua Panitia Ujian Terpadu
                </label>
                <input
                  type="text"
                  value={form.ketuaPanitia}
                  onChange={(e) => setForm({ ...form, ketuaPanitia: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Anti-Cheat & Database Connector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
            <h2 className="text-base font-extrabold text-text-main flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#14B894]" />
              <span>Keamanan &amp; Anti-Cheat Ujian</span>
            </h2>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface cursor-pointer">
              <div>
                <div className="font-bold text-text-main">Wajib Layar Penuh (Fullscreen)</div>
                <div className="text-[11px] text-text-muted">
                  Beri peringatan otomatis saat santri keluar mode layar penuh
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.antiCheatFullscreen}
                onChange={(e) =>
                  setForm({ ...form, antiCheatFullscreen: e.target.checked })
                }
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface cursor-pointer">
              <div>
                <div className="font-bold text-text-main">Deteksi Pindah Tab / Jendela</div>
                <div className="text-[11px] text-text-muted">
                  Catat pelanggaran ke Ruang Pengawas jika membuka tab lain
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.antiCheatBlockTabSwitch}
                onChange={(e) =>
                  setForm({ ...form, antiCheatBlockTabSwitch: e.target.checked })
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Batas Pelanggaran
                </label>
                <input
                  type="number"
                  value={form.maxViolationsAllowed}
                  onChange={(e) =>
                    setForm({ ...form, maxViolationsAllowed: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Rotasi Token (Menit)
                </label>
                <input
                  type="number"
                  value={form.autoRotateTokenMinutes}
                  onChange={(e) =>
                    setForm({ ...form, autoRotateTokenMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
            </div>
          </div>

          {/* Cloud Supabase Connector (100% Cloud Mode for github.io & jn.examcbtcore.online) */}
          <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-text-main flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#14B894]" />
                <span>Database Cloud Supabase (Mode 100% Cloud)</span>
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  supabaseStatus?.connected
                    ? 'bg-teal-50 text-[#087963]'
                    : 'bg-indigo-50 text-[#211955]'
                }`}
              >
                {supabaseStatus?.connected ? 'CLOUD SUPABASE AKTIF' : 'SIAP DIHUBUNGKAN'}
              </span>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              Gunakan konektor ini agar aplikasi di{' '}
              <strong className="text-text-main">github.io</strong> /{' '}
              <strong className="text-text-main">jn.examcbtcore.online</strong> berjalan 100% di
              Cloud dan sanggup menangani <strong className="text-text-main">600+ santri</strong>{' '}
              secara serentak tanpa perlu menyalakan PC server lokal.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  value={form.supabaseUrl || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      supabaseUrl: e.target.value,
                      syncMode: e.target.value ? 'SUPABASE_HYBRID' : 'LOCAL_STORAGE',
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-text-main block mb-1">
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={form.supabaseAnonKey || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      supabaseAnonKey: e.target.value,
                      syncMode: e.target.value ? 'SUPABASE_HYBRID' : 'LOCAL_STORAGE',
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main font-mono text-[11px]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                    setCopiedSqlNotice(true);
                    setTimeout(() => setCopiedSqlNotice(false), 3500);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#211955] text-[11px] font-extrabold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {copiedSqlNotice ? 'Skema SQL Tersalin!' : '1. Salin Skema SQL Supabase'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={syncingSupabase || !form.supabaseUrl || !form.supabaseAnonKey}
                  onClick={async () => {
                    setSyncingSupabase(true);
                    const nextSettings: SchoolSettings = {
                      ...form,
                      syncMode: 'SUPABASE_HYBRID',
                    };
                    onSaveSettings(nextSettings);
                    if (onForceSyncSqlite) {
                      await onForceSyncSqlite(nextSettings);
                    }
                    const st = await checkSupabaseConnection(
                      nextSettings.supabaseUrl,
                      nextSettings.supabaseAnonKey
                    );
                    setSupabaseStatus(st);
                    setSyncingSupabase(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 disabled:opacity-50 text-[#087963] text-[11px] font-extrabold transition cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${syncingSupabase ? 'animate-spin' : ''}`} />
                  <span>
                    {syncingSupabase
                      ? 'Menghubungkan & Upload...'
                      : '2. Uji & Sinkronkan ke Supabase'}
                  </span>
                </button>
              </div>

              {copiedSqlNotice && (
                <div className="p-2.5 rounded-xl bg-teal-50 text-[#087963] text-[11px] font-semibold">
                  Skema SQL berhasil disalin! Buka dashboard Supabase &rarr; menu{' '}
                  <strong>SQL Editor</strong> &rarr; Paste &rarr; klik <strong>Run</strong>.
                </div>
              )}

              {supabaseStatus && !supabaseStatus.connected && supabaseStatus.error && (
                <div className="p-2.5 rounded-xl bg-amber-50 text-[#B85D19] text-[11px] font-semibold">
                  {supabaseStatus.error}
                </div>
              )}

              {supabaseStatus?.connected && supabaseStatus.counts && (
                <div className="p-3 rounded-2xl bg-surface border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted font-semibold">Status Cloud PostgreSQL:</span>
                    <strong className="font-mono text-[#087963]">TERHUBUNG (READY 600+ USER)</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-elevated border border-border-subtle/70">
                      <div className="text-sm font-extrabold text-text-main">
                        {supabaseStatus.counts.packets} / {supabaseStatus.counts.schedules}
                      </div>
                      <div className="text-[10px] text-text-muted">Paket / Jadwal</div>
                    </div>
                    <div className="p-2 rounded-xl bg-elevated border border-border-subtle/70">
                      <div className="text-sm font-extrabold text-[#087963]">
                        {supabaseStatus.counts.students} / {supabaseStatus.counts.teachers}
                      </div>
                      <div className="text-[10px] text-text-muted">Santri / Guru</div>
                    </div>
                    <div className="p-2 rounded-xl bg-elevated border border-border-subtle/70">
                      <div className="text-sm font-extrabold text-[#211955] dark:text-[#F8B478]">
                        {supabaseStatus.counts.submissions}
                      </div>
                      <div className="text-[10px] text-text-muted">Nilai Masuk</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-text-main flex items-center gap-2">
                <Database className="w-4 h-4 text-[#14B894]" />
                <span>Server Database Lokal SQLite (WAL Mode)</span>
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  sqliteStatus
                    ? 'bg-teal-50 text-[#087963]'
                    : 'bg-amber-50 text-[#B85D19]'
                }`}
              >
                {sqliteStatus ? 'TERHUBUNG (LAN AKTIF)' : 'LOCAL FALLBACK'}
              </span>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              Seluruh perubahan Bank Soal, Jadwal, Database Santri Real, Akun Guru, dan Rekap Nilai
              tersimpan otomatis secara terpusat ke dalam database relasional{' '}
              <code className="px-1.5 py-0.5 rounded bg-surface font-mono font-bold text-text-main">
                {sqliteStatus?.dbPath || 'database/jn_cbt_server.sqlite'}
              </code>
              .
            </p>

            {sqliteStatus && (
              <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted font-semibold">Mesin SQLite Server:</span>
                  <strong className="font-mono text-text-main">{sqliteStatus.engine}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted font-semibold">Ukuran File Database:</span>
                  <strong className="font-mono text-text-main">{sqliteStatus.sizeKb} KB</strong>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-elevated border border-border-subtle/70">
                    <div className="text-sm font-extrabold text-text-main">
                      {sqliteStatus.counts.packets} / {sqliteStatus.counts.questions}
                    </div>
                    <div className="text-[10px] text-text-muted">Paket / Butir Soal</div>
                  </div>
                  <div className="p-2 rounded-xl bg-elevated border border-border-subtle/70">
                    <div className="text-sm font-extrabold text-[#087963]">
                      {sqliteStatus.counts.students} / {sqliteStatus.counts.teachers}
                    </div>
                    <div className="text-[10px] text-text-muted">Santri / Akun Guru</div>
                  </div>
                  <div className="p-2 rounded-xl bg-elevated border border-border-subtle/70">
                    <div className="text-sm font-extrabold text-[#211955] dark:text-[#F8B478]">
                      {sqliteStatus.counts.submissions}
                    </div>
                    <div className="text-[10px] text-text-muted">Rekap Nilai Masuk</div>
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <a
                    href="/api/cbt/download-sqlite"
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#211955] text-[11px] font-extrabold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File .sqlite</span>
                  </a>
                  {onForceSyncSqlite && (
                    <button
                      type="button"
                      disabled={syncingSqlite}
                      onClick={async () => {
                        setSyncingSqlite(true);
                        await onForceSyncSqlite();
                        const nextSt = await fetchSqliteStatus();
                        if (nextSt) setSqliteStatus(nextSt);
                        setSyncingSqlite(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-[11px] font-extrabold transition"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${syncingSqlite ? 'animate-spin' : ''}`} />
                      <span>{syncingSqlite ? 'Menyinkronkan...' : 'Sinkronkan ke SQLite'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              {savedNotice ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#087963]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pengaturan berhasil disimpan!</span>
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
