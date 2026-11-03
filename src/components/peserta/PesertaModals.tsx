import React from 'react';
import { X } from 'lucide-react';
import { Jenjang, Student } from '../../types/cbt';

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
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-xl w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            Import Kolektif Data Santri / Siswa
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Tempelkan baris data peserta dengan format pemisah{' '}
          <code className="px-1.5 py-0.5 rounded bg-surface font-mono font-bold text-text-main">
            |
          </code>
          :<br />
          <strong className="text-text-main font-mono">
            Nama Lengkap | Jenjang (MTs/MA/Wustho/Ulya) | Kelas | Ruang | NISN
          </strong>
        </p>
        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <textarea
            rows={5}
            required
            value={bulkStudentText}
            onChange={(e) => onChangeText(e.target.value)}
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
              Import &amp; Buat PIN Otomatis
            </button>
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
      <div className="bg-elevated rounded-[26px] max-w-md w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            {editingStudent ? 'Edit Data Peserta Ujian' : 'Tambah Peserta Ujian Baru'}
          </h3>
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
              Nama Lengkap Santri / Siswa
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Muhammad Naufal Al-Ghifari"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Jenjang</label>
              <select
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value as Jenjang)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              >
                <option value="MTs">MTs (Tsanawiyah)</option>
                <option value="MA">MA (Aliyah)</option>
                <option value="Wustho">PDF Wustho</option>
                <option value="Ulya">PDF &apos;Ulya</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">NISN / NISM</label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="0098123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Kelas / Marhalah</label>
              <input
                type="text"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Ruang Lab</label>
              <input
                type="text"
                value={ruang}
                onChange={(e) => setRuang(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>
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
                <option value="L">Laki-laki (Putra)</option>
                <option value="P">Perempuan (Putri)</option>
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
              className="px-5 py-2 rounded-xl bg-[#211955] text-white font-extrabold"
            >
              {editingStudent ? 'Simpan Perubahan' : 'Simpan & Buat PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TeacherFormModalProps {
  tNama: string;
  setTNama: (v: string) => void;
  tGelar: string;
  setTGelar: (v: string) => void;
  tMapel: string;
  setTMapel: (v: string) => void;
  tJenjang: Jenjang;
  setTJenjang: (v: Jenjang) => void;
  tPeran: 'Guru Mapel' | 'Pengawas CBT' | 'Koordinator Kurikulum';
  setTPeran: (v: 'Guru Mapel' | 'Pengawas CBT' | 'Koordinator Kurikulum') => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  tNama,
  setTNama,
  tGelar,
  setTGelar,
  tMapel,
  setTMapel,
  tJenjang,
  setTJenjang,
  tPeran,
  setTPeran,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-md w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            Tambah Guru / Pengawas CBT
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="font-bold text-text-main block mb-1">Nama Guru/Ustadz</label>
              <input
                type="text"
                required
                value={tNama}
                onChange={(e) => setTNama(e.target.value)}
                placeholder="Ust. H. Abdurrahman"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Gelar</label>
              <input
                type="text"
                value={tGelar}
                onChange={(e) => setTGelar(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-text-main block mb-1">Mapel / Kitab Ampu</label>
            <input
              type="text"
              required
              value={tMapel}
              onChange={(e) => setTMapel(e.target.value)}
              placeholder="Contoh: Balaghah & Mantiq"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Jenjang Utama</label>
              <select
                value={tJenjang}
                onChange={(e) => setTJenjang(e.target.value as Jenjang)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              >
                <option value="MTs">MTs</option>
                <option value="MA">MA</option>
                <option value="Wustho">Wustho</option>
                <option value="Ulya">&apos;Ulya</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Peran</label>
              <select
                value={tPeran}
                onChange={(e) =>
                  setTPeran(
                    e.target.value as
                      | 'Guru Mapel'
                      | 'Pengawas CBT'
                      | 'Koordinator Kurikulum'
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              >
                <option value="Guru Mapel">Guru Mapel</option>
                <option value="Pengawas CBT">Pengawas CBT</option>
                <option value="Koordinator Kurikulum">Koordinator Kurikulum</option>
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
              className="px-5 py-2 rounded-xl bg-[#211955] text-white font-extrabold"
            >
              Simpan Data Guru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
