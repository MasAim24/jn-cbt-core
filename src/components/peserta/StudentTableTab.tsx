import React, { useState } from 'react';
import {
  Edit3,
  Eye,
  EyeOff,
  FileUp,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  NavTab,
  SchoolSettings,
  Student,
  Teacher,
  TeacherPeran,
} from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';
import { CornerTableSticker } from '../common/CornerStickerBadge';

const TAB_LABELS: Record<NavTab, string> = {
  dashboard: 'Beranda',
  'bank-soal': 'Bank Soal',
  'jadwal-live': 'Jadwal & Proctor',
  'peserta-kartu': 'Data Santri & Kartu',
  'rekap-nilai': 'Rekap Nilai',
  pengaturan: 'Pengaturan',
};

interface StudentTableTabProps {
  students: Student[];
  onEditStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onAddFirstStudent?: () => void;
  onOpenBulkImport?: () => void;
}

export const StudentTableTab: React.FC<StudentTableTabProps> = ({
  students,
  onEditStudent,
  onDeleteStudent,
  onAddFirstStudent,
  onOpenBulkImport,
}) => {
  if (students.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[26px] bg-elevated p-8 sm:p-10 shadow-card border border-border-subtle/60 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#211955] dark:text-[#F8B478] flex items-center justify-center mx-auto shadow-sm">
          <Users className="w-7 h-7" />
        </div>
        <div className="max-w-lg mx-auto space-y-1.5">
          <h3 className="text-base sm:text-lg font-extrabold text-text-main">
            Database Santri / Siswa Masih Kosong (Siap Input Data Real)
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Seluruh data dummy santri telah dibersihkan. Silakan tambahkan data santri real di
            lapangan secara satuan atau gunakan fitur <strong>Import Kolektif CSV/Excel</strong>{' '}
            untuk menghasilkan Nomor Peserta CBT &amp; PIN Login 6 digit secara otomatis.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onAddFirstStudent && (
            <button
              type="button"
              onClick={onAddFirstStudent}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-extrabold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Input Data Santri Pertama</span>
            </button>
          )}
          {onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-xs font-extrabold transition"
            >
              <FileUp className="w-4 h-4" />
              <span>Import Kolektif CSV / Excel</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 overflow-x-auto">
      <CornerTableSticker
        type="peserta-kartu"
        glowTone="indigo-gold"
        position="bottom-right"
        sizeClass="w-32 h-32 sm:w-40 sm:h-40"
        opacityClass="opacity-80"
      />
      <table className="relative z-10 w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border-subtle text-text-muted uppercase text-[11px] whitespace-nowrap">
            <th className="py-3 px-3">Nomor Peserta CBT</th>
            <th className="py-3 px-3">Nama Lengkap Santri/Siswa</th>
            <th className="py-3 px-3">Jenjang</th>
            <th className="py-3 px-3">Kelas / Marhalah</th>
            <th className="py-3 px-3">Ruang &amp; Sesi</th>
            <th className="py-3 px-3">PIN Login</th>
            <th className="py-3 px-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle/60">
          {students.map((s) => {
            const meta = JENJANG_META[s.jenjang];
            return (
              <tr key={s.id} className="hover:bg-surface/60 transition">
                <td className="py-3.5 px-3 font-mono font-bold text-[var(--brand-text-accent)] whitespace-nowrap">
                  {s.nomorPeserta}
                </td>
                <td className="py-3.5 px-3">
                  <div className="font-extrabold text-text-main whitespace-nowrap">
                    {s.nama}
                  </div>
                  <div className="text-[11px] text-text-muted whitespace-nowrap">
                    NISN/NISM: {s.nisn} • {s.gender === 'L' ? 'Putra (L)' : 'Putri (P)'}
                  </div>
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap"
                    style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                  >
                    {meta.fullLabel}
                  </span>
                </td>
                <td className="py-3.5 px-3 font-bold text-text-main whitespace-nowrap">
                  {s.kelas}
                </td>
                <td className="py-3.5 px-3 text-text-muted whitespace-nowrap">
                  {s.ruang} • {s.sesi}
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FFF4D6] text-[#B85D19] font-mono font-extrabold">
                    {s.pin}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onEditStudent(s)}
                      className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-main transition"
                      title="Edit Data Peserta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteStudent(s.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-[#D93834] transition"
                      title="Hapus Peserta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface TeacherGridTabProps {
  teachers: Teacher[];
  settings?: SchoolSettings;
  onEditTeacher?: (t: Teacher) => void;
  onDeleteTeacher?: (id: string) => void;
  onQuickAddRole?: (role: TeacherPeran) => void;
}

export const TeacherGridTab: React.FC<TeacherGridTabProps> = ({
  teachers,
  settings,
  onEditTeacher,
  onDeleteTeacher,
  onQuickAddRole,
}) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const toggleShowPass = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5">
      {/* Master Admin Account Banner + Quick Role Add Bar */}
      <div className="rounded-[24px] bg-gradient-to-r from-[#211955] to-[#312578] text-white p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[#F8B478] text-[10px] font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Akun Utama Sistem (Master Administrator)</span>
          </div>
          <h3 className="text-base font-extrabold">
            {settings?.adminName || 'Administrator Utama CBT'}
          </h3>
          <p className="text-xs text-indigo-200">
            Username Login:{' '}
            <code className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono font-bold">
              {settings?.adminUsername || 'admin'}
            </code>{' '}
            • Hak Akses: <strong>Penuh (Seluruh Modul &amp; Manajemen Akun)</strong>
          </p>
        </div>

        {onQuickAddRole && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onQuickAddRole('Kepala Madrasah / Mudir')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8B478] hover:bg-[#f3a35c] text-[#1E1645] text-xs font-extrabold transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Kepala Madrasah / Mudir</span>
            </button>
            <button
              type="button"
              onClick={() => onQuickAddRole('Wali Kelas')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Wali Kelas</span>
            </button>
            <button
              type="button"
              onClick={() => onQuickAddRole('Guru Mapel')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Guru Mapel</span>
            </button>
          </div>
        )}
      </div>

      {teachers.length === 0 ? (
        <div className="rounded-[26px] bg-elevated p-8 sm:p-10 shadow-card border border-border-subtle/60 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#211955] dark:text-[#F8B478] flex items-center justify-center mx-auto shadow-sm">
            <UserCheck className="w-7 h-7" />
          </div>
          <div className="max-w-lg mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-text-main">
              Belum Ada Akun Kepala Madrasah, Wali Kelas, atau Guru Mapel
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Seluruh data dummy guru telah dihapus. Dari akun Admin ini, Anda dapat menginput akun{' '}
              <strong>Kepala Madrasah / Kepala Diniyah (Mudir)</strong>,{' '}
              <strong>Wali Kelas</strong>, <strong>Guru Mapel</strong>, dan{' '}
              <strong>Pengawas Ruang</strong> beserta username, password, dan hak akses menu login
              masing-masing.
            </p>
          </div>
          {onQuickAddRole && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onQuickAddRole('Kepala Madrasah / Mudir')}
                className="px-4 py-2.5 rounded-xl bg-[#211955] text-white text-xs font-extrabold shadow-sm"
              >
                + Input Kepala Madrasah / Diniyah
              </button>
              <button
                type="button"
                onClick={() => onQuickAddRole('Wali Kelas')}
                className="px-4 py-2.5 rounded-xl bg-amber-50 text-[#B85D19] border border-amber-200 text-xs font-extrabold"
              >
                + Input Wali Kelas
              </button>
              <button
                type="button"
                onClick={() => onQuickAddRole('Guru Mapel')}
                className="px-4 py-2.5 rounded-xl bg-teal-50 text-[#087963] border border-teal-200 text-xs font-extrabold"
              >
                + Input Guru Mapel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((t) => {
            const roleBadgeStyle =
              t.peran === 'Kepala Madrasah / Mudir'
                ? 'bg-amber-100 text-[#B85D19]'
                : t.peran === 'Wali Kelas'
                ? 'bg-teal-100 text-[#087963]'
                : t.peran === 'Guru Mapel'
                ? 'bg-indigo-100 text-[#211955]'
                : 'bg-rose-100 text-[#D93834]';

            const isPassShown = visiblePasswords[t.id];

            return (
              <div
                key={t.id}
                className="rounded-[24px] bg-elevated p-5 shadow-card border border-border-subtle/60 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${roleBadgeStyle}`}
                      >
                        {t.peran}
                      </span>
                      {t.jenjangAmpu.map((j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                          style={{
                            backgroundColor: JENJANG_META[j].badgeBg,
                            color: JENJANG_META[j].badgeText,
                          }}
                        >
                          {JENJANG_META[j].shortLabel}
                        </span>
                      ))}
                      {t.kelasBinaan && (
                        <span className="px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-text-main text-[10px] font-extrabold">
                          Kelas: {t.kelasBinaan}
                        </span>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1 shrink-0">
                      {onEditTeacher && (
                        <button
                          type="button"
                          onClick={() => onEditTeacher(t)}
                          className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-main transition"
                          title="Edit Akun & Hak Akses"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteTeacher && (
                        <button
                          type="button"
                          onClick={() => onDeleteTeacher(t.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-[#D93834] transition"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-text-main">
                      {t.nama}
                      {t.gelar ? `, ${t.gelar}` : ''}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Jabatan / Mapel: <strong className="text-text-main">{t.mapelAmpu}</strong>
                    </p>
                    <p className="text-[11px] font-mono text-text-muted mt-0.5">
                      NIP/NIY: {t.nip || '-'} • Telp: {t.noHp || '-'}
                    </p>
                  </div>

                  {/* Login Credentials Info */}
                  <div className="p-3 rounded-xl bg-surface border border-border-subtle/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="w-3.5 h-3.5 text-[#B85D19] shrink-0" />
                      <div className="truncate">
                        <span className="text-text-muted">User:</span>{' '}
                        <strong className="font-mono text-text-main">
                          {t.username || t.nip}
                        </strong>{' '}
                        <span className="text-text-muted ml-1.5">Pass:</span>{' '}
                        <strong className="font-mono text-text-main">
                          {isPassShown ? t.password || 'guru123' : '••••••'}
                        </strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleShowPass(t.id)}
                      className="p-1 rounded-lg hover:bg-elevated text-text-muted hover:text-text-main transition shrink-0"
                      title={isPassShown ? 'Sembunyikan Password' : 'Lihat Password'}
                    >
                      {isPassShown ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Allowed NavTabs (Hak Akses) */}
                <div className="pt-2 border-t border-border-subtle/60 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-text-muted uppercase mr-1">
                    Hak Akses:
                  </span>
                  {(t.hakAkses || ['dashboard', 'bank-soal', 'rekap-nilai']).map((tab) => (
                    <span
                      key={tab}
                      className="px-2 py-0.5 rounded-md bg-teal-50/90 dark:bg-teal-950/50 text-[#087963] dark:text-teal-300 text-[10px] font-bold"
                    >
                      {TAB_LABELS[tab] || tab}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
