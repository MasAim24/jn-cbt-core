import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Headphones,
  Image as ImageIcon,
  Languages,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ExamPacket,
  MatchingPair,
  Question,
  QuestionOption,
  QuestionType,
} from '../../types/cbt';
import {
  AUDIO_ISTIMA_PRESETS,
  compressImageFileToDataUrl,
  DIAGRAM_PRESETS,
} from '../../utils/questionMediaHelper';
import { QuestionMediaAttachment } from '../common/QuestionMediaAttachment';

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
  const [qMatchingPairs, setQMatchingPairs] = useState<MatchingPair[]>([
    { id: 'P1', leftText: '', rightText: '' },
    { id: 'P2', leftText: '', rightText: '' },
    { id: 'P3', leftText: '', rightText: '' },
  ]);
  const [qCorrectPG, setQCorrectPG] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [qCorrectPGK, setQCorrectPGK] = useState<('A' | 'B' | 'C' | 'D' | 'E')[]>(['A', 'B']);
  const [qCorrectBool, setQCorrectBool] = useState<boolean>(true);
  const [qRubric, setQRubric] = useState('');
  const [qPembahasan, setQPembahasan] = useState('');
  const [qMediaImageUrl, setQMediaImageUrl] = useState('');
  const [qMediaAudioUrl, setQMediaAudioUrl] = useState('');
  const [qMediaCaption, setQMediaCaption] = useState('');

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
      setQMatchingPairs(
        editingQuestion.matchingPairs && editingQuestion.matchingPairs.length >= 2
          ? editingQuestion.matchingPairs
          : [
              { id: 'P1', leftText: '', rightText: '' },
              { id: 'P2', leftText: '', rightText: '' },
              { id: 'P3', leftText: '', rightText: '' },
            ]
      );
      setQCorrectPG(editingQuestion.correctAnswer || 'A');
      setQCorrectPGK(editingQuestion.correctAnswers || ['A', 'B']);
      setQCorrectBool(editingQuestion.correctBoolean ?? true);
      setQRubric(editingQuestion.essayRubric || '');
      setQPembahasan(editingQuestion.pembahasan || '');
      setQMediaImageUrl(editingQuestion.mediaImageUrl || '');
      setQMediaAudioUrl(editingQuestion.mediaAudioUrl || '');
      setQMediaCaption(editingQuestion.mediaCaption || '');
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
      setQMatchingPairs([
        { id: 'P1', leftText: '', rightText: '' },
        { id: 'P2', leftText: '', rightText: '' },
        { id: 'P3', leftText: '', rightText: '' },
      ]);
      setQCorrectPG('A');
      setQCorrectPGK(['A', 'B']);
      setQCorrectBool(true);
      setQRubric('');
      setQPembahasan('');
      setQMediaImageUrl('');
      setQMediaAudioUrl('');
      setQMediaCaption('');
    }
  }, [isOpen, editingQuestion]);

  if (!isOpen) return null;

  const togglePGKChoice = (lbl: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setQCorrectPGK((prev) =>
      prev.includes(lbl) ? prev.filter((item) => item !== lbl) : [...prev, lbl]
    );
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setQMediaImageUrl(compressed);
      if (!qMediaCaption.trim()) {
        setQMediaCaption(`Gambar Ilustrasi: ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    } catch {
      // Ignore upload error
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1536 * 1024) {
      alert(
        'Ukuran file audio terlalu besar (> 1,5 MB) untuk disimpan langsung di database. Gunakan file MP3/OGG terkompresi (< 1,5 MB) atau tempelkan URL link audio eksternal.'
      );
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQMediaAudioUrl(reader.result);
        if (!qMediaCaption.trim()) {
          setQMediaCaption(`Audio Soal: ${file.name.replace(/\.[^/.]+$/, '')}`);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFillMatchingSample = () => {
    if (activePacket.jenjang === 'Wustho' || activePacket.jenjang === 'Ulya') {
      if (!qPrompt.trim()) {
        setQPrompt(
          'Pasangkanlah istilah hukum/gramatika kitab pada Kolom A dengan ta’rif atau contoh yang tepat pada Kolom B!'
        );
      }
      setQMatchingPairs([
        {
          id: 'P1',
          leftText: 'Marfu’at al-Asma’ (مَرْفُوْعَاتُ الْأَسْمَاءِ)',
          rightText: 'Fa’il, Naibul Fa’il, Mubtada’ & Khabar',
        },
        {
          id: 'P2',
          leftText: 'Rukun Shalat Qauli (رُكْنٌ قَوْلِيٌّ)',
          rightText: 'Takbiratul Ihram, Al-Fatihah & Tasyahud Akhir',
        },
        {
          id: 'P3',
          leftText: 'Tanda I’rab Jazm pada Fi’il Mudhari’ Shahih Akhir',
          rightText: 'Sukun (السُّكُوْنُ)',
        },
      ]);
    } else if (activePacket.jenjang === 'MA') {
      if (!qPrompt.trim()) {
        setQPrompt(
          'Jodohkanlah pernyataan konsep keilmuan pada Kolom Premis (Kiri) dengan pasangan jawaban yang tepat pada Kolom Kanan!'
        );
      }
      setQMatchingPairs([
        {
          id: 'P1',
          leftText: 'Sumber hukum Islam ketiga setelah Al-Qur’an dan As-Sunnah',
          rightText: 'Ijma’ Ulama (الإجماع)',
        },
        {
          id: 'P2',
          leftText: 'Organel sel yang berfungsi sebagai pusat respirasi & penghasil energi (ATP)',
          rightText: 'Mitokondria',
        },
        {
          id: 'P3',
          leftText: 'Menetapkan hukum suatu perkara baru berdasarkan kesamaan ‘illat hukum',
          rightText: 'Qiyas (القياس)',
        },
      ]);
    } else {
      if (!qPrompt.trim()) {
        setQPrompt(
          'Pasangkanlah pernyataan pada Kolom A (Kiri) dengan pasangan jawaban yang sesuai pada Kolom B (Kanan)!'
        );
      }
      setQMatchingPairs([
        {
          id: 'P1',
          leftText: 'Air suci dan menyucikan (Thahir Muthahhir)',
          rightText: 'Air Mutlak (Hujan, Sumur, Sungai, Laut)',
        },
        {
          id: 'P2',
          leftText: 'Hukum bacaan Nun Mati / Tanwin bertemu huruf Ba (ب)',
          rightText: 'Iqlab (إقلاب)',
        },
        {
          id: 'P3',
          leftText: 'Khalifah pertama dari Khulafaur Rasyidin',
          rightText: 'Abu Bakar Ash-Shiddiq r.a.',
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim()) return;

    const activeOptionLimit = activePacket.optionCount;
    const validOptions = qOptions.slice(0, activeOptionLimit).map((o) => ({
      ...o,
      text: o.text.trim() || `Pilihan ${o.label}`,
    }));

    const validMatchingPairs: MatchingPair[] = qMatchingPairs.map((pair, idx) => ({
      id: pair.id || `P${idx + 1}`,
      leftText: pair.leftText.trim() || `Pernyataan ${idx + 1}`,
      rightText: pair.rightText.trim() || `Pasangan ${idx + 1}`,
    }));

    const newQ: Question = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      nomor: editingQuestion ? editingQuestion.nomor : activePacket.questions.length + 1,
      type: qType,
      prompt: qPrompt.trim(),
      arabicPrompt: qArabicPrompt.trim() || undefined,
      kitabReference: qKitabRef.trim() || undefined,
      isRtl: Boolean(qArabicPrompt.trim()),
      mediaImageUrl: qMediaImageUrl.trim() || undefined,
      mediaAudioUrl: qMediaAudioUrl.trim() || undefined,
      mediaCaption: qMediaCaption.trim() || undefined,
      options: qType === 'PG' || qType === 'PG_KOMPLEKS' ? validOptions : undefined,
      matchingPairs: qType === 'MENJODOHKAN' ? validMatchingPairs : undefined,
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
                <option value="MENJODOHKAN">
                  Menjodohkan / Mencocokkan Pasangan (Semua Jenjang: MTs • MA • Wustho • &apos;Ulya)
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

          {/* Media Attachment Section: Image / Diagram & Audio Istima' */}
          <div className="rounded-2xl bg-surface/90 border border-border-subtle p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-text-main flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[var(--brand-text-accent)]" />
                <span>Lampiran Media Soal: Gambar / Bagan &amp; Audio Istima’ (Opsional)</span>
              </span>
              {(qMediaImageUrl || qMediaAudioUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setQMediaImageUrl('');
                    setQMediaAudioUrl('');
                    setQMediaCaption('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-[#D93834] text-[11px] font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset Media</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Image Upload / Preset */}
              <div className="p-3 rounded-xl bg-elevated border border-border-subtle space-y-2">
                <label className="font-bold text-text-main flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#211955]" />
                  <span>Gambar Ilustrasi / Bagan Kurikulum</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#211955] text-white font-bold cursor-pointer hover:bg-[#2d2270] transition shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                  <select
                    value={
                      DIAGRAM_PRESETS.some((p) => p.dataUrl === qMediaImageUrl)
                        ? DIAGRAM_PRESETS.find((p) => p.dataUrl === qMediaImageUrl)?.id
                        : ''
                    }
                    onChange={(e) => {
                      const preset = DIAGRAM_PRESETS.find((p) => p.id === e.target.value);
                      if (preset) {
                        setQMediaImageUrl(preset.dataUrl);
                        setQMediaCaption(preset.caption);
                      }
                    }}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface border border-border-subtle text-text-main text-[11px] font-semibold"
                  >
                    <option value="">-- Pilih Bagan Kurikulum Siap Pakai --</option>
                    {DIAGRAM_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audio Upload / Istima Preset */}
              <div className="p-3 rounded-xl bg-elevated border border-border-subtle space-y-2">
                <label className="font-bold text-text-main flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#14B894]" />
                  <span>Audio Istima’ / Listening Comprehension</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14B894] text-white font-bold cursor-pointer hover:bg-[#0b987c] transition shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </label>
                  <select
                    value={qMediaAudioUrl.startsWith('SYNTH_ISTIMA_') ? qMediaAudioUrl : ''}
                    onChange={(e) => {
                      const preset = AUDIO_ISTIMA_PRESETS.find((p) => p.id === e.target.value);
                      if (preset) {
                        setQMediaAudioUrl(preset.id);
                        if (!qMediaCaption.trim()) {
                          setQMediaCaption(preset.caption);
                        }
                      } else if (!e.target.value) {
                        setQMediaAudioUrl('');
                      }
                    }}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-surface border border-border-subtle text-text-main text-[11px] font-semibold"
                  >
                    <option value="">-- Pilih Preset Audio Istima’ --</option>
                    {AUDIO_ISTIMA_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {(qMediaImageUrl || qMediaAudioUrl) && (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={qMediaCaption}
                  onChange={(e) => setQMediaCaption(e.target.value)}
                  placeholder="Keterangan gambar/audio (misal: Perhatikan bagan pembagian kalimat berikut)..."
                  className="w-full px-3.5 py-2 rounded-xl bg-elevated border border-border-subtle text-text-main"
                />
                <QuestionMediaAttachment
                  mediaImageUrl={qMediaImageUrl || undefined}
                  mediaAudioUrl={qMediaAudioUrl || undefined}
                  mediaCaption={qMediaCaption || undefined}
                  compact
                />
              </div>
            )}
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

          {/* Dynamic Pairs for MENJODOHKAN (All Jenjangs: MTs, MA, Wustho, 'Ulya) */}
          {qType === 'MENJODOHKAN' && (
            <div className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="font-extrabold text-[#211955] dark:text-indigo-200 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-[#14B894]" />
                    <span>
                      Daftar Pasangan Soal Menjodohkan ({qMatchingPairs.length} Pasang)
                    </span>
                  </label>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Isi pernyataan/premis di Kolom A (Kiri) dan pasangan jawaban benarnya di Kolom B
                    (Kanan). Saat ujian, urutan Kolom B diacak otomatis dan dinilai proporsional.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleFillMatchingSample}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#B85D19] text-[11px] font-extrabold border border-amber-200 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Contoh {activePacket.jenjang}</span>
                  </button>
                  {qMatchingPairs.length < 6 && (
                    <button
                      type="button"
                      onClick={() =>
                        setQMatchingPairs((prev) => [
                          ...prev,
                          { id: `P${prev.length + 1}`, leftText: '', rightText: '' },
                        ])
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-[11px] font-extrabold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {qMatchingPairs.map((pair, idx) => (
                  <div
                    key={pair.id || idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-elevated p-2.5 rounded-xl border border-border-subtle"
                  >
                    <div className="sm:col-span-5 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#211955] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={pair.leftText}
                        onChange={(e) => {
                          const next = [...qMatchingPairs];
                          next[idx] = { ...pair, leftText: e.target.value };
                          setQMatchingPairs(next);
                        }}
                        placeholder={`Premis / Pernyataan ${idx + 1} (Kolom A)...`}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-text-main"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-center text-[#14B894] font-extrabold">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>

                    <div className="sm:col-span-6 flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={pair.rightText}
                        onChange={(e) => {
                          const next = [...qMatchingPairs];
                          next[idx] = { ...pair, rightText: e.target.value };
                          setQMatchingPairs(next);
                        }}
                        placeholder={`Pasangan Jawaban Benar ${idx + 1} (Kolom B)...`}
                        className="flex-1 px-3 py-2 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-[#14B894]/60 text-text-main font-semibold"
                      />
                      {qMatchingPairs.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setQMatchingPairs((prev) =>
                              prev
                                .filter((_, i) => i !== idx)
                                .map((item, i) => ({ ...item, id: `P${i + 1}` }))
                            )
                          }
                          title="Hapus Pasangan"
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#D93834] shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
