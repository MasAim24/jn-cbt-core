import React from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { ExamPacket, ExamSubmission } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface PortalResultReviewProps {
  lastSubmission: ExamSubmission;
  activePacket: ExamPacket;
  isRealStudentSession?: boolean;
  cloudSyncState?: 'SYNCED' | 'SYNCING' | 'PENDING_RETRY';
  onRetryCloudSync?: () => void;
  onRetryOtherPacket: () => void;
  onExitPortal: () => void;
}

export const PortalResultReview: React.FC<PortalResultReviewProps> = ({
  lastSubmission,
  activePacket,
  isRealStudentSession = false,
  cloudSyncState = 'SYNCED',
  onRetryCloudSync,
  onRetryOtherPacket,
  onExitPortal,
}) => {
  const isWaitingCloud =
    isRealStudentSession && (cloudSyncState === 'SYNCING' || cloudSyncState === 'PENDING_RETRY');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cloud Sync Verification Banner */}
      {cloudSyncState === 'PENDING_RETRY' && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#92400E] shadow-md">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-sm">
                Menunggu Koneksi Internet untuk Mengirim Nilai ke Server...
              </div>
              <p className="mt-0.5 leading-relaxed">
                Jawaban Anda sudah aman tersimpan di perangkat ini dan sedang dikirim ulang otomatis
                setiap beberapa detik. <strong>Jangan tutup halaman ini</strong> sampai status
                berubah menjadi hijau.
              </p>
            </div>
          </div>
          {onRetryCloudSync && (
            <button
              type="button"
              onClick={onRetryCloudSync}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#b45309] text-white font-extrabold shrink-0 shadow-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kirim Ulang Sekarang</span>
            </button>
          )}
        </div>
      )}

      {cloudSyncState === 'SYNCING' && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 flex items-center gap-3 text-xs font-extrabold text-[#211955] shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Sedang memverifikasi penyimpanan jawaban ke Server Cloud...</span>
        </div>
      )}

      <div className="rounded-[28px] bg-elevated p-8 shadow-floating border border-border-subtle text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#14B894] flex items-center justify-center mx-auto">
          <Award className="w-9 h-9" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-[#211955] text-xs font-extrabold">
            {JENJANG_META[lastSubmission.jenjang].fullLabel} • {lastSubmission.mapel}
          </span>
          {cloudSyncState === 'SYNCED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#087963] text-xs font-extrabold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terverifikasi Tersimpan di Server</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl font-extrabold text-text-main">
          Alhamdulillah, Jawaban Ujian Telah Tersimpan!
        </h1>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          {isRealStudentSession
            ? 'Seluruh jawaban Anda telah tercatat resmi di server ujian madrasah. Silakan lapor kepada Pengawas Ruang sebelum meninggalkan tempat duduk.'
            : 'Hasil pengerjaan simulasi Anda telah otomatis masuk ke menu Rekap Nilai pada dashboard pengelola.'}
        </p>

        {/* Official Submission Receipt Summary */}
        <div className="rounded-2xl bg-surface border border-border-subtle/80 p-4 text-left grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div>
            <span className="text-text-muted block text-[11px]">Nama Peserta</span>
            <span className="font-extrabold text-text-main">{lastSubmission.studentName}</span>
          </div>
          <div>
            <span className="text-text-muted block text-[11px]">Nomor Peserta &amp; Kelas</span>
            <span className="font-mono font-extrabold text-text-main">
              {lastSubmission.nomorPeserta} • {lastSubmission.kelas}
            </span>
          </div>
          <div>
            <span className="text-text-muted block text-[11px]">Mata Pelajaran</span>
            <span className="font-bold text-text-main">{lastSubmission.mapel}</span>
          </div>
          <div>
            <span className="text-text-muted block text-[11px]">Waktu Pengumpulan</span>
            <span className="font-bold text-[#087963]">{lastSubmission.submittedAt}</span>
          </div>
        </div>

        {!isRealStudentSession && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-surface">
              <span className="text-text-muted block">Skor PG</span>
              <span className="text-lg font-extrabold text-text-main">
                {lastSubmission.pgScore}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface">
              <span className="text-text-muted block">PGK / Jodoh</span>
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
        )}

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          {isRealStudentSession ? (
            <button
              type="button"
              disabled={isWaitingCloud}
              onClick={onExitPortal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#211955] hover:bg-[#2d2270] disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition"
            >
              <LogOut className="w-4 h-4" />
              <span>
                {isWaitingCloud
                  ? 'Menunggu Konfirmasi Server...'
                  : 'Selesai & Keluar Akun Peserta'}
              </span>
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Confidentiality Note for Real Exam vs Answer Key Review for Admin/Teacher Simulation */}
      {isRealStudentSession ? (
        <div className="rounded-[24px] bg-elevated p-5 shadow-card border border-border-subtle/60 flex items-center gap-3 text-xs text-text-muted">
          <ShieldCheck className="w-5 h-5 text-[#087963] shrink-0" />
          <span>
            Demi menjaga kerahasiaan naskah ujian antar-sesi, rincian soal dan pembahasan tidak
            ditampilkan pada layar peserta setelah ujian dikumpulkan.
          </span>
        </div>
      ) : (
        <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
          <h2 className="text-base font-extrabold text-text-main">
            Review Kunci Jawaban &amp; Pembahasan Soal (Mode Simulasi Guru/Admin)
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
                      : q.type === 'MENJODOHKAN'
                      ? 'Menjodohkan'
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
                {q.type === 'MENJODOHKAN' && q.matchingPairs && q.matchingPairs.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <span className="text-[11px] font-extrabold text-[#087963] block">
                      Kunci Pasangan Jawaban:
                    </span>
                    {q.matchingPairs.map((pair, idx) => (
                      <div
                        key={pair.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-[11px]"
                      >
                        <span className="font-semibold text-text-main">
                          {idx + 1}. {pair.leftText}
                        </span>
                        <span className="font-extrabold text-[#087963] dark:text-teal-300">
                          &rarr; {pair.rightText}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
      )}
    </div>
  );
};
