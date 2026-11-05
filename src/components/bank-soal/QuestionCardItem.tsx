import React from 'react';
import { CheckCircle2, Edit3, Headphones, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Question } from '../../types/cbt';
import { QuestionMediaAttachment } from '../common/QuestionMediaAttachment';

interface QuestionCardItemProps {
  question: Question;
  onEdit: (q: Question) => void;
  onDelete: (questionId: string) => void;
}

export const QuestionCardItem: React.FC<QuestionCardItemProps> = ({
  question: q,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="rounded-[22px] bg-elevated p-5 shadow-card border border-border-subtle/60 space-y-3.5 break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-7 h-7 rounded-xl bg-[#211955] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
            {q.nomor}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#211955] text-[11px] font-extrabold whitespace-nowrap">
            {q.type === 'PG'
              ? 'Pilihan Ganda'
              : q.type === 'PG_KOMPLEKS'
              ? 'PG Kompleks (Multi-Jawaban)'
              : q.type === 'MENJODOHKAN'
              ? 'Menjodohkan (Mencocokkan Pasangan)'
              : q.type === 'BENAR_SALAH'
              ? 'Benar / Salah (Shahih / Khatha’)'
              : 'Uraian / Esai Kitab'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-[#B85D19] text-[11px] font-bold whitespace-nowrap">
            Bobot: {q.weight} Poin
          </span>
          {q.kitabReference && (
            <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#087963] text-[11px] font-semibold">
              📚 {q.kitabReference}
            </span>
          )}
          {q.mediaImageUrl && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-[#211955] text-[11px] font-bold">
              <ImageIcon className="w-3 h-3" />
              <span>Bergambar</span>
            </span>
          )}
          {q.mediaAudioUrl && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-[#087963] text-[11px] font-bold">
              <Headphones className="w-3 h-3" />
              <span>Audio Istima’</span>
            </span>
          )}
        </div>

        <div className="no-print flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(q)}
            className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-main transition"
            title="Edit Soal"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(q.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-[#D93834] transition"
            title="Hapus Soal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Arabic / Kitab Matan Block if present */}
      {q.arabicPrompt && (
        <div
          dir="rtl"
          className="rounded-2xl bg-[#FFF8F1] dark:bg-indigo-950/60 border border-[#FCD9BD] dark:border-indigo-800 px-5 py-4 text-right font-kitab text-xl sm:text-2xl leading-[2.15] text-[#1E1645] dark:text-amber-100"
        >
          {q.arabicPrompt}
        </div>
      )}

      {/* Image / Diagram / Audio Attachment if present */}
      <QuestionMediaAttachment
        mediaImageUrl={q.mediaImageUrl}
        mediaAudioUrl={q.mediaAudioUrl}
        mediaCaption={q.mediaCaption}
        compact
      />

      {/* Indonesian Question Prompt */}
      <p className="text-sm font-semibold text-text-main leading-relaxed">{q.prompt}</p>

      {/* Options for PG & PG_KOMPLEKS */}
      {(q.type === 'PG' || q.type === 'PG_KOMPLEKS') && q.options && (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {q.options.map((opt) => {
            const isCorrect =
              q.type === 'PG'
                ? q.correctAnswer === opt.label
                : q.correctAnswers?.includes(opt.label);
            return (
              <div
                key={opt.label}
                className={`flex items-start sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs ${
                  isCorrect
                    ? 'bg-teal-50/90 dark:bg-teal-950/40 border-[#14B894] text-[#064D42] dark:text-teal-200 font-bold'
                    : 'bg-surface/60 border-border-subtle/60 text-text-muted'
                }`}
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                      isCorrect
                        ? 'bg-[#14B894] text-white'
                        : 'bg-elevated border border-border-subtle text-text-main'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="leading-relaxed break-words">{opt.text}</span>
                </div>
                {isCorrect && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#087963] dark:text-teal-300 shrink-0 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Kunci Jawaban</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Key for MENJODOHKAN */}
      {q.type === 'MENJODOHKAN' && q.matchingPairs && q.matchingPairs.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-12 gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 text-[11px] font-extrabold text-[#211955] dark:text-indigo-200">
            <div className="col-span-5">Kolom A (Pernyataan / Premis)</div>
            <div className="col-span-2 text-center">Pasangan</div>
            <div className="col-span-5">Kolom B (Kunci Jawaban)</div>
          </div>
          {q.matchingPairs.map((pair, idx) => (
            <div
              key={pair.id || idx}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-3.5 py-2.5 rounded-xl bg-surface/80 border border-border-subtle/70 text-xs"
            >
              <div className="sm:col-span-5 flex items-center gap-2 font-semibold text-text-main">
                <span className="w-6 h-6 rounded-lg bg-[#211955] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span>{pair.leftText}</span>
              </div>
              <div className="sm:col-span-2 text-center text-[#14B894] font-extrabold text-xs">
                &harr;
              </div>
              <div className="sm:col-span-5 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-teal-50/90 dark:bg-teal-950/40 border border-[#14B894]/70 text-[#064D42] dark:text-teal-200 font-bold">
                <span>{pair.rightText}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#087963] shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key for BENAR_SALAH */}
      {q.type === 'BENAR_SALAH' && (
        <div className="flex items-center gap-3 pt-1">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap ${
              q.correctBoolean
                ? 'bg-teal-50 text-[#087963] border border-[#14B894]'
                : 'bg-red-50 text-[#D93834] border border-[#F0544F]'
            }`}
          >
            Kunci Jawaban: {q.correctBoolean ? 'BENAR (Shahih)' : 'SALAH (Khatha’)'}
          </span>
        </div>
      )}

      {/* Rubric for ESAI */}
      {q.type === 'ESAI' && q.essayRubric && (
        <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800 p-3.5 text-xs text-text-main">
          <span className="font-extrabold text-[var(--brand-text-accent)] block mb-1">
            Pedoman Penskoran / Kunci Tarkib &amp; Uraian:
          </span>
          <p className="font-sans text-xs sm:text-sm leading-relaxed text-text-main">
            {q.essayRubric}
          </p>
        </div>
      )}

      {/* Pembahasan Soal */}
      {q.pembahasan && (
        <div className="pt-2.5 border-t border-border-subtle/50 text-xs leading-relaxed text-text-muted">
          <strong className="text-text-main">Pembahasan: </strong>
          <span>{q.pembahasan}</span>
        </div>
      )}
    </div>
  );
};
