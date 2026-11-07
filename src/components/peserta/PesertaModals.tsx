import React, { useRef, useState } from 'react';
import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  KeyRound,
  ShieldCheck,
  Square,
  Upload,
  UserCog,
  X,
} from 'lucide-react';
import {
  Jenjang,
  JurusanMA,
  NavTab,
  Student,
  Teacher,
  TeacherPeran,
} from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';
import {
  downloadStudentExcelTemplate,
  downloadTeacherCsvTemplate,
  downloadTeacherExcelTemplate,
  normalizeSpreadsheetTextToPipeLines,
  parseBulkTeacherText,
  readUploadedSpreadsheetFile,
} from '../../utils/excelTemplateHelper';

export const ROLE_DEFAULT_TABS: Record<TeacherPeran, NavTab[]> = {
  'Kepala Madrasah / Mudir': [
    'dashboard',
    'bank-soal',
    'jadwal-live',
    'peserta-kartu',
    'rekap-nilai',
  ],
  'Wali Kelas': ['dashboard', 'peserta-kartu', 'rekap-nilai'],
  'Guru Mapel': ['dashboard', 'bank-soal', 'rekap-nilai'],
  'Pengawas CBT': ['dashboard', 'jadwal-live', 'peserta-kartu'],
  'Koordinator Kurikulum': [
    'dashboard',
    'bank-soal',
    'jadwal-live',
    'peserta-kartu',
    'rekap-nilai',
    'pengaturan',
  ],
};

export const ALL_NAV_TABS: { id: NavTab; label: string; desc: string }[] = [
  {
    id: 'dashboard',
    label: 'Beranda Utama',
    desc: 'Ringkasan statistik & pantauan sesi ujian',
  },
  {
    id: 'bank-soal',
    label: 'Bank Soal & Kitab',
    desc: 'Buat/edit paket soal, lampiran gambar/audio & kunci jawaban',
  },
  {
    id: 'jadwal-live',
    label: 'Jadwal & Proctoring',
    desc: 'Kelola token sesi, pengawas ruang & pantauan live peserta',
  },
  {
    id: 'peserta-kartu',
    label: 'Database Santri & Kartu',
    desc: 'Lihat/input data santri, cetak Kartu Peserta & Berita Acara',
  },
  {
    id: 'rekap-nilai',
    label: 'Rekap Nilai & Leger',
    desc: 'Koreksi esai, analisis butir soal & cetak Leger Nilai PDF',
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan Lembaga',
    desc: 'Konfigurasi identitas yayasan, keamanan anti-cheat & backup',
  },
];

