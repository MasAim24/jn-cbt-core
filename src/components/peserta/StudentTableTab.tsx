import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Student, Teacher } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';
import { CornerTableSticker } from '../common/CornerStickerBadge';

interface StudentTableTabProps {
  students: Student[];
  onEditStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export const StudentTableTab: React.FC<StudentTableTabProps> = ({
  students,
  onEditStudent,
  onDeleteStudent,
}) => {
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
                    NISN/NISM: {s.nisn}
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
}

export const TeacherGridTab: React.FC<TeacherGridTabProps> = ({ teachers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teachers.map((t) => (
        <div
          key={t.id}
          className="rounded-[22px] bg-elevated p-5 shadow-card border border-border-subtle/60 flex items-start justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#211955] text-[10px] font-extrabold">
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
            </div>
            <h3 className="text-sm font-extrabold text-text-main">
              {t.nama}, {t.gelar}
            </h3>
            <p className="text-xs text-text-muted">Bidang Ampu: {t.mapelAmpu}</p>
            <p className="text-[11px] font-mono text-text-muted">
              NIP/NIY: {t.nip} • {t.noHp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
