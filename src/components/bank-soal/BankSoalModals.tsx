import React, { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Lock, Upload, Wand2, X } from 'lucide-react';
import { ExamPacket, Jenjang, Question, QuestionType, Teacher } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';
import { isGenericMapelLabel } from '../../utils/rbacHelper';
import { formatMathNotation } from '../../utils/mathSymbolHelper';

interface NewPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePacket: (packet: ExamPacket) => void;
  editingPacket?: ExamPacket | null;
  allowedJenjangs?: Jenjang[];
  defaultJenjang?: Jenjang;
  defaultMapel?: string;
  defaultGuruId?: string;
  defaultGuruNama?: string;
  lockGuruIdentity?: boolean;
  teachers?: Teacher[];
}

const ALL_JENJANG_OPTIONS: { value: Jenjang; label: string }[] = [
  { value: 'MTs', label: 'Madrasah Tsanawiyah (MTs)' },
  { value: 'MA', label: 'Madrasah Aliyah (MA)' },
  { value: 'Wustho', label: 'PDF / Diniyah Wustho' },
  { value: 'Ulya', label: "PDF / Diniyah 'Ulya" },
];

export const NewPacketModal: React.FC<NewPacketModalProps> = ({
  isOpen,
  onClose,
  onCreatePacket,
  editingPacket = null,
  allowedJenjangs,
  defaultJenjang,
  defaultMapel,
  defaultGuruId,
  defaultGuruNama,
  lockGuruIdentity = false,
  teachers = [],
}) => {
  const effectiveJenjangs =
    allowedJenjangs && allowedJenjangs.length > 0
      ? ALL_JENJANG_OPTIONS.filter((opt) => allowedJenjangs.includes(opt.value))
      : ALL_JENJANG_OPTIONS;

  const initialJenjang: Jenjang =
    defaultJenjang && effectiveJenjangs.some((o) => o.value === defaultJenjang)
      ? defaultJenjang
      : effectiveJenjangs[0]?.value || 'MTs';

  const [newTitle, setNewTitle] = useState('');
  const [newMapel, setNewMapel] = useState('');
  const [newJenjang, setNewJenjang] = useState<Jenjang>(initialJenjang);
  const [newKelas, setNewKelas] = useState('VIII-A');
  const [newGuruId, setNewGuruId] = useState<string | undefined>(defaultGuruId);
  const [newGuru, setNewGuru] = useState(defaultGuruNama || 'Tim Kurikulum / Guru Mapel');
  const [newOptionCount, setNewOptionCount] = useState<4 | 5>(
    JENJANG_META[initialJenjang].defaultOptions
  );
  const [newKkm, setNewKkm] = useState(75);
  const [newHasArabic, setNewHasArabic] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (editingPacket) {
      setNewTitle(editingPacket.title);
      setNewMapel(isGenericMapelLabel(editingPacket.mapel) ? '' : editingPacket.mapel);
      setNewJenjang(editingPacket.jenjang);
      setNewKelas(editingPacket.kelas);
      setNewGuruId(editingPacket.guruId || defaultGuruId);
      setNewGuru(editingPacket.guruNama || defaultGuruNama || 'Tim Kurikulum / Guru Mapel');
      setNewOptionCount(editingPacket.optionCount);
      setNewKkm(editingPacket.kkm);
      setNewHasArabic(editingPacket.hasArabicKitab);
      return;
    }
    const nextJ: Jenjang =
      defaultJenjang && effectiveJenjangs.some((o) => o.value === defaultJenjang)
        ? defaultJenjang
        : effectiveJenjangs[0]?.value || 'MTs';
    setNewTitle('');
    setNewMapel(defaultMapel && !isGenericMapelLabel(defaultMapel) ? defaultMapel : '');
    setNewJenjang(nextJ);
    setNewOptionCount(JENJANG_META[nextJ].defaultOptions);
    setNewGuruId(defaultGuruId);
    if (defaultGuruNama) setNewGuru(defaultGuruNama);
    if (nextJ === 'MA') setNewKelas('X / XI / XII MA');
    else if (nextJ === 'MTs') setNewKelas('VII / VIII / IX MTs');
    else if (nextJ === 'Wustho') setNewKelas('Marhalah Wustho');
    else if (nextJ === 'Ulya') setNewKelas("Marhalah 'Ulya");
  }, [isOpen, editingPacket, defaultJenjang, defaultGuruId, defaultGuruNama, defaultMapel]);

  if (!isOpen) return null;

  const unitTeachers = teachers.filter((t) => t.jenjangAmpu?.includes(newJenjang));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMapel.trim()) return;
    const lockedJenjang = effectiveJenjangs.some((o) => o.value === newJenjang)
      ? newJenjang
      : effectiveJenjangs[0]?.value || 'MTs';
    const finalGuruId = lockGuruIdentity ? defaultGuruId : newGuruId;
    const finalGuruNama = lockGuruIdentity && defaultGuruNama ? defaultGuruNama : newGuru.trim();
    const created: ExamPacket = editingPacket
      ? {
          ...editingPacket,
          title: newTitle.trim(),
          mapel: newMapel.trim(),
          jenjang: lockedJenjang,
          kelas: newKelas.trim(),
          guruId: finalGuruId || editingPacket.guruId,
          guruNama: finalGuruNama || editingPacket.guruNama,
          optionCount: newOptionCount,
          kkm: Number(newKkm) || 75,
          hasArabicKitab: newHasArabic,
          updatedAt: 'Baru saja',
          updatedAtMs: Date.now(),
        }
      : {
          id: `pkt-${Date.now()}`,
          code: `CBT-${lockedJenjang.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          title: newTitle.trim(),
          mapel: newMapel.trim(),
          jenjang: lockedJenjang,
          kelas: newKelas.trim(),
          guruId: finalGuruId,
          guruNama: finalGuruNama,
          optionCount: newOptionCount,
          kkm: Number(newKkm) || 75,
          hasArabicKitab: newHasArabic,
          updatedAt: 'Baru saja',
          updatedAtMs: Date.now(),
          questions: [],
        };
    onCreatePacket(created);
    setNewTitle('');
    setNewMapel('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-lg w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            {editingPacket ? `Edit Info Paket Soal (${editingPacket.code})` : 'Buat Paket Bank Soal Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-text-main block mb-1">Judul Paket Ujian</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contoh: Penilaian Akhir Semester — Informatika / TIK"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main focus:outline-none focus:border-[#211955]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">
                Jenjang Unit {effectiveJenjangs.length === 1 ? '(Terkunci Sesuai SK)' : ''}
              </label>
              <select
                value={newJenjang}
                disabled={effectiveJenjangs.length === 1}
                onChange={(e) => {
                  const j = e.target.value as Jenjang;
                  setNewJenjang(j);
                  setNewOptionCount(JENJANG_META[j].defaultOptions);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-bold disabled:opacity-80"
              >
                {effectiveJenjangs.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-text-main block mb-1">
                Mata Pelajaran / Fan Kitab
              </label>
              <input
                type="text"
                required
                value={newMapel}
                onChange={(e) => setNewMapel(e.target.value)}
                placeholder="Contoh: Nahwu / Matematika"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Kelas / Marhalah</label>
              <input
                type="text"
                value={newKelas}
                onChange={(e) => setNewKelas(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Opsi PG</label>
              <select
                value={newOptionCount}
                onChange={(e) => setNewOptionCount(Number(e.target.value) as 4 | 5)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              >
                <option value={4}>4 Opsi (A–D)</option>
                <option value={5}>5 Opsi (A–E)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Nilai KKM</label>
              <input
                type="number"
                value={newKkm}
                onChange={(e) => setNewKkm(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-main flex items-center justify-between">
              <span>Guru / Ustadz Pengampu</span>
              {lockGuruIdentity && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#087963]">
                  <Lock className="w-3 h-3" />
                  <span>Terkunci ke Akun Anda</span>
                </span>
              )}
            </label>
            {!lockGuruIdentity && unitTeachers.length > 0 && (
              <select
                value={newGuruId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) {
                    setNewGuruId(undefined);
                    return;
                  }
                  const t = unitTeachers.find((item) => item.id === selectedId);
                  if (t) {
                    setNewGuruId(t.id);
                    setNewGuru(t.gelar ? `${t.nama}, ${t.gelar}` : t.nama);
                    if (t.mapelAmpu && !isGenericMapelLabel(t.mapelAmpu) && !newMapel) {
                      setNewMapel(t.mapelAmpu);
                    }
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main font-semibold"
              >
                <option value="">-- Pilih dari Daftar Akun Guru (Opsional) --</option>
                {unitTeachers.map((t) => {
                  const fullName = t.gelar ? `${t.nama}, ${t.gelar}` : t.nama;
                  return (
                    <option key={t.id} value={t.id}>
                      {fullName} {t.mapelAmpu && !isGenericMapelLabel(t.mapelAmpu) ? `(${t.mapelAmpu})` : ''}
                    </option>
                  );
                })}
              </select>
            )}
            <input
              type="text"
              value={newGuru}
              readOnly={lockGuruIdentity}
              disabled={lockGuruIdentity}
              onChange={(e) => {
                setNewGuru(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main disabled:opacity-80 disabled:font-bold"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={newHasArabic}
              onChange={(e) => setNewHasArabic(e.target.checked)}
              className="rounded text-[#211955]"
            />
            <span className="font-semibold text-text-main">
              Aktifkan dukungan Teks Arab / Ibarat Kitab Kuning (RTL)
            </span>
          </label>

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
              Simpan Paket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface BulkImportQuestionModalProps {
  isOpen: boolean;
  activePacket: ExamPacket;
  bulkText: string;
  onChangeBulkText: (val: string) => void;
  onClose: () => void;
  onImportQuestions: (imported: Question[]) => void;
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export const BulkImportQuestionModal: React.FC<BulkImportQuestionModalProps> = ({
  isOpen,
  activePacket,
  bulkText,
  onChangeBulkText,
  onClose,
  onImportQuestions,
}) => {
  const [importTab, setImportTab] = useState<'PASTE' | 'FILE_EXPORT'>('PASTE');
  const [fileFeedback, setFileFeedback] = useState<string>('');
  const [autoFormatMathImport, setAutoFormatMathImport] = useState<boolean>(true);

  if (!isOpen) return null;

  const normMath = (val: string) => (autoFormatMathImport ? formatMathNotation(val) : val);

  const handleSubmitPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const imported: Question[] = lines.map((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      const prompt = normMath(parts[0] || `Soal Import #${idx + 1}`);
      const arabic = parts[1] || undefined;
      const optA = normMath(parts[2] || 'Pilihan A');
      const optB = normMath(parts[3] || 'Pilihan B');
      const optC = normMath(parts[4] || 'Pilihan C');
      const optD = normMath(parts[5] || 'Pilihan D');
      const key = ((parts[6] || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D') || 'A';

      return {
        id: `q-imp-${Date.now()}-${idx}`,
        nomor: activePacket.questions.length + idx + 1,
        type: 'PG',
        prompt,
        arabicPrompt: arabic,
        isRtl: Boolean(arabic),
        options: [
          { label: 'A', text: optA },
          { label: 'B', text: optB },
          { label: 'C', text: optC },
          { label: 'D', text: optD },
          ...(activePacket.optionCount === 5 ? [{ label: 'E' as const, text: 'Pilihan E' }] : []),
        ],
        correctAnswer: ['A', 'B', 'C', 'D', 'E'].includes(key) ? key : 'A',
        weight: 20,
      };
    });

    onImportQuestions(imported);
    onChangeBulkText('');
    onClose();
  };

  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Tipe (PG/PG_KOMPLEKS/MENJODOHKAN/BENAR_SALAH/ESAI)',
      'Pertanyaan_Indonesia',
      'Matan_Arab_RTL',
      'Referensi_Kitab',
      'Opsi_A',
      'Opsi_B',
      'Opsi_C',
      'Opsi_D',
      'Opsi_E',
      'Kunci_Jawaban',
      'Bobot',
      'Pembahasan_Atau_Rubrik',
    ];
    const sampleRows = [
      [
        'PG',
        '"Apa hukum melaksanakan shalat berjamaah lima waktu menurut jumhur ulama Syafi’iyyah?"',
        '"صَلَاةُ الْجَمَاعَةِ فَرْضُ كِفَايَةٍ"',
        '"Fathul Qarib Bab Shalat Jamaah"',
        '"Fardhu Kifayah bagi laki-laki mukim"',
        '"Sunnah Ghairu Muakkadah"',
        '"Fardhu Ain tanpa terkecuali"',
        '"Mubah"',
        '""',
        'A',
        '25',
        '"Menurut pendapat ashah dalam mazhab Syafi’i, shalat berjamaah hukumnya Fardhu Kifayah."',
      ],
      [
        'MENJODOHKAN',
        '"Pasangkanlah pernyataan pada Kolom A dengan pasangan jawaban yang tepat pada Kolom B!"',
        '""',
        '"Fiqih & Tajwid Dasar"',
        '"Air suci menyucikan => Air Mutlak"',
        '"Nun Mati bertemu Ba => Iqlab"',
        '"Khalifah pertama => Abu Bakar Ash-Shiddiq"',
        '""',
        '""',
        '"Air suci menyucikan => Air Mutlak; Nun Mati bertemu Ba => Iqlab; Khalifah pertama => Abu Bakar Ash-Shiddiq"',
        '25',
        '"Pasangan 1: Air Mutlak, Pasangan 2: Iqlab, Pasangan 3: Abu Bakar Ash-Shiddiq."',
      ],
      [
        'BENAR_SALAH',
        '"Lafaz الْكَلَامُ dalam Matan Jurumiyah disyaratkan harus murakkab (tersusun) dan mufid (berfaedah)."',
        '"الْكَلَامُ هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ"',
        '"Matan Al-Ajurrumiyah Bab Kalam"',
        '""',
        '""',
        '""',
        '""',
        '""',
        'BENAR',
        '20',
        '"Empat rukun kalam menurut ulama Nahwu: Lafaz, Murakkab, Mufid, dan Bil Wadh’i."',
      ],
    ];
    const csv = '\uFEFF' + [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Bank_Soal_${activePacket.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPacketCsv = () => {
    const headers = [
      'Tipe',
      'Pertanyaan_Indonesia',
      'Matan_Arab_RTL',
      'Referensi_Kitab',
      'Opsi_A',
      'Opsi_B',
      'Opsi_C',
      'Opsi_D',
      'Opsi_E',
      'Kunci_Jawaban',
      'Bobot',
      'Pembahasan_Atau_Rubrik',
    ];
    const esc = (v?: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const rows = activePacket.questions.map((q) => {
      const optMap: Record<string, string> = {};
      q.options?.forEach((o) => {
        optMap[o.label] = o.text;
      });
      if (q.type === 'MENJODOHKAN' && q.matchingPairs) {
        const labels = ['A', 'B', 'C', 'D', 'E'];
        q.matchingPairs.slice(0, 5).forEach((p, idx) => {
          optMap[labels[idx]] = `${p.leftText} => ${p.rightText}`;
        });
      }
      const keyStr =
        q.type === 'PG'
          ? q.correctAnswer || 'A'
          : q.type === 'PG_KOMPLEKS'
          ? (q.correctAnswers || ['A', 'B']).join(';')
          : q.type === 'MENJODOHKAN'
          ? (q.matchingPairs || []).map((p) => `${p.leftText} => ${p.rightText}`).join('; ')
          : q.type === 'BENAR_SALAH'
          ? q.correctBoolean
            ? 'BENAR'
            : 'SALAH'
          : q.essayRubric || '';

      return [
        q.type,
        esc(q.prompt),
        esc(q.arabicPrompt),
        esc(q.kitabReference),
        esc(optMap['A']),
        esc(optMap['B']),
        esc(optMap['C']),
        esc(optMap['D']),
        esc(optMap['E']),
        esc(keyStr),
        String(q.weight),
        esc(q.pembahasan || q.essayRubric),
      ];
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Export_Soal_${activePacket.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPacketJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      packetCode: activePacket.code,
      packetTitle: activePacket.title,
      jenjang: activePacket.jenjang,
      mapel: activePacket.mapel,
      questions: activePacket.questions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Export_Paket_${activePacket.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUploadImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '').replace(/^\uFEFF/, '');
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          const list: Question[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.questions)
            ? parsed.questions
            : [];
          if (list.length === 0) {
            setFileFeedback('File JSON tidak berisi daftar questions yang valid.');
            return;
          }
          const normalized = list.map((q, idx) => ({
            ...q,
            id: `q-json-${Date.now()}-${idx}`,
            nomor: activePacket.questions.length + idx + 1,
          }));
          onImportQuestions(normalized);
          setFileFeedback(`Berhasil mengimpor ${normalized.length} butir soal dari JSON!`);
          setTimeout(() => onClose(), 800);
          return;
        }

        // Otherwise parse as CSV
        const lines = content
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length < 2) {
          setFileFeedback('File CSV kosong atau tidak memiliki baris data.');
          return;
        }
        const dataLines = lines.slice(1);
        const imported: Question[] = dataLines.map((line, idx) => {
          const cols = parseCsvRow(line);
          const rawType = (cols[0] || 'PG').toUpperCase();
          const type: QuestionType = (
            ['PG', 'PG_KOMPLEKS', 'MENJODOHKAN', 'BENAR_SALAH', 'ESAI'].includes(rawType)
              ? rawType
              : 'PG'
          ) as QuestionType;
          const prompt = normMath(cols[1] || `Soal CSV #${idx + 1}`);
          const arabicPrompt = cols[2] || undefined;
          const kitabReference = cols[3] || undefined;
          const optA = normMath(cols[4] || 'Pilihan A');
          const optB = normMath(cols[5] || 'Pilihan B');
          const optC = normMath(cols[6] || 'Pilihan C');
          const optD = normMath(cols[7] || 'Pilihan D');
          const optE = normMath(cols[8] || 'Pilihan E');
          const keyRaw = (cols[9] || 'A').trim();
          const weight = Number(cols[10]) || 20;
          const pembahasan = cols[11] ? normMath(cols[11]) : undefined;

          const options =
            type === 'PG' || type === 'PG_KOMPLEKS'
              ? [
                  { label: 'A' as const, text: optA },
                  { label: 'B' as const, text: optB },
                  { label: 'C' as const, text: optC },
                  { label: 'D' as const, text: optD },
                  ...(activePacket.optionCount === 5
                    ? [{ label: 'E' as const, text: optE }]
                    : []),
                ]
              : undefined;

          let matchingPairs = undefined;
          if (type === 'MENJODOHKAN') {
            const rawPairSource = keyRaw.includes('=>')
              ? keyRaw.split(';')
              : [cols[4], cols[5], cols[6], cols[7], cols[8]].filter((c) => c && c.includes('=>'));
            const parsedPairs = rawPairSource
              .map((chunk, pIdx) => {
                const [l, r] = (chunk || '').split('=>').map((s) => s.trim());
                if (!l || !r) return null;
                return { id: `P${pIdx + 1}`, leftText: normMath(l), rightText: normMath(r) };
              })
              .filter((item): item is { id: string; leftText: string; rightText: string } =>
                Boolean(item)
              );
            matchingPairs =
              parsedPairs.length >= 2
                ? parsedPairs
                : [
                    { id: 'P1', leftText: optA, rightText: optB },
                    { id: 'P2', leftText: optC, rightText: optD },
                  ];
          }

          return {
            id: `q-csv-${Date.now()}-${idx}`,
            nomor: activePacket.questions.length + idx + 1,
            type,
            prompt,
            arabicPrompt,
            kitabReference,
            isRtl: Boolean(arabicPrompt),
            options,
            matchingPairs,
            correctAnswer:
              type === 'PG'
                ? ((['A', 'B', 'C', 'D', 'E'].includes(keyRaw.toUpperCase())
                    ? keyRaw.toUpperCase()
                    : 'A') as 'A' | 'B' | 'C' | 'D' | 'E')
                : undefined,
            correctAnswers:
              type === 'PG_KOMPLEKS'
                ? (keyRaw
                    .toUpperCase()
                    .split(/[;,]/)
                    .map((s) => s.trim())
                    .filter((s) => ['A', 'B', 'C', 'D', 'E'].includes(s)) as (
                    | 'A'
                    | 'B'
                    | 'C'
                    | 'D'
                    | 'E'
                  )[])
                : undefined,
            correctBoolean:
              type === 'BENAR_SALAH'
                ? !['SALAH', 'FALSE', 'KHATHA'].includes(keyRaw.toUpperCase())
                : undefined,
            essayRubric: type === 'ESAI' ? pembahasan || normMath(keyRaw) : undefined,
            weight,
            pembahasan,
          };
        });

        onImportQuestions(imported);
        setFileFeedback(`Berhasil mengimpor ${imported.length} soal dari CSV!`);
        setTimeout(() => onClose(), 800);
      } catch {
        setFileFeedback('Gagal memproses file. Pastikan format CSV atau JSON sesuai template.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-2xl w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-main">
              Import &amp; Export Kolektif Bank Soal ({activePacket.code})
            </h3>
            <p className="text-xs text-text-muted">
              Mendukung Copy-Paste Cepat, Upload CSV/JSON, serta Export Paket Soal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-border-subtle text-xs">
          <button
            type="button"
            onClick={() => setImportTab('PASTE')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition ${
              importTab === 'PASTE'
                ? 'bg-[#211955] text-white shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            1. Copy-Paste Cepat (Baris | Pipe)
          </button>
          <button
            type="button"
            onClick={() => setImportTab('FILE_EXPORT')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold transition ${
              importTab === 'FILE_EXPORT'
                ? 'bg-[#211955] text-white shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            2. Upload File CSV/JSON &amp; Export Paket
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-xs">
          <label className="inline-flex items-center gap-2 font-bold text-[#211955] dark:text-indigo-200 cursor-pointer">
            <input
              type="checkbox"
              checked={autoFormatMathImport}
              onChange={(e) => setAutoFormatMathImport(e.target.checked)}
              className="rounded text-[#211955]"
            />
            <span>
              Otomatis ubah notasi matematika (<code className="font-mono">x^2 &rarr; x²</code>,{' '}
              <code className="font-mono">x_1 &rarr; x₁</code>,{' '}
              <code className="font-mono">&lt;= &rarr; ≤</code>) saat Import
            </span>
          </label>
          {importTab === 'PASTE' && (
            <button
              type="button"
              onClick={() => onChangeBulkText(formatMathNotation(bulkText))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14B894] hover:bg-[#0b987c] text-white text-[11px] font-extrabold transition"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Ubah x^2 &rarr; x² Sekarang</span>
            </button>
          )}
        </div>

        {importTab === 'PASTE' ? (
          <>
            <p className="text-xs text-text-muted leading-relaxed">
              Tempelkan daftar soal (1 baris = 1 soal Pilihan Ganda) dengan pemisah tanda{' '}
              <code className="px-1.5 py-0.5 rounded bg-surface font-mono font-bold text-text-main">
                |
              </code>{' '}
              berikut:
              <br />
              <strong className="text-text-main font-mono text-[11px]">
                Pertanyaan | Teks Arab (kosongkan jika tidak ada) | Opsi A | Opsi B | Opsi C | Opsi
                D | Kunci (A/B/C/D)
              </strong>
            </p>
            <form onSubmit={handleSubmitPaste} className="space-y-3 text-xs">
              <textarea
                rows={6}
                required
                value={bulkText}
                onChange={(e) => onChangeBulkText(e.target.value)}
                placeholder="Contoh: Hasil dari 2^3 + 3^2 adalah... | | 15 | 17 | 19 | 21 | B"
                className="w-full p-3.5 rounded-2xl bg-surface border border-border-subtle text-text-main font-mono text-xs"
              />
              <div className="flex justify-end gap-2">
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
                  Import ke Paket Ini
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Upload Box */}
            <div className="rounded-2xl border-2 border-dashed border-border-subtle bg-surface/60 p-5 text-center space-y-2.5">
              <Upload className="w-8 h-8 text-[#211955] mx-auto" />
              <div className="font-extrabold text-text-main text-sm">
                Upload File Bank Soal (.CSV atau .JSON)
              </div>
              <p className="text-text-muted max-w-md mx-auto">
                Mendukung seluruh tipe soal (PG, PG Kompleks, Benar/Salah, dan Esai/Tarkib) beserta
                teks Arab RTL dan kunci jawaban.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold cursor-pointer shadow-sm transition">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File CSV / JSON</span>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUploadImport}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-elevated hover:bg-indigo-50 text-text-main border border-border-subtle font-extrabold transition"
                >
                  <Download className="w-4 h-4 text-[#087963]" />
                  <span>Unduh Template CSV Resmi</span>
                </button>
              </div>

              {fileFeedback && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-teal-50 text-[#087963] font-extrabold">
                  {fileFeedback}
                </div>
              )}
            </div>

            {/* Export Current Packet Box */}
            <div className="rounded-2xl bg-surface p-4 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-text-main">
                  Export Paket Soal Ini ({activePacket.questions.length} Butir Soal)
                </div>
                <div className="text-text-muted text-[11px]">
                  Simpan cadangan atau bagikan paket soal ini ke pengampu madrasah lain.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportPacketCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14B894] hover:bg-[#0b987c] text-white font-extrabold transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPacketJson}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8B478] hover:bg-[#f3a35c] text-[#1E1645] font-extrabold transition"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
