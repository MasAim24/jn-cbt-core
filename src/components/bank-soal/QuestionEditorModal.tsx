import React, { useEffect, useState } from 'react';
import { Languages, X } from 'lucide-react';
import {
  ExamPacket,
  Question,
  QuestionOption,
  QuestionType,
} from '../../types/cbt';

const HARAKAT_BUTTONS = [
  { char: 'َ', label: 'Fathah' },
  { char: 'ِ', label: 'Kasrah' },
  { char: 'ُ', label: 'Dhammah' },
  { char: 'ً', label: 'Fathatain' },
  { char: 'ٍ', label: 'Kasratain' },
  { char: 'ٌ', label: 'Dhammatain' },
  { char: 'ْ', label: 'Sukun' },
  { char: 'ّ', label: 'Tasydid' },
  { char: '۞', label: 'Pemisah Bait' },
];

interface QuestionEditorModalProps {
  isOpen: boolean;
  activePacket: ExamPacket;
  editingQuestion: Question | null;
  onClose: () => void;
  onSaveQuestion: (q: Question) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  activePacket,
  editingQuestion,
  onClose,
  onSaveQuestion,
}) => {
  const [qType, setQType] = useState<QuestionType>('PG');
  const [qPrompt, setQPrompt] = useState('');
  const [qArabicPrompt, setQArabicPrompt] = useState('');
  const [qKitabRef, setQKitabRef] = useState('');
  const [qWeight, setQWeight] = useState(25);
  const [qOptions, setQOptions] = useState<QuestionOption[]>([
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
    { label: 'E', text: '' },
  ]);
  const [qCorrectPG, setQCorrectPG] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [qCorrectPGK, setQCorrectPGK] = useState<('A' | 'B' | 'C' | 'D' | 'E')[]>(['A', 'B']);
  const [qCorrectBool, setQCorrectBool] = useState<boolean>(true);
  const [qRubric, setQRubric] = useState('');
  const [qPembahasan, setQPembahasan] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingQuestion) {
      setQType(editingQuestion.type);
      setQPrompt(editingQuestion.prompt);
      setQArabicPrompt(editingQuestion.arabicPrompt || '');
      setQKitabRef(editingQuestion.kitabReference || '');
      setQWeight(editingQuestion.weight);
      const baseOpts: QuestionOption[] = (['A', 'B', 'C', 'D', 'E'] as const).map((lbl) => {
        const found = editingQuestion.options?.find((o) => o.label === lbl);
        return { label: lbl, text: found?.text || '' };
      });
      setQOptions(baseOpts);
      setQCorrectPG(editingQuestion.correctAnswer || 'A');
      setQCorrectPGK(editingQuestion.correctAnswers || ['A', 'B']);
      setQCorrectBool(editingQuestion.correctBoolean ?? true);
      setQRubric(editingQuestion.essayRubric || '');
      setQPembahasan(editingQuestion.pembahasan || '');
    } else {
      setQType('PG');
      setQPrompt('');
      setQArabicPrompt('');
      setQKitabRef('');
      setQWeight(25);
      setQOptions([
        { label: 'A', text: '' },
        { label: 'B', text: '' },
        { label: 'C', text: '' },
        { label: 'D', text: '' },
        { label: 'E', text: '' },
      ]);
      setQCorrectPG('A');
      setQCorrectPGK(['A', 'B']);
      setQCorrectBool(true);
      setQRubric('');
      setQPembahasan('');
    }
  }, [isOpen, editingQuestion]);

  if (!isOpen) return null;

  const togglePGKChoice = (lbl: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setQCorrectPGK((prev) =>
      prev.includes(lbl) ? prev.filter((item) => item !== lbl) : [...prev, lbl]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim()) return;

    const activeOptionLimit = activePacket.optionCount;
    const validOptions = qOptions.slice(0, activeOptionLimit).map((o) => ({
      ...o,
      text: o.text.trim() || `Pilihan ${o.label}`,
    }));

    const newQ: Question = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      nomor: editingQuestion ? editingQuestion.nomor : activePacket.questions.length + 1,
      type: qType,
      prompt: qPrompt.trim(),
      arabicPrompt: qArabicPrompt.trim() || undefined,
      kitabReference: qKitabRef.trim() || undefined,
      isRtl: Boolean(qArabicPrompt.trim()),
      options: qType === 'PG' || qType === 'PG_KOMPLEKS' ? validOptions : undefined,
      correctAnswer: qType === 'PG' ? qCorrectPG : undefined,
      correctAnswers: qType === 'PG_KOMPLEKS' ? qCorrectPGK : undefined,
      correctBoolean: qType === 'BENAR_SALAH' ? qCorrectBool : undefined,
      essayRubric: qType === 'ESAI' ? qRubric.trim() : undefined,
      weight: Number(qWeight) || 20,
      pembahasan: qPembahasan.trim() || undefined,
    };

    onSaveQuestion(newQ);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-elevated rounded-[26px] max-w-2xl w-full p-6 shadow-floating border border-border-subtle space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            {editingQuestion
              ? `Edit Soal Nomor ${editingQuestion.nomor}`
              : 'Tambah Butir Soal Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-text-main block mb-1">Tipe Soal CBT</label>
              <select
                value={qType}
                onChange={(e) => setQType(e.target.value as QuestionType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-bold"
              >
                <option value="PG">Pilihan Ganda (Satu Jawaban Benar)</option>
                <option value="PG_KOMPLEKS">
                  Pilihan Ganda Kompleks (Lebih dari Satu Jawaban)
                </option>
                <option value="BENAR_SALAH">Benar / Salah (Shahih / Khatha&apos;)</option>
                <option value="ESAI">Uraian / Esai / Tarkib Kitab</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Bobot Poin</label>
              <input
                type="number"
                value={qWeight}
                onChange={(e) => setQWeight(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          {/* Arabic / Kitab Input with Virtual Harakat Bar */}
          <div className="rounded-2xl bg-[#FFF8F1] dark:bg-indigo-950/40 border border-[#FCD9BD] dark:border-indigo-800 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-extrabold text-[#211955] dark:text-amber-200 flex items-center gap-1.5">
                <Languages className="w-4 h-4" />
                <span>Teks Arab / Kutipan Matan Kitab (Opsional — Otomatis RTL)</span>
              </label>
              <div className="flex flex-wrap items-center gap-1">
                {HARAKAT_BUTTONS.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onClick={() => setQArabicPrompt((prev) => prev + h.char)}
                    title={h.label}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-indigo-900 border border-[#FCD9BD] text-sm font-kitab font-bold hover:bg-[#F8B478]/30 transition"
                  >
                    {h.char}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              dir="rtl"
              rows={2}
              value={qArabicPrompt}
              onChange={(e) => setQArabicPrompt(e.target.value)}
              placeholder="كتب النص العربي أو متن الكتاب هنا..."
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-indigo-950 border border-[#FCD9BD] text-right font-kitab text-xl text-[#1E1645] dark:text-amber-100 focus:outline-none"
            />
            <input
              type="text"
              value={qKitabRef}
              onChange={(e) => setQKitabRef(e.target.value)}
              placeholder="Referensi Kitab / Bab (Misal: Matan Al-Ajurrumiyah Bab I'rab / Fathul Mu'in)"
              className="w-full px-3.5 py-2 rounded-xl bg-white/80 dark:bg-indigo-950 border border-[#FCD9BD] text-text-main"
            />
          </div>

          <div>
            <label className="font-bold text-text-main block mb-1">
              Pertanyaan / Instruksi Soal
            </label>
            <textarea
              rows={3}
              required
              value={qPrompt}
              onChange={(e) => setQPrompt(e.target.value)}
              placeholder="Tuliskan pokok soal atau pertanyaan di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
            />
          </div>

          {/* Dynamic Options for PG / PG_KOMPLEKS */}
          {(qType === 'PG' || qType === 'PG_KOMPLEKS') && (
            <div className="space-y-2.5">
              <label className="font-bold text-text-main block">
                Pilihan Jawaban &amp; Tandai Kunci (
                {qType === 'PG' ? 'Pilih 1 Kunci' : 'Centang >= 2 Kunci'})
              </label>
              {qOptions.slice(0, activePacket.optionCount).map((opt, idx) => {
                const isChecked =
                  qType === 'PG'
                    ? qCorrectPG === opt.label
                    : qCorrectPGK.includes(opt.label);
                return (
                  <div key={opt.label} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        qType === 'PG'
                          ? setQCorrectPG(opt.label)
                          : togglePGKChoice(opt.label)
                      }
                      className={`w-9 h-9 rounded-xl font-extrabold text-xs shrink-0 transition ${
                        isChecked
                          ? 'bg-[#14B894] text-white shadow-sm'
                          : 'bg-surface border border-border-subtle text-text-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...qOptions];
                        next[idx] = { ...opt, text: e.target.value };
                        setQOptions(next);
                      }}
                      placeholder={`Teks pilihan jawaban ${opt.label}...`}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Key for BENAR_SALAH */}
          {qType === 'BENAR_SALAH' && (
            <div className="space-y-2">
              <label className="font-bold text-text-main block">Pilih Kunci Pernyataan</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setQCorrectBool(true)}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold border ${
                    qCorrectBool
                      ? 'bg-[#14B894] text-white border-[#14B894]'
                      : 'bg-surface text-text-muted border-border-subtle'
                  }`}
                >
                  BENAR / SHAHIH
                </button>
                <button
                  type="button"
                  onClick={() => setQCorrectBool(false)}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold border ${
                    !qCorrectBool
                      ? 'bg-[#F0544F] text-white border-[#F0544F]'
                      : 'bg-surface text-text-muted border-border-subtle'
                  }`}
                >
                  SALAH / KHATHA&apos;
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Rubric for ESAI */}
          {qType === 'ESAI' && (
            <div>
              <label className="font-bold text-text-main block mb-1">
                Rubrik Penilaian / Kunci Jawaban Uraian &amp; Tarkib
              </label>
              <textarea
                rows={3}
                value={qRubric}
                onChange={(e) => setQRubric(e.target.value)}
                placeholder="Tuliskan pedoman kata kunci atau i'rab yang diharapkan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-text-main block mb-1">
              Pembahasan / Penjelasan Jawaban (Ditampilkan saat Review Hasil)
            </label>
            <input
              type="text"
              value={qPembahasan}
              onChange={(e) => setQPembahasan(e.target.value)}
              placeholder="Contoh: Berdasarkan Matan Jurumiyah Bab Kalam..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
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
              Simpan Butir Soal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
