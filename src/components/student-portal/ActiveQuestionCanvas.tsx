import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Flag } from 'lucide-react';
import { Question } from '../../types/cbt';

const ESSAY_HARAKAT = ['َ', 'ِ', 'ُ', 'ً', 'ٍ', 'ٌ', 'ْ', 'ّ'];

interface ActiveQuestionCanvasProps {
  currentQuestion: Question;
  currentIndex: number;
  totalQuestions: number;
  fontScale: 'normal' | 'large' | 'xlarge';
  pgAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>;
  onSelectPg: (qId: string, label: 'A' | 'B' | 'C' | 'D' | 'E') => void;
  pgkAnswers: Record<string, ('A' | 'B' | 'C' | 'D' | 'E')[]>;
  onTogglePgk: (qId: string, label: 'A' | 'B' | 'C' | 'D' | 'E') => void;
  bsAnswers: Record<string, boolean>;
  onSelectBs: (qId: string, val: boolean) => void;
  esaiAnswers: Record<string, string>;
  onChangeEsai: (qId: string, val: string) => void;
  doubtFlags: Record<string, boolean>;
  onToggleDoubt: (qId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenConfirmSubmit: () => void;
}

export const ActiveQuestionCanvas: React.FC<ActiveQuestionCanvasProps> = ({
  currentQuestion,
  currentIndex,
  totalQuestions,
  fontScale,
  pgAnswers,
  onSelectPg,
  pgkAnswers,
  onTogglePgk,
  bsAnswers,
  onSelectBs,
  esaiAnswers,
  onChangeEsai,
  doubtFlags,
  onToggleDoubt,
  onPrev,
  onNext,
  onOpenConfirmSubmit,
}) => {
  const arabicSizeClass =
    fontScale === 'normal'
      ? 'text-xl'
      : fontScale === 'large'
      ? 'text-2xl sm:text-3xl'
      : 'text-3xl sm:text-4xl';
  const bodySizeClass =
    fontScale === 'normal' ? 'text-sm' : fontScale === 'large' ? 'text-base' : 'text-lg';

  return (
    <div className="lg:col-span-8 rounded-[26px] bg-elevated p-6 sm:p-7 shadow-card border border-border-subtle/60 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-xl bg-[#211955] text-white text-xs font-extrabold">
            SOAL NO. {currentQuestion.nomor}
          </span>
          <span className="px-3 py-1 rounded-xl bg-indigo-50 text-[#211955] text-xs font-extrabold">
            {currentQuestion.type === 'PG'
              ? 'Pilihan Ganda'
              : currentQuestion.type === 'PG_KOMPLEKS'
              ? 'Pilihan Ganda Kompleks (Pilih > 1)'
              : currentQuestion.type === 'BENAR_SALAH'
              ? 'Pernyataan Benar / Salah'
              : 'Soal Uraian / Tarkib Kitab'}
          </span>
        </div>
        {currentQuestion.kitabReference && (
          <span className="text-xs font-bold text-[#087963] bg-teal-50 px-3 py-1 rounded-xl">
            📚 {currentQuestion.kitabReference}
          </span>
        )}
      </div>

      {currentQuestion.arabicPrompt && (
        <div
          dir="rtl"
          className={`rounded-2xl bg-[#FFF8F1] dark:bg-indigo-950/60 border border-[#FCD9BD] dark:border-indigo-800 px-6 py-5 text-right font-kitab ${arabicSizeClass} text-[#1E1645] dark:text-amber-100 leading-loose`}
        >
          {currentQuestion.arabicPrompt}
        </div>
      )}

      <p className={`${bodySizeClass} font-bold text-text-main leading-relaxed`}>
        {currentQuestion.prompt}
      </p>

      {currentQuestion.type === 'PG' && currentQuestion.options && (
        <div className="space-y-3 pt-2">
          {currentQuestion.options.map((opt) => {
            const selected = pgAnswers[currentQuestion.id] === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onSelectPg(currentQuestion.id, opt.label)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition ${
                  selected
                    ? 'bg-[#211955] text-white border-[#211955] shadow-md'
                    : 'bg-surface/70 hover:bg-surface border-border-subtle text-text-main'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    selected
                      ? 'bg-[#F8B478] text-[#1E1645]'
                      : 'bg-elevated border border-border-subtle text-text-main'
                  }`}
                >
                  {opt.label}
                </span>
                <span className={`${bodySizeClass} font-semibold`}>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {currentQuestion.type === 'PG_KOMPLEKS' && currentQuestion.options && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-extrabold text-[#B85D19]">
            * Petunjuk: Anda dapat memilih lebih dari satu jawaban yang benar (Kotak Centang).
          </p>
          {currentQuestion.options.map((opt) => {
            const selected = (pgkAnswers[currentQuestion.id] || []).includes(opt.label);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onTogglePgk(currentQuestion.id, opt.label)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition ${
                  selected
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-[#14B894] text-[#064D42] dark:text-teal-200 font-bold'
                    : 'bg-surface/70 hover:bg-surface border-border-subtle text-text-main'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    selected
                      ? 'bg-[#14B894] text-white'
                      : 'bg-elevated border border-border-subtle text-text-main'
                  }`}
                >
                  {selected ? '✓' : opt.label}
                </span>
                <span className={`${bodySizeClass} font-semibold`}>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {currentQuestion.type === 'BENAR_SALAH' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => onSelectBs(currentQuestion.id, true)}
            className={`p-5 rounded-2xl border-2 font-extrabold text-center transition ${
              bsAnswers[currentQuestion.id] === true
                ? 'bg-[#14B894] text-white border-[#14B894] shadow-md'
                : 'bg-surface border-border-subtle text-text-main hover:border-[#14B894]'
            }`}
          >
            <div className="text-lg font-kitab">صَحِيْحٌ</div>
            <div className="text-sm mt-1">PERNYATAAN BENAR</div>
          </button>

          <button
            type="button"
            onClick={() => onSelectBs(currentQuestion.id, false)}
            className={`p-5 rounded-2xl border-2 font-extrabold text-center transition ${
              bsAnswers[currentQuestion.id] === false
                ? 'bg-[#F0544F] text-white border-[#F0544F] shadow-md'
                : 'bg-surface border-border-subtle text-text-main hover:border-[#F0544F]'
            }`}
          >
            <div className="text-lg font-kitab">خَطَأٌ</div>
            <div className="text-sm mt-1">PERNYATAAN SALAH</div>
          </button>
        </div>
      )}

      {currentQuestion.type === 'ESAI' && (
        <div className="space-y-2.5 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-text-muted">
              Tuliskan Jawaban Uraian / Tarkib Anda (Mendukung Bahasa Indonesia &amp; Arab):
            </label>
            <div className="flex items-center gap-1">
              {ESSAY_HARAKAT.map((ch, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    onChangeEsai(
                      currentQuestion.id,
                      (esaiAnswers[currentQuestion.id] || '') + ch
                    )
                  }
                  className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-kitab text-sm font-bold hover:bg-amber-50"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={5}
            value={esaiAnswers[currentQuestion.id] || ''}
            onChange={(e) => onChangeEsai(currentQuestion.id, e.target.value)}
            placeholder="Ketik jawaban uraian atau penjelasan tarkib di sini..."
            className="w-full p-4 rounded-2xl bg-surface border border-border-subtle text-text-main font-medium text-sm focus:outline-none focus:border-[#211955]"
          />
        </div>
      )}

      {/* Bottom Navigation Controls */}
      <div className="pt-5 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface text-text-main text-xs font-extrabold disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleDoubt(currentQuestion.id)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            doubtFlags[currentQuestion.id]
              ? 'bg-[#F59E0B] text-white shadow-sm'
              : 'bg-amber-50 text-[#B85D19] border border-amber-200'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>{doubtFlags[currentQuestion.id] ? 'Ditandai Ragu-ragu' : 'Ragu-ragu'}</span>
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#211955] text-white text-xs font-extrabold"
          >
            <span>Selanjutnya</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenConfirmSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#14B894] hover:bg-[#0b987c] text-white text-xs font-extrabold shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesai &amp; Kumpulkan</span>
          </button>
        )}
      </div>
    </div>
  );
};
