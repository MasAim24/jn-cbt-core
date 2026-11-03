import React from 'react';
import {
  CheckCircle2,
  FileCheck2,
  Languages,
  MonitorPlay,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from '../../types/cbt';
import { MultiSegmentDonutChart } from '../illustrations/HeroIllustrations';

interface DashboardBottomSectionProps {
  schedulesCount: number;
  ungradedEssays: number;
  studentsCount: number;
  statPeriod: 'Hari Ini' | 'Minggu Ini' | 'Semester Ganjil';
  onCycleStatPeriod: () => void;
  totalHadirParticipants: number;
  totalSelesaiParticipants: number;
  totalScheduledParticipants: number;
  averageScore: string;
  onNavigate: (tab: NavTab) => void;
  onOpenStudentSim: (packetId?: string) => void;
}

export const DashboardBottomSection: React.FC<DashboardBottomSectionProps> = ({
  schedulesCount,
  ungradedEssays,
  studentsCount,
  statPeriod,
  onCycleStatPeriod,
  totalHadirParticipants,
  totalSelesaiParticipants,
  totalScheduledParticipants,
  averageScore,
  onNavigate,
  onOpenStudentSim,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: Other Applications / Modul & Kontrol Cepat CBT */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold text-text-main tracking-tight">
            Modul &amp; Kontrol Cepat CBT
          </h2>
          <span className="text-xs font-medium text-text-muted">
            Klik modul untuk membuka fitur
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
          <button
            onClick={() => onNavigate('jadwal-live')}
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-elevated border border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)] transition text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#211955] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold text-text-main truncate">
                  Pantau Live Ujian
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Ruang pengawas &amp; anti-cheat
                </div>
              </div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full bg-[#F59E0B] text-white text-[11px] font-extrabold shrink-0">
              +{schedulesCount}
            </span>
          </button>

          <button
            onClick={() => onNavigate('rekap-nilai')}
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-elevated border border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)] transition text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#087963] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold text-text-main truncate">
                  Tingkat Ketuntasan KKM
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Analisis nilai lulus KKM
                </div>
              </div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full bg-[#55E5C7] text-[#064D42] text-[11px] font-extrabold shrink-0">
              92%
            </span>
          </button>

          <button
            onClick={() => onNavigate('bank-soal')}
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-elevated border border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)] transition text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#211955] flex items-center justify-center shrink-0">
                <Languages className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold text-text-main truncate">
                  Bank Soal Arab &amp; Kitab
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  PG, PG Kompleks, B/S, Esai
                </div>
              </div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full bg-indigo-100 text-[#211955] text-[10px] font-extrabold shrink-0">
              RTL
            </span>
          </button>

          <button
            onClick={() => onOpenStudentSim()}
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-elevated border border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)] transition text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#211955] flex items-center justify-center shrink-0">
                <MonitorPlay className="w-4 h-4 optical-play-icon" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold text-text-main truncate">
                  Layar Ujian Santri/Siswa
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Uji coba pengerjaan CBT
                </div>
              </div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full bg-[#211955] text-white text-[10px] font-extrabold tracking-wider uppercase shrink-0">
              LIVE
            </span>
          </button>

          <button
            onClick={() => onNavigate('rekap-nilai')}
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-elevated border border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)] transition text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D93834] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold text-text-main truncate">
                  Koreksi Uraian &amp; Tarkib
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Penilaian rubrik esai santri
                </div>
              </div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full bg-[#F0544F] text-white text-[11px] font-extrabold shrink-0">
              +{ungradedEssays}
            </span>
          </button>

          <button
            onClick={() => onNavigate('peserta-kartu')}
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-elevated border border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)] transition text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#B85D19] flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold text-text-main truncate">
                  Kartu Ujian &amp; Presensi
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Cetak kartu PIN &amp; berita acara
                </div>
              </div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full bg-[#FFF4D6] text-[#B85D19] text-[11px] font-extrabold shrink-0">
              +{studentsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Right: Deep Royal Indigo Statistics Card ("Order statistics" in reference image) */}
      <div
        className="lg:col-span-5 rounded-[26px] p-6 text-white shadow-floating flex flex-col justify-between"
        style={{ backgroundColor: '#211955' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-[17px] font-extrabold tracking-tight text-white">
              Statistik Pelaksanaan CBT
            </h3>
            <button
              onClick={onCycleStatPeriod}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-200 hover:text-white transition"
            >
              <span>{statPeriod}</span>
              <span>▾</span>
            </button>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold text-indigo-100">
            4 Jenjang Aktif
          </span>
        </div>

        <div className="my-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-3 w-full sm:w-auto shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-2.5 whitespace-nowrap">
              <span className="text-[11px] text-indigo-200 w-14">Hadir</span>
              <span className="text-xs sm:text-[13px] font-extrabold text-white">
                {totalHadirParticipants}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2.5 whitespace-nowrap">
              <span className="text-[11px] text-indigo-200 w-14">Selesai</span>
              <span className="text-xs sm:text-[13px] font-extrabold text-white">
                {totalSelesaiParticipants}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2.5 whitespace-nowrap">
              <span className="text-[11px] text-indigo-200 w-14">Rerata</span>
              <span className="text-xs sm:text-[13px] font-extrabold text-[#55E5C7]">
                {averageScore}
              </span>
            </div>
          </div>

          <MultiSegmentDonutChart
            centerPrimary={`${totalScheduledParticipants} Santri`}
            centerSecondary="Total Terdaftar"
            segments={[
              { label: 'MTs', value: 142, color: '#F0544F' },
              { label: 'Aliyah', value: 118, color: '#F59E0B' },
              { label: 'Wustho', value: 96, color: '#55E5C7' },
              { label: 'Ulya', value: 64, color: '#8362FF' },
            ]}
          />

          <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 text-[11px] w-full sm:w-auto shrink-0">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#8362FF] shrink-0" />
              <span className="text-indigo-100">MTs (142)</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="text-indigo-100">Aliyah (118)</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#55E5C7] shrink-0" />
              <span className="text-indigo-100">Wustho (96)</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#F0544F] shrink-0" />
              <span className="text-indigo-100">&apos;Ulya (64)</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#F8B478] shrink-0" />
              <span className="text-indigo-100">Lulus KKM</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
              <span className="text-indigo-100">Susulan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
