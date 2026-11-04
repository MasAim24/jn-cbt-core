import React from 'react';
import { Copy, KeyRound, MonitorPlay, RefreshCw, Trash2 } from 'lucide-react';
import { ExamSchedule } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface ScheduleCardGridProps {
  schedules: ExamSchedule[];
  totalSchedulesCount: number;
  activeScheduleId?: string;
  copiedId: string | null;
  onSelectScheduleId: (id: string) => void;
  onCycleStatus: (sch: ExamSchedule) => void;
  onCopyToken: (id: string, token: string) => void;
  onRefreshToken: (id: string) => void;
  onDeleteSchedule?: (id: string) => void;
  onOpenStudentSim: (packetId: string) => void;
}

export const ScheduleCardGrid: React.FC<ScheduleCardGridProps> = ({
  schedules,
  totalSchedulesCount,
  activeScheduleId,
  copiedId,
  onSelectScheduleId,
  onCycleStatus,
  onCopyToken,
  onRefreshToken,
  onDeleteSchedule,
  onOpenStudentSim,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {schedules.length === 0 && (
        <div className="col-span-full rounded-[24px] bg-elevated p-10 text-center shadow-card border border-dashed border-border-subtle space-y-2">
          <div className="text-sm font-extrabold text-text-main">
            Belum Ada Jadwal Sesi Ujian CBT Aktif
          </div>
          <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
            Seluruh jadwal dummy telah dibersihkan. Buat paket soal terlebih dahulu di menu{' '}
            <strong className="text-text-main">Bank Soal &amp; Kitab</strong>, lalu klik tombol{' '}
            <strong className="text-text-main">+ Buat Jadwal Sesi Baru</strong> di kanan atas untuk
            membuka sesi ujian dan menghasilkan Token Ruang.
          </p>
        </div>
      )}
      {schedules.map((sch) => {
        const meta = JENJANG_META[sch.jenjang];
        const isSelected = activeScheduleId === sch.id;

        return (
          <div
            key={sch.id}
            onClick={() => onSelectScheduleId(sch.id)}
            className={`cursor-pointer rounded-[24px] bg-elevated p-5 shadow-card border transition-all ${
              isSelected
                ? 'border-[var(--brand-text-accent)] ring-2 ring-indigo-500/20'
                : 'border-border-subtle/60 hover:border-[var(--brand-text-accent)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap"
                  style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                >
                  {meta.fullLabel}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCycleStatus(sch);
                  }}
                  title="Klik untuk mengganti status sesi (LIVE / COMPLETED / UPCOMING)"
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap transition ${
                    sch.status === 'LIVE'
                      ? 'bg-teal-50 text-[#087963]'
                      : sch.status === 'UPCOMING'
                      ? 'bg-amber-50 text-[#D97706]'
                      : 'bg-surface text-text-muted'
                  }`}
                >
                  ● {sch.status}
                </button>
              </div>

              {/* Token Pill inside Schedule Card */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4D6] text-[#B85D19] text-xs font-extrabold border border-[#FCD9BD] whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono tracking-wider">{sch.token}</span>
                <button
                  onClick={() => onCopyToken(sch.id, sch.token)}
                  className="hover:text-[#211955] ml-1"
                  title="Salin Token"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRefreshToken(sch.id)}
                  className="hover:text-[#211955]"
                  title="Acak Token Baru"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h3 className="text-base font-extrabold text-text-main mt-3 leading-snug">
              {sch.packetTitle}
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              {sch.ruang} • Pengawas: {sch.pengawas}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-surface p-3 text-xs">
              <div>
                <span className="text-[11px] text-text-muted block">Waktu &amp; Durasi</span>
                <span className="font-extrabold text-text-main whitespace-nowrap">
                  {sch.waktuMulai} ({sch.durasiMenit}m)
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Kehadiran</span>
                <span className="font-extrabold text-[#087963] whitespace-nowrap">
                  {sch.hadirCount} / {sch.totalPeserta} Santri
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Sudah Submit</span>
                <span className="font-extrabold text-[var(--brand-text-accent)] whitespace-nowrap">
                  {sch.selesaiCount} Selesai
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-[11px] font-semibold text-text-muted">
                {copiedId === sch.id
                  ? '✓ Token disalin ke clipboard!'
                  : `Kelas: ${sch.kelasTarget}`}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {onDeleteSchedule && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSchedule(sch.id);
                    }}
                    title="Hapus Jadwal"
                    className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#D93834] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStudentSim(sch.packetId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#211955] text-white text-xs font-extrabold hover:bg-[#2d2270] whitespace-nowrap transition"
                >
                  <MonitorPlay className="w-3.5 h-3.5 shrink-0 optical-play-icon" />
                  <span>Masuk Ujian Siswa</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
