import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  ExamPacket,
  ExamSchedule,
  Jenjang,
  SchoolSettings,
  Student,
  Teacher,
  UserRole,
} from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';
import { DieCutStickerImage } from '../common/CornerStickerBadge';

export interface AuthenticatedSession {
  role: UserRole;
  id: string;
  name: string;
  badgeRole: string;
  avatarInitials: string;
  jenjang?: Jenjang;
  studentId?: string;
  packetId?: string;
}

interface LoginPortalViewProps {
  students: Student[];
  teachers: Teacher[];
  schedules: ExamSchedule[];
  packets: ExamPacket[];
  settings: SchoolSettings;
  onLoginSuccess: (session: AuthenticatedSession) => void;
}

export const LoginPortalView: React.FC<LoginPortalViewProps> = ({
  students,
  teachers,
  schedules,
  packets,
  settings,
  onLoginSuccess,
}) => {
  const [loginTab, setLoginTab] = useState<'siswa' | 'guru' | 'admin'>('siswa');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Login State
  const firstStudent = students[0];
  const firstSchedule =
    schedules.find((s) => s.jenjang === firstStudent?.jenjang) || schedules[0];
  const [nomorPeserta, setNomorPeserta] = useState(firstStudent?.nomorPeserta || '26-MTS-001');
  const [pinSesi, setPinSesi] = useState(firstStudent?.pin || '482910');
  const [tokenRuang, setTokenRuang] = useState(firstSchedule?.token || 'JN849K');

  // Teacher Login State
  const firstTeacher = teachers[0];
  const [teacherNip, setTeacherNip] = useState(firstTeacher?.nip || '198204122009011004');
  const [teacherPass, setTeacherPass] = useState('guru2026');

  // Admin Login State
  const [adminUser, setAdminUser] = useState('admin@jabalnur.sch.id');
  const [adminPass, setAdminPass] = useState('admin123');

  const getInitials = (fullName: string) => {
    const clean = fullName
      .replace(/^(Ust\.|Ustadzah|KH\.|Kyai|Dr\.|H\.|Hj\.|M\.|\s)+/gi, '')
      .trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase() || 'JN';
  };

  const handleSelectDemoStudent = (s: Student) => {
    setErrorMsg(null);
    setNomorPeserta(s.nomorPeserta);
    setPinSesi(s.pin);
    const sch = schedules.find((item) => item.jenjang === s.jenjang) || schedules[0];
    if (sch) setTokenRuang(sch.token);
  };

  const handleSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const matchedStudent = students.find(
      (s) => s.nomorPeserta.toLowerCase() === nomorPeserta.trim().toLowerCase()
    );
    if (!matchedStudent) {
      setErrorMsg('Nomor Peserta CBT tidak ditemukan dalam database peserta.');
      return;
    }
    if (matchedStudent.pin !== pinSesi.trim()) {
      setErrorMsg(
        `PIN Sesi tidak sesuai untuk peserta ${matchedStudent.nama}. (Gunakan PIN: ${matchedStudent.pin})`
      );
      return;
    }

    const validSchedule = schedules.find(
      (sch) => sch.token.toUpperCase() === tokenRuang.trim().toUpperCase()
    );
    const targetPacket =
      packets.find((p) => p.id === validSchedule?.packetId) ||
      packets.find((p) => p.jenjang === matchedStudent.jenjang) ||
      packets[0];

    onLoginSuccess({
      role: 'siswa',
      id: matchedStudent.id,
      name: matchedStudent.nama,
      badgeRole: `Peserta ${matchedStudent.jenjang} (${matchedStudent.kelas})`,
      avatarInitials: getInitials(matchedStudent.nama),
      jenjang: matchedStudent.jenjang,
      studentId: matchedStudent.id,
      packetId: targetPacket?.id,
    });
  };

  const handleSubmitTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const matchedTeacher = teachers.find(
      (t) =>
        t.nip.toLowerCase() === teacherNip.trim().toLowerCase() ||
        t.nama.toLowerCase().includes(teacherNip.trim().toLowerCase())
    );
    if (!matchedTeacher) {
      setErrorMsg('NIP / NIY Guru atau Pengawas tidak ditemukan.');
      return;
    }
    if (teacherPass.trim().length < 4) {
      setErrorMsg('Kata sandi minimal 4 karakter.');
      return;
    }

    onLoginSuccess({
      role: 'guru',
      id: matchedTeacher.id,
      name: `${matchedTeacher.nama}, ${matchedTeacher.gelar}`,
      badgeRole: `${matchedTeacher.peran} (${matchedTeacher.jenjangAmpu.join(', ')})`,
      avatarInitials: getInitials(matchedTeacher.nama),
      jenjang: matchedTeacher.jenjangAmpu[0],
    });
  };

  const handleSubmitAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adminUser.trim() || adminPass.trim().length < 4) {
      setErrorMsg('Masukkan Username dan Kata Sandi Operator yang valid.');
      return;
    }

    onLoginSuccess({
      role: 'admin',
      id: 'adm-01',
      name: 'Ust. Ahmad Fauzi, M.Kom',
      badgeRole: 'Operator Utama CBT',
      avatarInitials: 'AF',
    });
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: 'var(--bg-outer-frame)' }}
    >
      <div className="max-w-5xl w-full rounded-[34px] bg-elevated shadow-floating border border-border-subtle/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Branding & Multi-Jenjang Information Column (5 cols) */}
        <div className="lg:col-span-5 bg-[#211955] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient radial glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-16 w-72 h-72 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(248, 180, 120, 0.35) 0%, rgba(20, 184, 148, 0.20) 60%, transparent 100%)',
            }}
          />

          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#F8B478] text-[#1E1645] font-extrabold text-base flex items-center justify-center shadow-md">
                JN
              </div>
              <div>
                <div className="text-base font-extrabold tracking-tight">
                  {settings.namaAplikasi}
                </div>
                <div className="text-[11px] text-indigo-200 font-semibold">
                  TP {settings.tahunAjaran} • Semester {settings.semester}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#F8B478] text-[11px] font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Portal Autentikasi Terpadu 4 Marhalah</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                Sistem Ujian Berbasis Komputer &amp; Imtihan Kitab
              </h1>
              <p className="text-xs text-indigo-200 leading-relaxed">
                {settings.namaYayasan} — Melayani pelaksanaan asesmen tingkat{' '}
                <strong className="text-white">
                  MTs, Madrasah Aliyah, PDF Wustho, dan Ma&apos;had &apos;Ulya
                </strong>
                .
              </p>
            </div>

            {/* 4 Jenjang Badges */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
              {(['MTs', 'MA', 'Wustho', 'Ulya'] as Jenjang[]).map((j) => (
                <div
                  key={j}
                  className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#55E5C7] shrink-0" />
                  <div className="truncate">
                    <div className="font-extrabold text-white truncate">
                      {JENJANG_META[j].shortLabel}
                    </div>
                    <div className="text-[10px] text-indigo-200 truncate">
                      {JENJANG_META[j].fullLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Sticker Emblem & Security Info */}
          <div className="relative z-10 pt-8 flex items-end justify-between gap-4">
            <div className="space-y-1.5 text-[11px] text-indigo-200">
              <div className="inline-flex items-center gap-1.5 font-extrabold text-[#55E5C7]">
                <ShieldCheck className="w-4 h-4" />
                <span>Enkripsi Token &amp; Anti-Cheat Aktif</span>
              </div>
              <p className="leading-relaxed">
                Gunakan Nomor Peserta, PIN Sesi 6-Digit, dan Token Ruang yang tertera pada Kartu
                Ujian.
              </p>
            </div>
            <DieCutStickerImage
              type="cbt-hero"
              className="w-24 h-24 sm:w-28 sm:h-28 rotate-[-6deg] shrink-0"
            />
          </div>
        </div>

        {/* Right Login Form Column (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-text-main">
                Masuk ke Sesi Aplikasi CBT
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Pilih jalur akses sesuai peran Anda (Santri/Peserta, Guru/Pengawas, atau Operator).
              </p>
            </div>

            {/* 3 Role Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-surface border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => {
                  setLoginTab('siswa');
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold transition ${
                  loginTab === 'siswa'
                    ? 'bg-[#211955] text-white shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Santri / Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginTab('guru');
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold transition ${
                  loginTab === 'guru'
                    ? 'bg-[#211955] text-white shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Guru / Pengawas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginTab('admin');
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold transition ${
                  loginTab === 'admin'
                    ? 'bg-[#211955] text-white shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Admin / Operator</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs font-bold text-[#D93834]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: SANTRI / PESERTA UJIAN */}
            {loginTab === 'siswa' && (
              <form onSubmit={handleSubmitStudent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-extrabold text-text-main block mb-1.5">
                      Nomor Peserta CBT
                    </label>
                    <input
                      type="text"
                      required
                      value={nomorPeserta}
                      onChange={(e) => setNomorPeserta(e.target.value.toUpperCase())}
                      placeholder="Contoh: 26-MTS-001"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle font-mono font-bold text-text-main focus:outline-none focus:border-[#211955]"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-text-main block mb-1.5">
                      PIN Sesi (6 Digit di Kartu)
                    </label>
                    <input
                      type="text"
                      required
                      value={pinSesi}
                      onChange={(e) => setPinSesi(e.target.value)}
                      placeholder="Contoh: 482910"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle font-mono font-bold text-text-main focus:outline-none focus:border-[#211955]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-text-main block mb-1.5">
                    Token Ruang Ujian Aktif
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FFF8F1] dark:bg-indigo-950/60 border border-[#FCD9BD]">
                    <KeyRound className="w-4 h-4 text-[#B85D19] shrink-0" />
                    <input
                      type="text"
                      required
                      value={tokenRuang}
                      onChange={(e) => setTokenRuang(e.target.value.toUpperCase())}
                      className="w-full bg-transparent font-mono font-extrabold text-sm text-text-main tracking-widest focus:outline-none"
                    />
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-[#087963] text-[10px] font-extrabold whitespace-nowrap">
                      TOKEN AKTIF
                    </span>
                  </div>
                </div>

                {/* Quick-Fill Demo Student Selector across 4 Jenjang */}
                <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-text-muted">
                      Klik Akun Santri Demo untuk Isi Kredensial Otomatis:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(['MTs', 'MA', 'Wustho', 'Ulya'] as Jenjang[]).map((j) => {
                      const std = students.find((s) => s.jenjang === j);
                      if (!std) return null;
                      const isSelected = std.nomorPeserta === nomorPeserta;
                      return (
                        <button
                          key={std.id}
                          type="button"
                          onClick={() => handleSelectDemoStudent(std)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-elevated border-[#211955] ring-2 ring-indigo-500/15'
                              : 'bg-elevated/60 hover:bg-elevated border-border-subtle'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-extrabold text-text-main truncate">
                              {std.nama}
                            </div>
                            <div className="text-[10px] font-mono text-text-muted">
                              {std.nomorPeserta} • PIN: {std.pin}
                            </div>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ml-2"
                            style={{
                              backgroundColor: JENJANG_META[j].badgeBg,
                              color: JENJANG_META[j].badgeText,
                            }}
                          >
                            {j}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Verifikasi Token &amp; Masuk Ruang Ujian</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: DEWAN GURU & PENGAWAS */}
            {loginTab === 'guru' && (
              <form onSubmit={handleSubmitTeacher} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-text-main block mb-1.5">
                    NIP / NIY Dewan Guru atau Pengawas CBT
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherNip}
                    onChange={(e) => setTeacherNip(e.target.value)}
                    placeholder="Masukkan NIP/NIY..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle font-mono font-bold text-text-main focus:outline-none focus:border-[#211955]"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-text-main block mb-1.5">
                    Kata Sandi Pengampu / Pengawas
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={teacherPass}
                      onChange={(e) => setTeacherPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle font-mono font-bold text-text-main focus:outline-none focus:border-[#211955]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-2.5 text-text-muted hover:text-text-main"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick-Fill Teacher Accounts */}
                <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle/80 space-y-2">
                  <span className="text-[11px] font-extrabold text-text-muted block">
                    Pilih Akun Guru / Pengawas Terdaftar (1-Klik Isi):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {teachers.slice(0, 4).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTeacherNip(t.nip);
                          setTeacherPass('guru2026');
                          setErrorMsg(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          teacherNip === t.nip
                            ? 'bg-elevated border-[#211955] ring-2 ring-indigo-500/15'
                            : 'bg-elevated/60 hover:bg-elevated border-border-subtle'
                        }`}
                      >
                        <div className="font-extrabold text-text-main truncate">
                          {t.nama}, {t.gelar}
                        </div>
                        <div className="text-[10px] text-text-muted truncate">
                          {t.peran} • {t.mapelAmpu}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Masuk sebagai Guru / Pengawas CBT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 3: ADMIN / OPERATOR UTAMA */}
            {loginTab === 'admin' && (
              <form onSubmit={handleSubmitAdmin} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-text-main block mb-1.5">
                    Username / Email Operator Utama
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle font-bold text-text-main focus:outline-none focus:border-[#211955]"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-text-main block mb-1.5">
                    Kata Sandi Administrator
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle font-mono font-bold text-text-main focus:outline-none focus:border-[#211955]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-2.5 text-text-muted hover:text-text-main"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#211955] shrink-0" />
                    <div>
                      <div className="font-extrabold text-text-main">
                        Akses Penuh Pusat Kendali CBT
                      </div>
                      <div className="text-[11px] text-text-muted">
                        Kelola 4 jenjang, bank soal, jadwal token, kartu peserta, dan konfigurasi
                        server.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminUser('admin@jabalnur.sch.id');
                      setAdminPass('admin123');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-elevated border border-border-subtle font-extrabold text-[11px] text-[#211955] shrink-0"
                  >
                    Isi Default
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Masuk ke Dashboard Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1 font-semibold text-[#087963]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Server CBT Lokal Siap • Sinkronisasi Otomatis</span>
            </span>
            <span>Ketua Panitia: {settings.ketuaPanitia}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
