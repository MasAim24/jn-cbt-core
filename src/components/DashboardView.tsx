import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Copy,
  GraduationCap,
  Languages,
  MonitorPlay,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import {
  ExamPacket,
  ExamSchedule,
  ExamSubmission,
  Jenjang,
  JenjangFilter,
  NavTab,
  Student,
} from '../types/cbt';
import { JENJANG_META } from '../data/initialData';
import {
  GreetingCharacterIllustration,
  ProctorTokenIllustration,
} from './illustrations/HeroIllustrations';
import { DashboardBottomSection } from './dashboard/DashboardBottomSection';
import { AuthenticatedSession } from './auth/LoginPortalView';

interface DashboardViewProps {
  selectedJenjang: JenjangFilter;
  onSelectJenjang: (j: JenjangFilter) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenStudentSim: (packetId?: string) => void;
  packets: ExamPacket[];
  schedules: ExamSchedule[];
  students: Student[];
  submissions: ExamSubmission[];
  onRefreshToken: (scheduleId: string) => void;
  onOpenShowcase?: () => void;
  authSession?: AuthenticatedSession | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedJenjang,
  onSelectJenjang,
  onNavigate,
  onOpenStudentSim,
  packets,
  schedules,
  students,
  submissions,
  onRefreshToken,
  onOpenShowcase,
  authSession,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [statPeriod, setStatPeriod] = useState<'Hari Ini' | 'Minggu Ini' | 'Semester Ganjil'>(
    'Semester Ganjil'
  );

  const activeSchedule =
    schedules.find((s) => (selectedJenjang === 'ALL' ? true : s.jenjang === selectedJenjang)) ||
    schedules[0];

  const handleCopyToken = () => {
    if (!activeSchedule) return;
    navigator.clipboard?.writeText(activeSchedule.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1800);
  };

  const mtsCount = students.filter((s) => s.jenjang === 'MTs').length;
  const maCount = students.filter((s) => s.jenjang === 'MA').length;
  const wusthoCount = students.filter((s) => s.jenjang === 'Wustho').length;
  const ulyaCount = students.filter((s) => s.jenjang === 'Ulya').length;

