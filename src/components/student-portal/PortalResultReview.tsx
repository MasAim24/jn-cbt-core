import React from 'react';
import { Award } from 'lucide-react';
import { ExamPacket, ExamSubmission } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface PortalResultReviewProps {
  lastSubmission: ExamSubmission;
  activePacket: ExamPacket;
  onRetryOtherPacket: () => void;
  onExitPortal: () => void;
}

export const PortalResultReview: React.FC<PortalResultReviewProps> = ({
  lastSubmission,
  activePacket,
  onRetryOtherPacket,
  onExitPortal,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-[28px] bg-elevated p-8 shadow-floating border border-border-subtle text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#14B894] flex items-center justify-center mx-auto">
          <Award className="w-9 h-9" />
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-50 text-[#211955] text-xs font-extrabold">
          {JENJANG_META[lastSubmission.jenjang].fullLabel} • {lastSubmission.mapel}
        </span>
        <h1 className="text-2xl font-extrabold text-text-main">
          Alhamdulillah, Jawaban Ujian Telah Tersimpan!
        </h1>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Hasil pengerjaan Anda telah otomatis masuk ke menu <strong>Rekap Nilai</strong> pada
          dashboard pengelola.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface">
            <span className="text-text-muted block">Skor PG</span>
            <span className="text-lg font-extrabold text-text-main">
              {lastSubmission.pgScore}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface">
            <span className="text-text-muted block">PG Kompleks</span>
            <span className="text-lg font-extrabold text-text-main">
              {lastSubmission.pgKompleksScore}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface">
            <span className="text-text-muted block">Benar/Salah</span>
            <span className="text-lg font-extrabold text-text-main">
              {lastSubmission.benarSalahScore}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface">
            <span className="text-text-muted block">Skor Esai</span>
            <span className="text-lg font-extrabold text-text-main">
              {lastSubmission.esaiScore}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-[#211955] text-white">
            <span className="text-indigo-200 block">Nilai Akhir</span>
            <span className="text-xl font-extrabold text-[#55E5C7]">
              {lastSubmission.totalScore}
            </span>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onRetryOtherPacket}
            className="px-5 py-2.5 rounded-xl bg-surface hover:bg-indigo-50 dark:hover:bg-indigo-950 text-text-main text-xs font-extrabold border border-border-subtle"
          >
            Coba Paket Jenjang Lain
          </button>
          <button
            onClick={onExitPortal}
            className="px-6 py-2.5 rounded-xl bg-[#211955] text-white text-xs font-extrabold shadow-sm"
          >
            Lihat di Rekap Nilai Dashboard &rarr;
          </button>
        </div>
      </div>

      {/* Pembahasan & Review Kunci Jawaban */}
      <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
        <h2 className="text-base font-extrabold text-text-main">
          Review Kunci Jawaban &amp; Pembahasan Soal
        </h2>
        <div className="space-y-3">
          {activePacket.questions.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-2xl bg-surface border border-border-subtle/60 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-[var(--brand-text-accent)]">
                  Soal No. {q.nomor} •{' '}
                  {q.type === 'PG'
                    ? 'Pilihan Ganda'
                    : q.type === 'PG_KOMPLEKS'
                    ? 'PG Kompleks'
                    : q.type === 'BENAR_SALAH'
                    ? 'Benar / Salah'
                    : 'Esai / Tarkib'}
                </span>
                <span className="font-bold text-[#087963] whitespace-nowrap">
                  Bobot: {q.weight} Poin
                </span>
              </div>
              {q.arabicPrompt && (
                <div
                  dir="rtl"
                  className="rounded-xl bg-[#FFF8F1] dark:bg-indigo-950/50 border border-[#FCD9BD] px-4 py-3 text-right font-kitab text-xl leading-[2.15] text-[#1E1645] dark:text-amber-100"
                >
                  {q.arabicPrompt}
                </div>
              )}
              <p className="font-semibold text-text-main leading-relaxed">{q.prompt}</p>
              {q.pembahasan && (
                <div className="pt-1.5 border-t border-border-subtle/50 text-text-muted leading-relaxed">
                  <strong className="text-text-main">Pembahasan: </strong>
                  {q.pembahasan}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