interface BulkImportStudentModalProps {
  bulkStudentText: string;
  onChangeText: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const BulkImportStudentModal: React.FC<BulkImportStudentModalProps> = ({
  bulkStudentText,
  onChangeText,
  onSubmit,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const handleDownloadCsvTemplate = () => {
    const csvHeader =
      'Nama Lengkap|Jenjang (MTs/MA/Wustho/Ulya)|Kelas|Ruang|NISN|Gender (L/P)|Sesi (Sesi 1 (Pagi)/Sesi 2 (Siang))\n';
    const sampleRows = [
      'Muhammad Naufal Al-Ghifari|MTs|VIII-A|Lab CBT 1|0098412001|L|Sesi 1 (Pagi)',
      'Siti Aisyah Humaira|MA|XII MAK-1|Lab CBT 2|0071928301|P|Sesi 1 (Pagi)',
      'Ahmad Syauqi Al-Banjari|Wustho|II Wustho A|Lab Turats 1|3120098401|L|Sesi 1 (Pagi)',
      "Fatimah Az-Zahra|Ulya|III 'Ulya|Aula Ma'had 'Ulya|5019283701|P|Sesi 2 (Siang)",
    ].join('\n');
    const blob = new Blob([csvHeader + sampleRows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Database_Santri_Real_JN_ExamCBTCore.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const normalized = await readUploadedSpreadsheetFile(file, 7, 'nama');
      onChangeText(normalized);
      setUploadNotice(`File "${file.name}" berhasil dibaca.`);
    } catch (err: any) {
      setUploadNotice(err?.message || 'Gagal membaca file Excel/CSV.');
    }
    e.target.value = '';
  };

  const handleTextChange = (raw: string) => {
    if (raw.includes('\t')) {
      onChangeText(normalizeSpreadsheetTextToPipeLines(raw, 7, 'nama'));
    } else {
      onChangeText(raw);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-2xl w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-main">
              Import Kolektif Database Santri / Siswa Real (Excel / CSV)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Unggah file Excel (<code className="font-mono">.xlsx</code>) / CSV atau tempelkan
              langsung blok tabel dari Excel untuk membuat Nomor Peserta &amp; PIN otomatis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-surface border border-border-subtle text-xs">
          <div className="space-y-0.5">
            <div className="font-extrabold text-text-main">
              Format Kolom Excel / CSV (Pemisah <code className="px-1 rounded bg-elevated">|</code>{' '}
              atau Copy-Paste langsung dari Excel):
            </div>
            <div className="font-mono text-[11px] text-text-muted">
              Nama Lengkap | Jenjang (MTs/MA/Wustho/Ulya) | Kelas | Ruang | NISN | L/P | Sesi
            </div>
            {uploadNotice && (
              <div className="text-[11px] font-bold text-[#087963] pt-0.5">{uploadNotice}</div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadStudentExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] border border-teal-200 font-extrabold transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Template Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated hover:bg-indigo-50 text-[#211955] border border-border-subtle font-extrabold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template CSV</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#211955] text-white font-extrabold transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Excel / CSV</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv,.txt"
              onChange={handleUploadFile}
              className="hidden"
            />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <textarea
            rows={7}
            required
            value={bulkStudentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Tempelkan (Ctrl+V) baris tabel dari Excel di sini...&#10;Contoh:&#10;Ahmad Zaki | MTs | VIII-A | Lab CBT 1 | 0098412001 | L | Sesi 1 (Pagi)"
            className="w-full p-3.5 rounded-2xl bg-surface border border-border-subtle text-text-main font-mono text-xs focus:outline-none focus:border-[var(--brand-text-accent)]"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-text-muted">
              Baris terdeteksi:{' '}
              <strong className="text-text-main">
                {
                  bulkStudentText
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean).length
                }{' '}
                santri
              </strong>
            </span>
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
                className="px-5 py-2 rounded-xl bg-[#211955] text-white font-extrabold shadow-sm"
              >
                Import ke Database Santri
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface BulkImportTeacherModalProps {
  bulkTeacherText: string;
  defaultJenjang: Jenjang;
  existingCount: number;
  onChangeText: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const BulkImportTeacherModal: React.FC<BulkImportTeacherModalProps> = ({
  bulkTeacherText,
  defaultJenjang,
  existingCount,
  onChangeText,
  onSubmit,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const previewTeachers = parseBulkTeacherText(
    bulkTeacherText,
    defaultJenjang,
    existingCount
  );

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const normalized = await readUploadedSpreadsheetFile(file, 9, 'nama');
      onChangeText(normalized);
      setUploadNotice(`File "${file.name}" berhasil dimuat (${normalized.split('\n').filter(Boolean).length} baris guru).`);
    } catch (err: any) {
      setUploadNotice(err?.message || 'Gagal membaca file Excel/CSV.');
    }
    e.target.value = '';
  };

  const handleTextChange = (raw: string) => {
    if (raw.includes('\t')) {
      onChangeText(normalizeSpreadsheetTextToPipeLines(raw, 9, 'nama'));
    } else {
      onChangeText(raw);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-elevated rounded-[28px] max-w-4xl w-full p-6 shadow-floating border border-border-subtle space-y-4 my-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#087963] text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-text-main">
                Import Masal Akun Guru Mapel, Wali Kelas &amp; Pejabat (Excel / CSV)
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Unduh <strong>Template Excel (.xlsx)</strong>, isi daftar guru di Microsoft Excel /
                Google Sheets, lalu unggah kembali atau <em>Copy–Paste</em> langsung ke bawah ini.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panduan Kolom & Tombol Download/Upload Template */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border-subtle text-xs">
          <div className="space-y-1">
            <div className="font-extrabold text-text-main">
              Urutan Kolom Template Excel (Kolom A s/d I):
            </div>
            <div className="font-mono text-[11px] text-text-muted leading-relaxed">
              <strong className="text-[#211955] dark:text-[#F8B478]">1. Nama Lengkap*</strong> |{' '}
              <strong className="text-[#211955] dark:text-[#F8B478]">2. Jenjang (MTs/MA/Wustho/Ulya)</strong>{' '}
              | <strong className="text-[#211955] dark:text-[#F8B478]">3. Username</strong> |{' '}
              <strong className="text-[#211955] dark:text-[#F8B478]">4. Password</strong> | 5. Mapel
              (Opsional) | 6. Peran (Opsional) | 7. NIP | 8. No. WA | 9. Kelas Binaan
            </div>
            <div className="text-[11px] text-text-muted">
              💡 <strong>Tips Cepat:</strong> Cukup isi{' '}
              <strong>Nama Lengkap</strong> &amp; <strong>Jenjang</strong> saja di Excel — jika{' '}
              <em>Username</em>, <em>Password</em>, atau <em>Mapel</em> dikosongkan, sistem akan
              membuatkannya secara otomatis!
            </div>
            {uploadNotice && (
              <div className="text-[11px] font-extrabold text-[#087963] pt-0.5">{uploadNotice}</div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={downloadTeacherExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] border border-teal-200 font-extrabold transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Template Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={downloadTeacherCsvTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-elevated hover:bg-indigo-50 text-[#211955] border border-border-subtle font-extrabold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template CSV</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold transition shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah File Excel (.xlsx / .csv)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv,.txt"
              onChange={handleUploadFile}
              className="hidden"
            />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-extrabold text-text-main block mb-1.5">
              Data Baris Guru (Hasil Unggah Excel atau Copy–Paste Langsung dari Tabel Excel):
            </label>
            <textarea
              rows={6}
              required
              value={bulkTeacherText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={
                'Unggah file Excel (.xlsx) di atas, atau blok tabel di Excel lalu Copy-Paste (Ctrl+V) langsung ke sini...\nContoh:\nUst. H. Abdurrahman, Lc. | MA | guru_fiqih_ma | guru123 | Fiqih & Ushul Fiqih | Guru Mapel\nUstadzah Siti Aisyah, S.Pd. | MA | guru_bio_ma | guru123 | Biologi | Guru Mapel\nUst. Muhammad Syauqi, S.Pd.I. | MTs, MA | guru_arab | guru123'
              }
              className="w-full p-3.5 rounded-2xl bg-surface border border-border-subtle text-text-main font-mono text-xs focus:outline-none focus:border-[var(--brand-text-accent)]"
            />
          </div>

          {/* Live Preview Table */}
          {previewTeachers.length > 0 && (
            <div className="rounded-2xl border border-border-subtle overflow-hidden bg-surface">
              <div className="px-4 py-2.5 bg-elevated border-b border-border-subtle flex items-center justify-between">
                <span className="font-extrabold text-text-main">
                  Pratinjau Akun Guru Siap Import ({previewTeachers.length} Akun)
                </span>
                <span className="text-[11px] text-text-muted">
                  Hak akses RBAC otomatis mengikuti peran masing-masing
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-surface/80 text-text-muted border-b border-border-subtle">
                      <th className="py-2 px-3 font-bold">#</th>
                      <th className="py-2 px-3 font-bold">Nama Lengkap Guru</th>
                      <th className="py-2 px-3 font-bold">Jenjang</th>
                      <th className="py-2 px-3 font-bold">Username Login</th>
                      <th className="py-2 px-3 font-bold">Password</th>
                      <th className="py-2 px-3 font-bold">Mapel / Kitab</th>
                      <th className="py-2 px-3 font-bold">Peran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/60">
                    {previewTeachers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-elevated/60">
                        <td className="py-2 px-3 font-mono text-text-muted">{idx + 1}</td>
                        <td className="py-2 px-3 font-extrabold text-text-main">{t.nama}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {t.jenjangAmpu.map((j) => (
                              <span
                                key={j}
                                className="px-1.5 py-0.5 rounded text-[10px] font-extrabold"
                                style={{
                                  backgroundColor: JENJANG_META[j].badgeBg,
                                  color: JENJANG_META[j].badgeText,
                                }}
                              >
                                {JENJANG_META[j].shortLabel}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-[#211955] dark:text-[#F8B478]">
                          {t.username}
                        </td>
                        <td className="py-2 px-3 font-mono text-text-main">{t.password}</td>
                        <td className="py-2 px-3 text-text-muted">{t.mapelAmpu}</td>
                        <td className="py-2 px-3 font-bold text-[#087963]">{t.peran}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-text-muted">
              Akun terdeteksi:{' '}
              <strong className="text-text-main">{previewTeachers.length} akun guru/pejabat</strong>
            </span>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-surface text-text-muted font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={previewTeachers.length === 0}
                className="px-5 py-2.5 rounded-xl bg-[#087963] hover:bg-[#066350] disabled:opacity-50 text-white font-extrabold shadow-sm transition"
              >
                Import {previewTeachers.length > 0 ? `${previewTeachers.length} ` : ''}Akun Guru ke
                Sistem
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface StudentFormModalProps {
  editingStudent: Student | null;
  nama: string;
  setNama: (v: string) => void;
  nomorPeserta: string;
  setNomorPeserta: (v: string) => void;
  pin: string;
  setPin: (v: string) => void;
  jenjang: Jenjang;
  setJenjang: (v: Jenjang) => void;
  nisn: string;
  setNisn: (v: string) => void;
  kelas: string;
  setKelas: (v: string) => void;
  ruang: string;
  setRuang: (v: string) => void;
  sesi: 'Sesi 1 (Pagi)' | 'Sesi 2 (Siang)';
  setSesi: (v: 'Sesi 1 (Pagi)' | 'Sesi 2 (Siang)') => void;
  gender: 'L' | 'P';
  setGender: (v: 'L' | 'P') => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  editingStudent,
  nama,
  setNama,
  nomorPeserta,
  setNomorPeserta,
  pin,
  setPin,
  jenjang,
  setJenjang,
  nisn,
  setNisn,
  kelas,
  setKelas,
  ruang,
  setRuang,
  sesi,
  setSesi,
  gender,
  setGender,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-lg w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-main">
              {editingStudent ? 'Edit Data Santri / Peserta Ujian' : 'Input Data Santri Real Baru'}
            </h3>
            <p className="text-xs text-text-muted">
              Data santri ini akan digunakan untuk login ujian CBT dan pencetakan Kartu Peserta.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-text-main block mb-1">
              Nama Lengkap Santri / Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap sesuai ijazah / buku induk"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">
                Nomor Peserta CBT (Username Siswa)
              </label>
              <input
                type="text"
                value={nomorPeserta}
                onChange={(e) => setNomorPeserta(e.target.value)}
                placeholder="Kosongkan = Otomatis (26-MTS-001)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">
                PIN Sesi Login (6 Digit)
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Kosongkan = Acak 6 Digit"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Jenjang Pendidikan</label>
              <select
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value as Jenjang)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-semibold"
              >
                <option value="MTs">MTs (Madrasah Tsanawiyah)</option>
                <option value="MA">MA (Madrasah Aliyah)</option>
                <option value="Wustho">PDF / Diniyah Wustho</option>
                <option value="Ulya">PDF / Ma&apos;had &apos;Ulya</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">NISN / NISM / Nomor Induk</label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="Contoh: 0098123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Kelas / Marhalah</label>
              <input
                type="text"
                required
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Contoh: VIII-A / XI MIPA / XII IPS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            {jenjang === 'MA' ? (
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Jurusan Peminatan MA (MIPA / IPS)
                </label>
                <select
                  value={
                    kelas.toUpperCase().includes('MIPA') || kelas.toUpperCase().includes('IPA')
                      ? 'MIPA'
                      : kelas.toUpperCase().includes('IPS')
                      ? 'IPS'
                      : ''
                  }
                  onChange={(e) => {
                    const nextJ = e.target.value as JurusanMA;
                    const base =
                      kelas
                        .replace(/\b(MIPA|IPA|IPS)\b/gi, '')
                        .replace(/[-_]+$/g, '')
                        .trim() || 'XI';
                    setKelas(nextJ ? `${base} ${nextJ}` : base);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-bold"
                >
                  <option value="">— Belum Ditentukan (Pilih MIPA / IPS) —</option>
                  <option value="MIPA">MIPA (Sains / IPA)</option>
                  <option value="IPS">IPS (Sosial)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="font-bold text-text-main block mb-1">Ruang Lab CBT</label>
                <input
                  type="text"
                  required
                  value={ruang}
                  onChange={(e) => setRuang(e.target.value)}
                  placeholder="Contoh: Lab CBT 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
            )}
          </div>

          {jenjang === 'MA' && (
            <div>
              <label className="font-bold text-text-main block mb-1">Ruang Lab CBT</label>
              <input
                type="text"
                required
                value={ruang}
                onChange={(e) => setRuang(e.target.value)}
                placeholder="Contoh: Lab CBT 1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Sesi Ujian</label>
              <select
                value={sesi}
                onChange={(e) =>
                  setSesi(e.target.value as 'Sesi 1 (Pagi)' | 'Sesi 2 (Siang)')
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              >
                <option value="Sesi 1 (Pagi)">Sesi 1 (Pagi)</option>
                <option value="Sesi 2 (Siang)">Sesi 2 (Siang)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              >
                <option value="L">Laki-laki (Putra / Banin)</option>
                <option value="P">Perempuan (Putri / Banat)</option>
              </select>
            </div>
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
              className="px-5 py-2 rounded-xl bg-[#211955] text-white font-extrabold shadow-sm"
            >
              {editingStudent ? 'Simpan Perubahan' : 'Simpan Santri Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TeacherFormModalProps {
  editingTeacher: Teacher | null;
  tNama: string;
  setTNama: (v: string) => void;
  tGelar: string;
  setTGelar: (v: string) => void;
  tNip: string;
  setTNip: (v: string) => void;
  tUsername: string;
  setTUsername: (v: string) => void;
  tPassword: string;
  setTPassword: (v: string) => void;
  tNoHp: string;
  setTNoHp: (v: string) => void;
  tMapel: string;
  setTMapel: (v: string) => void;
  tKelasBinaan: string;
  setTKelasBinaan: (v: string) => void;
  tJenjangList: Jenjang[];
  setTJenjangList: (v: Jenjang[]) => void;
  tPeran: TeacherPeran;
  setTPeran: (v: TeacherPeran) => void;
  tHakAkses: NavTab[];
  setTHakAkses: (v: NavTab[]) => void;
  syncToSchoolSettings: boolean;
  setSyncToSchoolSettings: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  editingTeacher,
  tNama,
  setTNama,
  tGelar,
  setTGelar,
  tNip,
  setTNip,
  tUsername,
  setTUsername,
  tPassword,
  setTPassword,
  tNoHp,
  setTNoHp,
  tMapel,
  setTMapel,
  tKelasBinaan,
  setTKelasBinaan,
  tJenjangList,
  setTJenjangList,
  tPeran,
  setTPeran,
  tHakAkses,
  setTHakAkses,
  syncToSchoolSettings,
  setSyncToSchoolSettings,
  onSubmit,
  onClose,
}) => {
  const handleRoleChange = (nextRole: TeacherPeran) => {
    setTPeran(nextRole);
    setTHakAkses(ROLE_DEFAULT_TABS[nextRole]);
    if (nextRole === 'Kepala Madrasah / Mudir' && !tMapel.trim()) {
      setTMapel('Pimpinan / Kepala Lembaga');
    } else if (nextRole === 'Wali Kelas' && !tMapel.trim()) {
      setTMapel('Wali Kelas / Pembina Romble');
    } else if (nextRole === 'Pengawas CBT' && !tMapel.trim()) {
      setTMapel('Proktor & Pengawas Ruang CBT');
    }
  };

  const toggleJenjang = (j: Jenjang) => {
    if (tJenjangList.includes(j)) {
      if (tJenjangList.length > 1) {
        setTJenjangList(tJenjangList.filter((item) => item !== j));
      }
    } else {
      setTJenjangList([...tJenjangList, j]);
    }
  };

  const toggleHakAkses = (tab: NavTab) => {
    if (tHakAkses.includes(tab)) {
      if (tHakAkses.length > 1) {
        setTHakAkses(tHakAkses.filter((t) => t !== tab));
      }
    } else {
      setTHakAkses([...tHakAkses, tab]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-elevated rounded-[28px] max-w-2xl w-full p-6 shadow-floating border border-border-subtle space-y-4 my-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#211955] text-[#F8B478] flex items-center justify-center shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-text-main">
                {editingTeacher
                  ? 'Edit Akun Pejabat / Wali Kelas / Guru & Hak Akses'
                  : 'Input Akun Kepala Madrasah/Diniyah, Wali Kelas & Guru Mapel'}
              </h3>
              <p className="text-xs text-text-muted">
                Konfigurasi identitas pejabat/pendidik beserta kredensial login dan hak akses modul
                CBT.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* Role Selector Pills */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle space-y-2">
            <label className="font-extrabold text-text-main block">
              1. Pilih Jabatan / Peran Akun <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  'Kepala Madrasah / Mudir',
                  'Wali Kelas',
                  'Guru Mapel',
                  'Pengawas CBT',
                  'Koordinator Kurikulum',
                ] as TeacherPeran[]
              ).map((role) => {
                const active = tPeran === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`px-3 py-2 rounded-xl text-left font-extrabold transition border ${
                      active
                        ? 'bg-[#211955] text-white border-[#211955] shadow-sm'
                        : 'bg-elevated text-text-main border-border-subtle hover:border-[var(--brand-text-accent)]'
                    }`}
                  >
                    <div className="text-xs">{role}</div>
                    <div
                      className={`text-[10px] font-medium mt-0.5 ${
                        active ? 'text-indigo-200' : 'text-text-muted'
                      }`}
                    >
                      {role === 'Kepala Madrasah / Mudir'
                        ? 'Pimpinan MTs / MA / Wustho / Ulya'
                        : role === 'Wali Kelas'
                        ? 'Rekap Nilai & Kartu Kelas Binaan'
                        : role === 'Guru Mapel'
                        ? 'Bank Soal & Koreksi Nilai Mapel'
                        : role === 'Pengawas CBT'
                        ? 'Token Sesi & Ruang Pengawas'
                        : 'Akses Penuh Kurikulum & Jadwal'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-text-main block mb-1">
                Nama Lengkap (Beserta Gelar Depan KH./Ust./Drs.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tNama}
                onChange={(e) => setTNama(e.target.value)}
                placeholder="Contoh: KH. Ahmad Fauzan / Ust. H. Abdurrahman"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">
                Gelar Belakang (Opsional)
              </label>
              <input
                type="text"
                value={tGelar}
                onChange={(e) => setTGelar(e.target.value)}
                placeholder="S.Pd.I., M.Pd. / Lc., M.Ag."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">
                {tPeran === 'Kepala Madrasah / Mudir'
                  ? 'Jabatan Kepemimpinan (Opsional)'
                  : 'Mata Pelajaran / Kitab Ampu (Opsional — Ditentukan Guru Saat Buat Soal)'}
              </label>
              <input
                type="text"
                value={tMapel}
                onChange={(e) => setTMapel(e.target.value)}
                placeholder={
                  tPeran === 'Kepala Madrasah / Mudir'
                    ? 'Contoh: Kepala Madrasah / Mudir Unit'
                    : 'Boleh dikosongkan (Guru bebas mengisi mapel saat membuat Paket Soal)'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>

            {tPeran === 'Wali Kelas' ? (
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Kelas Binaan / Rombel Wali Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tKelasBinaan}
                  onChange={(e) => setTKelasBinaan(e.target.value)}
                  placeholder="Contoh: VIII-A / XII MAK-1 / II Wustho A"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-semibold"
                />
              </div>
            ) : (
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Kelas Binaan (Opsional jika merangkap Wali Kelas)
                </label>
                <input
                  type="text"
                  value={tKelasBinaan}
                  onChange={(e) => setTKelasBinaan(e.target.value)}
                  placeholder="Kosongkan jika bukan Wali Kelas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">NIP / NIY / Nomor Induk</label>
              <input
                type="text"
                value={tNip}
                onChange={(e) => setTNip(e.target.value)}
                placeholder="Contoh: 198504122015031002"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Nomor WhatsApp / Kontak</label>
              <input
                type="text"
                value={tNoHp}
                onChange={(e) => setTNoHp(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          {/* Jenjang Ampu Multi-Select */}
          <div className="space-y-1.5">
            <label className="font-bold text-text-main block">
              Jenjang Wewenang / Satuan Pendidikan (Bisa pilih lebih dari 1)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['MTs', 'MA', 'Wustho', 'Ulya'] as Jenjang[]).map((j) => {
                const checked = tJenjangList.includes(j);
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleJenjang(j)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left font-bold transition ${
                      checked
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-[#211955] text-text-main'
                        : 'bg-surface border-border-subtle text-text-muted'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#211955] dark:text-[#F8B478] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted shrink-0" />
                    )}
                    <span className="truncate">{JENJANG_META[j].fullLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {tPeran === 'Kepala Madrasah / Mudir' && (
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={syncToSchoolSettings}
                onChange={(e) => setSyncToSchoolSettings(e.target.checked)}
                className="w-4 h-4 accent-[#211955]"
              />
              <span className="font-semibold text-text-main">
                Sinkronkan otomatis nama pejabat ini sebagai{' '}
                <strong>Pejabat Penandatangan Resmi (Kepala Madrasah / Mudir)</strong> pada Kartu
                Peserta, Berita Acara &amp; Leger Nilai sesuai jenjang yang dipilih.
              </span>
            </label>
          )}

          {/* Login Credentials Box */}
          <div className="p-4 rounded-2xl bg-surface border border-border-subtle space-y-3">
            <div className="flex items-center gap-2 text-text-main font-extrabold">
              <KeyRound className="w-4 h-4 text-[#B85D19]" />
              <span>2. Kredensial Login Portal CBT</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Username Login (atau NIP/NIY) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tUsername}
                  onChange={(e) => setTUsername(e.target.value)}
                  placeholder="Contoh: kamad_mts / wali_8a / guru_fiqih"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Password Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tPassword}
                  onChange={(e) => setTPassword(e.target.value)}
                  placeholder="Contoh: guru123"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-text-main font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Role Permissions / Hak Akses Login */}
          <div className="p-4 rounded-2xl bg-surface border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-main font-extrabold">
                <ShieldCheck className="w-4 h-4 text-[#087963]" />
                <span>3. Hak Akses Modul Login (RBAC)</span>
              </div>
              <button
                type="button"
                onClick={() => setTHakAkses(ROLE_DEFAULT_TABS[tPeran])}
                className="text-[11px] font-bold text-[var(--brand-text-accent)] hover:underline"
              >
                Reset ke Default {tPeran}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_NAV_TABS.map((tab) => {
                const allowed = tHakAkses.includes(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => toggleHakAkses(tab.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition ${
                      allowed
                        ? 'bg-elevated border-[#087963] text-text-main shadow-sm'
                        : 'bg-surface/60 border-border-subtle text-text-muted opacity-75'
                    }`}
                  >
                    {allowed ? (
                      <CheckSquare className="w-4 h-4 text-[#087963] shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-extrabold text-xs">{tab.label}</div>
                      <div className="text-[10px] text-text-muted leading-snug">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface text-text-muted font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold shadow-sm transition"
            >
              {editingTeacher ? 'Simpan Perubahan Akun' : 'Buat Akun & Aktifkan Hak Akses'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
