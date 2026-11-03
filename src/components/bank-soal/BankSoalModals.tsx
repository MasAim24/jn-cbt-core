import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ExamPacket, Jenjang, Question } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface NewPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePacket: (packet: ExamPacket) => void;
}

export const NewPacketModal: React.FC<NewPacketModalProps> = ({
  isOpen,
  onClose,
  onCreatePacket,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newMapel, setNewMapel] = useState('');
  const [newJenjang, setNewJenjang] = useState<Jenjang>('MTs');
  const [newKelas, setNewKelas] = useState('VIII-A');
  const [newGuru, setNewGuru] = useState('Ust. H. Mahfudz Siddiq, S.Pd.I');
  const [newOptionCount, setNewOptionCount] = useState<4 | 5>(4);
  const [newKkm, setNewKkm] = useState(75);
  const [newHasArabic, setNewHasArabic] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMapel.trim()) return;
    const created: ExamPacket = {
      id: `pkt-${Date.now()}`,
      code: `CBT-${newJenjang.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      mapel: newMapel.trim(),
      jenjang: newJenjang,
      kelas: newKelas.trim(),
      guruNama: newGuru.trim(),
      optionCount: newOptionCount,
      kkm: Number(newKkm) || 75,
      hasArabicKitab: newHasArabic,
      updatedAt: 'Baru saja',
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
          <h3 className="text-lg font-extrabold text-text-main">Buat Paket Bank Soal Baru</h3>
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
              placeholder="Contoh: Imtihan Akhir Semester — Fiqih Fathul Qarib"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main focus:outline-none focus:border-[#211955]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Jenjang</label>
              <select
                value={newJenjang}
                onChange={(e) => {
                  const j = e.target.value as Jenjang;
                  setNewJenjang(j);
                  setNewOptionCount(JENJANG_META[j].defaultOptions);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              >
                <option value="MTs">Madrasah Tsanawiyah (MTs)</option>
                <option value="MA">Madrasah Aliyah (MA)</option>
                <option value="Wustho">PDF / Diniyah Wustho</option>
                <option value="Ulya">PDF / Diniyah &apos;Ulya</option>
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

          <div>
            <label className="font-bold text-text-main block mb-1">Guru / Ustadz Pengampu</label>
            <input
              type="text"
              value={newGuru}
              onChange={(e) => setNewGuru(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
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

export const BulkImportQuestionModal: React.FC<BulkImportQuestionModalProps> = ({
  isOpen,
  activePacket,
  bulkText,
  onChangeBulkText,
  onClose,
  onImportQuestions,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const imported: Question[] = lines.map((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      const prompt = parts[0] || `Soal Import #${idx + 1}`;
      const arabic = parts[1] || undefined;
      const optA = parts[2] || 'Pilihan A';
      const optB = parts[3] || 'Pilihan B';
      const optC = parts[4] || 'Pilihan C';
      const optD = parts[5] || 'Pilihan D';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-2xl w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            Import Soal Cepat (Copy-Paste Multi-Baris)
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Tempelkan daftar soal (1 baris = 1 soal Pilihan Ganda) dengan pemisah tanda{' '}
          <code className="px-1.5 py-0.5 rounded bg-surface font-mono font-bold text-text-main">
            |
          </code>{' '}
          berikut:
          <br />
          <strong className="text-text-main font-mono text-[11px]">
            Pertanyaan | Teks Arab (kosongkan jika tidak ada) | Opsi A | Opsi B | Opsi C | Opsi D |
            Kunci (A/B/C/D)
          </strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <textarea
            rows={6}
            required
            value={bulkText}
            onChange={(e) => onChangeBulkText(e.target.value)}
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
      </div>
    </div>
  );
};