  const jenjangCards: {
    jenjang: Jenjang;
    title: string;
    subtitle: string;
    countLabel: string;
    totalCount: number;
    maxCap: number;
    iconBg: string;
    iconColor: string;
    labelColorClass: string;
    barColor: string;
    trackColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      jenjang: 'MTs',
      title: 'Tsanawiyah (MTs)',
      subtitle: mtsCount > 0 ? `${mtsCount} peserta terdaftar` : 'Siap input santri MTs',
      countLabel: `${mtsCount} santri`,
      totalCount: mtsCount,
      maxCap: Math.max(100, mtsCount + 20),
      iconBg: '#EAE6FF',
      iconColor: '#211955',
      labelColorClass: 'text-[#211955] dark:text-indigo-300',
      barColor: '#3B28CC',
      trackColor: '#EAE6FF',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      jenjang: 'MA',
      title: 'Aliyah (MA)',
      subtitle: maCount > 0 ? `${maCount} peserta terdaftar` : 'Siap input santri MA',
      countLabel: `${maCount} santri`,
      totalCount: maCount,
      maxCap: Math.max(100, maCount + 20),
      iconBg: '#FFF4D6',
      iconColor: '#D97706',
      labelColorClass: 'text-[#D97706] dark:text-amber-300',
      barColor: '#F59E0B',
      trackColor: '#FFF4D6',
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      jenjang: 'Wustho',
      title: 'Diniyah Wustho',
      subtitle: wusthoCount > 0 ? `${wusthoCount} peserta terdaftar` : 'Takhassus Jurumiyah & Fiqih',
      countLabel: `${wusthoCount} santri`,
      totalCount: wusthoCount,
      maxCap: Math.max(100, wusthoCount + 20),
      iconBg: '#E0F8F5',
      iconColor: '#087963',
      labelColorClass: 'text-[#087963] dark:text-teal-300',
      barColor: '#14B894',
      trackColor: '#E0F8F5',
      icon: <ScrollText className="w-5 h-5" />,
    },
    {
      jenjang: 'Ulya',
      title: "Ma'had 'Ulya",
      subtitle: ulyaCount > 0 ? `${ulyaCount} peserta terdaftar` : 'Alfiyah & Bahtsul Masail',
      countLabel: `${ulyaCount} santri`,
      totalCount: ulyaCount,
      maxCap: Math.max(100, ulyaCount + 20),
      iconBg: '#FFE8E5',
      iconColor: '#D93834',
      labelColorClass: 'text-[#D93834] dark:text-rose-300',
      barColor: '#F0544F',
      trackColor: '#FFE8E5',
      icon: <Languages className="w-5 h-5" />,
    },
  ];

  const ungradedEssays = submissions.filter((s) => !s.isEsaiGraded).length;
  const averageScore =
    submissions.length > 0
      ? (submissions.reduce((acc, s) => acc + s.totalScore, 0) / submissions.length).toFixed(1)
      : '0.0';
  const kkmPassRate =
    submissions.length > 0
      ? Math.round(
          (submissions.filter((s) => s.totalScore >= s.kkm).length / submissions.length) * 100
        )
      : 0;

  const totalScheduledParticipants = schedules.reduce((acc, s) => acc + s.totalPeserta, 0);
  const totalHadirParticipants = schedules.reduce((acc, s) => acc + s.hadirCount, 0);
  const totalSelesaiParticipants = schedules.reduce((acc, s) => acc + s.selesaiCount, 0);

  return (
    <div className="space-y-7">
      {/* ROW 1: HERO GREETING CARD (LEFT) + LIVE TOKEN & SERVER CARD (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className="lg:col-span-7 relative overflow-hidden rounded-[26px] px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card"
          style={{
            background: 'linear-gradient(135deg, #F8B579 0%, #F4A562 100%)',
            color: '#1E1645',
          }}
        >
          <div className="z-10 max-w-md space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/50 backdrop-blur-sm text-[10px] font-extrabold tracking-wider uppercase text-[#211955]">
              <Sparkles className="w-3 h-3" />
              <span>JN ExamCBTCore • TP 2026/2027</span>
            </div>
            <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#1E1645] leading-tight">
              Assalamu&apos;alaikum, {authSession?.name || 'Administrator CBT'}!
            </h1>
            <p className="text-xs sm:text-[13px] font-medium text-[#372963]/90 leading-relaxed">
              Kelola ujian berbasis komputer (CBT) dan imtihan kitab untuk tingkat{' '}
              <strong className="font-bold">MTs, Aliyah, Wustho, dan &apos;Ulya</strong> dengan
              mudah dalam satu pusat kendali!
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onOpenStudentSim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-bold transition shadow-sm"
              >
                <span className="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center">
                  <MonitorPlay className="w-3 h-3 optical-play-icon" />
                </span>
                <span>Simulasi Ujian Siswa</span>
              </button>
              <button
                onClick={() => onNavigate('bank-soal')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/60 hover:bg-white/85 text-[#211955] text-xs font-bold transition"
              >
                <span>Buka Bank Soal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="self-center sm:self-end -mb-3 sm:-mr-2 shrink-0">
            <GreetingCharacterIllustration />
          </div>
        </div>

        <div className="lg:col-span-5 relative overflow-hidden rounded-[26px] bg-elevated border border-border-subtle/70 px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
          <div className="z-10 space-y-2.5 flex-1 min-w-0">
            <h2 className="text-base sm:text-[17px] font-extrabold text-text-main tracking-tight">
              Token Sesi Ujian CBT Aktif
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Bagikan token sesi aktif kepada pengawas ruang ujian. Token dapat diacak ulang kapan
              saja demi keamanan sesi.
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF4D6] text-[#B85D19] text-xs font-extrabold border border-[#FCD9BD] whitespace-nowrap">
                <span className="w-4 h-4 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[10px] shrink-0">
                  🔑
                </span>
                <span className="tracking-wider font-mono text-[13px]">
                  {activeSchedule?.token || 'JN849K'}
                </span>
                <button
                  onClick={handleCopyToken}
                  title="Salin Token"
                  className="ml-1 p-0.5 hover:text-[#211955] transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => activeSchedule && onRefreshToken(activeSchedule.id)}
                  title="Acak Token Baru"
                  className="p-0.5 hover:text-[#211955] transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => onNavigate('jadwal-live')}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--brand-text-accent)] hover:underline whitespace-nowrap"
              >
                <span>{copiedToken ? 'Tersalin!' : 'Ruang Pengawas'}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>

          <div className="self-center sm:self-end -mb-2 -mr-2 shrink-0">
            <ProctorTokenIllustration />
          </div>
        </div>
      </div>

      {/* ROW 2: JENJANG & SESI UJIAN AKTIF (4 CARDS IN A ROW) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-extrabold text-text-main tracking-tight">
              Jenjang &amp; Sesi Ujian Aktif
            </h2>
            {selectedJenjang !== 'ALL' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-[#211955]">
                Filter: {JENJANG_META[selectedJenjang].fullLabel}
              </span>
            )}
          </div>
          <button
            onClick={() =>
              selectedJenjang !== 'ALL' ? onSelectJenjang('ALL') : onNavigate('jadwal-live')
            }
            className="text-xs font-bold text-text-muted hover:text-text-main transition"
          >
            {selectedJenjang !== 'ALL' ? 'Tampilkan Semua Jenjang' : 'Lihat Semua'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {jenjangCards.map((card) => {
            const isSelected = selectedJenjang === card.jenjang;
            const pct = Math.min(100, Math.round((card.totalCount / card.maxCap) * 100));
            const packetForJenjang = packets.find((p) => p.jenjang === card.jenjang);

            return (
              <div
                key={card.jenjang}
                onClick={() =>
                  onSelectJenjang(selectedJenjang === card.jenjang ? 'ALL' : card.jenjang)
                }
                className={`group cursor-pointer rounded-[24px] bg-elevated p-5 shadow-card border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-floating ${
                  isSelected
                    ? 'border-[var(--brand-text-accent)] ring-2 ring-indigo-500/20'
                    : 'border-border-subtle/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: card.iconBg,
                      color: card.iconColor,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-text-main truncate">
                      {card.title}
                    </h3>
                    <span className="text-[11px] font-semibold text-text-muted block truncate">
                      {JENJANG_META[card.jenjang].fullLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 text-xs text-text-muted">
                  <span className="truncate">{card.subtitle}</span>
                  {packetForJenjang && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStudentSim(packetForJenjang.id);
                      }}
                      className="text-[11px] font-bold text-[var(--brand-text-accent)] hover:underline shrink-0 whitespace-nowrap"
                    >
                      Uji Coba &rarr;
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-end">
                    <span
                      className={`text-[11px] font-extrabold whitespace-nowrap ${card.labelColorClass}`}
                    >
                      {card.countLabel}
                    </span>
                  </div>
                  <div
                    className="w-full h-[5px] rounded-full overflow-hidden"
                    style={{ backgroundColor: card.trackColor }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: card.barColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedJenjang !== 'ALL' && activeSchedule && (
          <div className="rounded-[22px] bg-elevated p-4 shadow-card border border-[var(--brand-text-accent)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="px-3 py-1 rounded-xl text-xs font-extrabold shrink-0 whitespace-nowrap"
                style={{
                  backgroundColor: JENJANG_META[selectedJenjang].badgeBg,
                  color: JENJANG_META[selectedJenjang].badgeText,
                }}
              >
                {JENJANG_META[selectedJenjang].fullLabel}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-text-main truncate">
                  Sesi Aktif: {activeSchedule.packetTitle} ({activeSchedule.ruang})
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Token: <strong className="font-mono">{activeSchedule.token}</strong> • Pengawas:{' '}
                  {activeSchedule.pengawas}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenStudentSim(activeSchedule.packetId)}
                className="px-3.5 py-1.5 rounded-xl bg-[#211955] text-white text-xs font-extrabold whitespace-nowrap"
              >
                Simulasi Soal {JENJANG_META[selectedJenjang].shortLabel}
              </button>
              <button
                onClick={() => onNavigate('bank-soal')}
                className="px-3.5 py-1.5 rounded-xl bg-surface text-text-main border border-border-subtle text-xs font-bold whitespace-nowrap"
              >
                Kelola Bank Soal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ROW 3: BOTTOM SPLIT */}
      <DashboardBottomSection
        schedulesCount={schedules.length}
        ungradedEssays={ungradedEssays}
        studentsCount={students.length}
        mtsCount={mtsCount}
        maCount={maCount}
        wusthoCount={wusthoCount}
        ulyaCount={ulyaCount}
        kkmPassRate={kkmPassRate}
        statPeriod={statPeriod}
        onCycleStatPeriod={() =>
          setStatPeriod((prev) =>
            prev === 'Semester Ganjil'
              ? 'Minggu Ini'
              : prev === 'Minggu Ini'
              ? 'Hari Ini'
              : 'Semester Ganjil'
          )
        }
        totalHadirParticipants={totalHadirParticipants}
        totalSelesaiParticipants={totalSelesaiParticipants}
        totalScheduledParticipants={totalScheduledParticipants}
        averageScore={averageScore}
        onNavigate={onNavigate}
        onOpenStudentSim={onOpenStudentSim}
      />
    </div>
  );
};
