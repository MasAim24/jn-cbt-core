import React from 'react';
import { X } from 'lucide-react';
import { ExamSubmission, Jenjang } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface RekapAnalysisGridProps {
  submissions: ExamSubmission[];
}

export const RekapAnalysisGrid: React.FC<RekapAnalysisGridProps> = ({ submissions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {(['MTs', 'MA', 'Wustho', 'Ulya'] as Jenjang[]).map((j) => {
        const list = submissions.filter((s) => s.jenjang === j);
        const avg =
          list.length > 0
            ? (list.reduce((acc, s) => acc + s.totalScore, 0) / list.length).toFixed(1)
            : '0.0';
        const meta = JENJANG_META[j];
        const pgAvg =
          list.length > 0
            ? Math.round((list.reduce((a, s) => a + s.pgScore, 0) / list.length / 25) * 100)
            : 0;
        const esaiAvg =
          list.length > 0
            ? Math.round(
                (list.reduce((a, s) => a + s.esaiScore, 0) / list.length / 30) * 100
              )
            : 0;

        return (
          <div
            key={j}
            className="rounded-[24px] bg-elevated p-5 shadow-card border border-border-subtle/60 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span
                className="px-3 py-1 rounded-full text-xs font-extrabold"
                style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
              >
                {meta.fullLabel}
              </span>
              <span className="text-sm font-extrabold text-text-main">
                Rata-rata: {avg} Poin
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-text-muted mb-1">
                  <span>Daya Serap Soal Objektif (PG, PGK, B/S)</span>
                  <span className="text-text-main">{pgAvg}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pgAvg}%`, backgroundColor: meta.barColor }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-text-muted mb-1">
                  <span>Daya Serap Soal Uraian / Tarkib Kitab</span>
                  <span className="text-text-main">{esaiAvg}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#14B894]"
                    style={{ width: `${esaiAvg}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface EssayGradingModalProps {
  gradingItem: ExamSubmission;
  esaiPoints: number;
  setEsaiPoints: (val: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const EssayGradingModal: React.FC<EssayGradingModalProps> = ({
  gradingItem,
  esaiPoints,
  setEsaiPoints,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-lg w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            Koreksi Jawaban Esai / Tarkib Santri
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle">
            <div className="font-extrabold text-text-main">
              {gradingItem.studentName} ({gradingItem.nomorPeserta})
            </div>
            <div className="text-text-muted mt-0.5">
              {gradingItem.mapel} • Jenjang {gradingItem.jenjang}
            </div>
          </div>

          {gradingItem.essayQuestionPrompt && (
            <div>
              <span className="font-bold text-text-muted block mb-1">Pertanyaan Esai:</span>
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 text-text-main font-semibold leading-relaxed">
                {gradingItem.essayQuestionPrompt}
              </div>
            </div>
          )}

          <div>
            <span className="font-bold text-text-muted block mb-1">
              Jawaban Santri / Siswa:
            </span>
            <div className="p-4 rounded-xl bg-[#FFF8F1] dark:bg-indigo-950 border border-[#FCD9BD] text-[#1E1645] dark:text-amber-100 font-sans text-xs sm:text-sm font-medium leading-relaxed">
              {gradingItem.essayAnswerSample || 'Jawaban esai telah tersimpan.'}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 pt-2">
            <div>
              <label className="font-extrabold text-text-main block mb-1">
                Berikan Skor Esai (Maksimal 30 Poin)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={esaiPoints}
                onChange={(e) => setEsaiPoints(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-mono font-extrabold text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface text-text-muted font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#211955] text-white font-extrabold"
              >
                Simpan Nilai Akhir
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
