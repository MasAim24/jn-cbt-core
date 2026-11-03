import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { ExamPacket, Question } from '../../types/cbt';

interface QuestionMatrixSidebarProps {
  activePacket: ExamPacket;
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  isQuestionAnswered: (q: Question) => boolean;
  doubtFlags: Record<string, boolean>;
  answeredTotalCount: number;
  doubtTotalCount: number;
  unansweredTotalCount: number;
  violationCount: number;
  onOpenConfirmSubmit: () => void;
}

export const QuestionMatrixSidebar: React.FC<QuestionMatrixSidebarProps> = ({
  activePacket,
  currentIndex,
  onSelectIndex,
  isQuestionAnswered,
  doubtFlags,
  answeredTotalCount,
  doubtTotalCount,
  unansweredTotalCount,
  violationCount,
  onOpenConfirmSubmit,
}) => {
  return (
    <div className="lg:col-span-4 rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-5">
      <div>
        <h3 className="text-sm font-extrabold text-text-main">
          Navigasi Nomor Soal ({answeredTotalCount}/{activePacket.questions.length} Dijawab)
        </h3>
        <p className="text-[11px] text-text-muted mt-0.5">
          Klik nomor atau gunakan panah Kiri/Kanan keyboard.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {activePacket.questions.map((q, idx) => {
          const answered = isQuestionAnswered(q);
          const isDoubt = doubtFlags[q.id];
          const isCurrent = idx === currentIndex;

          let btnClass = 'bg-surface text-text-main border-border-subtle';
          if (isDoubt) {
            btnClass = 'bg-[#F59E0B] text-white border-[#F59E0B]';
          } else if (answered) {
            btnClass = 'bg-[#14B894] text-white border-[#14B894]';
          }
          if (isCurrent) {
            btnClass += ' ring-2 ring-[var(--brand-text-accent)] ring-offset-2';
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`h-11 rounded-xl border font-extrabold text-xs transition flex flex-col items-center justify-center ${btnClass}`}
            >
              <span>{q.nomor}</span>
              <span className="text-[9px] opacity-80 whitespace-nowrap">
                {q.type === 'PG'
                  ? 'PG'
                  : q.type === 'PG_KOMPLEKS'
                  ? 'PGK'
                  : q.type === 'BENAR_SALAH'
                  ? 'B/S'
                  : 'ESAI'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-semibold text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#14B894]" />
          <span>Dijawab ({answeredTotalCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#F59E0B]" />
          <span>Ragu ({doubtTotalCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-surface border border-border-subtle" />
          <span>Kosong ({unansweredTotalCount})</span>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 flex items-center justify-between gap-2.5 text-xs text-text-main">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#14B894] shrink-0" />
          <span>Anti-Cheat Aktif</span>
        </div>
        <span
          className={`font-extrabold ${
            violationCount > 0 ? 'text-[#D93834]' : 'text-[#087963]'
          }`}
        >
          Pelanggaran: {violationCount}x
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenConfirmSubmit}
        className="w-full py-3 rounded-2xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-extrabold transition shadow-md"
      >
        Kumpulkan Seluruh Jawaban
      </button>
    </div>
  );
};

interface ConfirmSubmitModalProps {
  answeredTotalCount: number;
  doubtTotalCount: number;
  unansweredTotalCount: number;
  onClose: () => void;
  onConfirmFinish: () => void;
}

export const ConfirmSubmitModal: React.FC<ConfirmSubmitModalProps> = ({
  answeredTotalCount,
  doubtTotalCount,
  unansweredTotalCount,
  onClose,
  onConfirmFinish,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-md w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            Konfirmasi Selesai Ujian
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-teal-50 text-[#087963]">
              <div className="text-lg font-extrabold">{answeredTotalCount}</div>
              <div className="font-bold">Sudah Dijawab</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-[#B85D19]">
              <div className="text-lg font-extrabold">{doubtTotalCount}</div>
              <div className="font-bold">Ragu-ragu</div>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 text-[#D93834]">
              <div className="text-lg font-extrabold">{unansweredTotalCount}</div>
              <div className="font-bold">Belum Dijawab</div>
            </div>
          </div>

          {(unansweredTotalCount > 0 || doubtTotalCount > 0) && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-[#B85D19]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Perhatian: Masih terdapat <strong>{unansweredTotalCount} soal kosong</strong> dan{' '}
                <strong>{doubtTotalCount} soal ditandai ragu-ragu</strong>. Apakah Anda yakin
                ingin mengumpulkan sekarang?
              </span>
            </div>
          )}

          <p className="text-text-muted leading-relaxed">
            Setelah jawaban dikumpulkan, Anda tidak dapat mengubah jawaban lagi dan skor akan
            langsung direkap ke server.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface text-text-main font-bold"
            >
              Periksa Kembali
            </button>
            <button
              type="button"
              onClick={onConfirmFinish}
              className="px-5 py-2.5 rounded-xl bg-[#14B894] hover:bg-[#0b987c] text-white font-extrabold shadow-sm"
            >
              Ya, Kumpulkan Jawaban
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
