import React, { useState } from 'react';
import {
  CreditCard,
  FileText,
  FileUp,
  Plus,
  Printer,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Jenjang,
  JenjangFilter,
  SchoolSettings,
  Student,
  Teacher,
} from '../types/cbt';
import { JENJANG_META } from '../data/initialData';
import { StudentTableTab, TeacherGridTab } from './peserta/StudentTableTab';
import {
  AttendancePrintTab,
  ExamCardPrintTab,
} from './peserta/ExamCardPrintTab';
import {
  BulkImportStudentModal,
  StudentFormModal,
  TeacherFormModal,
} from './peserta/PesertaModals';

interface DataPesertaKartuViewProps {
  students: Student[];
  teachers: Teacher[];
  settings: SchoolSettings;
  selectedJenjang: JenjangFilter;
  onSelectJenjang: (j: JenjangFilter) => void;
  onSaveStudent: (s: Student) => void;
  onBulkSaveStudents?: (list: Student[]) => void;
  onRegenerateAllPins?: () => void;
  onDeleteStudent: (id: string) => void;
  onSaveTeacher: (t: Teacher) => void;
}

export const DataPesertaKartuView: React.FC<DataPesertaKartuViewProps> = ({
  students,
  teachers,
  settings,
  selectedJenjang,
  onSelectJenjang,
  onSaveStudent,
  onBulkSaveStudents,
  onRegenerateAllPins,
  onDeleteStudent,
  onSaveTeacher,
}) => {
  const [subTab, setSubTab] = useState<'SANTRI' | 'GURU' | 'KARTU' | 'PRESENSI'>('SANTRI');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);

  // Student form state
  const [nama, setNama] = useState('');
  const [nisn, setNisn] = useState('');
  const [jenjang, setJenjang] = useState<Jenjang>('MTs');
  const [kelas, setKelas] = useState('VIII-A');
  const [ruang, setRuang] = useState('Lab CBT 1');
  const [sesi, setSesi] = useState<'Sesi 1 (Pagi)' | 'Sesi 2 (Siang)'>('Sesi 1 (Pagi)');
  const [gender, setGender] = useState<'L' | 'P'>('L');

  // Teacher form state
  const [tNama, setTNama] = useState('');
  const [tGelar, setTGelar] = useState('S.Pd.I');
  const [tNip] = useState('');
  const [tMapel, setTMapel] = useState('');
  const [tJenjang, setTJenjang] = useState<Jenjang>('MTs');
  const [tPeran, setTPeran] = useState<
    'Guru Mapel' | 'Pengawas CBT' | 'Koordinator Kurikulum'
  >('Guru Mapel');

  const filteredStudents = students.filter((s) => {
    const matchJenjang = selectedJenjang === 'ALL' ? true : s.jenjang === selectedJenjang;
    const matchSearch =
      !searchQuery.trim() ||
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nomorPeserta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ruang.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchSearch;
  });

  const filteredTeachers = teachers.filter((t) => {
    const matchJenjang =
      selectedJenjang === 'ALL' ? true : t.jenjangAmpu.includes(selectedJenjang);
    const matchSearch =
      !searchQuery.trim() ||
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mapelAmpu.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchSearch;
  });

  const openAddStudentModal = () => {
    setEditingStudent(null);
    setNama('');
    setNisn('');
    setJenjang(selectedJenjang === 'ALL' ? 'MTs' : selectedJenjang);
    setKelas('VIII-A');
    setRuang('Lab CBT 1');
    setSesi('Sesi 1 (Pagi)');
    setGender('L');
    setShowAddStudent(true);
  };

  const openEditStudentModal = (s: Student) => {
    setEditingStudent(s);
    setNama(s.nama);
    setNisn(s.nisn);
    setJenjang(s.jenjang);
    setKelas(s.kelas);
    setRuang(s.ruang);
    setSesi(s.sesi);
    setGender(s.gender);
    setShowAddStudent(true);
  };

  const handleCreateOrUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    if (editingStudent) {
      onSaveStudent({
        ...editingStudent,
        nama: nama.trim(),
        nisn: nisn.trim() || editingStudent.nisn,
        jenjang,
        kelas,
        ruang,
        sesi,
        gender,
      });
    } else {
      const seq = String(students.length + 1).padStart(3, '0');
      const randPin = String(Math.floor(100000 + Math.random() * 900000));
      const created: Student = {
        id: `std-${Date.now()}`,
        nomorPeserta: `26-${jenjang.toUpperCase()}-${seq}`,
        nisn: nisn.trim() || `0098412${seq}`,
        nama: nama.trim(),
        jenjang,
        kelas,
        ruang,
        sesi,
        pin: randPin,
        gender,
        statusAktif: true,
      };
      onSaveStudent(created);
    }
    setShowAddStudent(false);
    setEditingStudent(null);
  };

  const handleBulkImportStudents = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStudentText.trim()) return;
    const lines = bulkStudentText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const newList: Student[] = lines.map((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      const sNama = parts[0] || `Santri Import #${idx + 1}`;
      const rawJ = parts[1] || 'MTs';
      const sJenjang: Jenjang = (['MTs', 'MA', 'Wustho', 'Ulya'] as const).includes(
        rawJ as Jenjang
      )
        ? (rawJ as Jenjang)
        : 'MTs';
      const sKelas = parts[2] || 'VIII-A';
      const sRuang = parts[3] || 'Lab CBT 1';
      const sNisn = parts[4] || `0098765${String(idx + 10).padStart(3, '0')}`;
      const seq = String(students.length + idx + 1).padStart(3, '0');

      return {
        id: `std-imp-${Date.now()}-${idx}`,
        nomorPeserta: `26-${sJenjang.toUpperCase()}-${seq}`,
        nisn: sNisn,
        nama: sNama,
        jenjang: sJenjang,
        kelas: sKelas,
        ruang: sRuang,
        sesi: 'Sesi 1 (Pagi)',
        pin: String(Math.floor(100000 + Math.random() * 900000)),
        gender: 'L',
        statusAktif: true,
      };
    });

    if (onBulkSaveStudents) {
      onBulkSaveStudents(newList);
    } else {
      newList.forEach((s) => onSaveStudent(s));
    }
    setBulkStudentText('');
    setShowBulkStudentModal(false);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tNama.trim()) return;
    const created: Teacher = {
      id: `tch-${Date.now()}`,
      nip: tNip.trim() || `1989010120200110${teachers.length + 1}`,
      nama: tNama.trim(),
      gelar: tGelar.trim(),
      mapelAmpu: tMapel.trim() || 'Studi Keislaman & Kitab',
      jenjangAmpu: [tJenjang],
      peran: tPeran,
      noHp: '0812-8899-0011',
    };
    onSaveTeacher(created);
    setShowAddTeacher(false);
    setTNama('');
    setTMapel('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-elevated p-5 rounded-[24px] shadow-card border border-border-subtle/60">
        <div>
          <h1 className="text-xl font-extrabold text-text-main">
            Data Santri, Guru &amp; Administrasi Cetak Ujian
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Kelola peserta ujian lintas marhalah (MTs, Aliyah, Wustho, &apos;Ulya), cetak Kartu PIN
            Peserta, dan Daftar Hadir Ruang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('SANTRI')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'SANTRI'
                ? 'bg-[#211955] text-white'
                : 'bg-surface text-text-muted hover:text-text-main'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Santri ({filteredStudents.length})</span>
          </button>

          <button
            onClick={() => setSubTab('GURU')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'GURU'
                ? 'bg-[#211955] text-white'
                : 'bg-surface text-text-muted hover:text-text-main'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Dewan Guru/Asatidz ({filteredTeachers.length})</span>
          </button>

          <button
            onClick={() => setSubTab('KARTU')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'KARTU'
                ? 'bg-[#F8B478] text-[#1E1645]'
                : 'bg-surface text-text-muted hover:text-text-main'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cetak Kartu Peserta</span>
          </button>

          <button
            onClick={() => setSubTab('PRESENSI')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'PRESENSI'
                ? 'bg-[#14B894] text-white'
                : 'bg-surface text-text-muted hover:text-text-main'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daftar Hadir &amp; Berita Acara</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'MTs', 'MA', 'Wustho', 'Ulya'] as JenjangFilter[]).map((j) => (
            <button
              key={j}
              onClick={() => onSelectJenjang(j)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedJenjang === j
                  ? 'bg-[#211955] text-white'
                  : 'bg-elevated text-text-muted hover:text-text-main border border-border-subtle'
              }`}
            >
              {j === 'ALL' ? 'Semua Jenjang' : JENJANG_META[j].fullLabel}
            </button>
          ))}

          <div className="flex items-center gap-2 bg-elevated px-3 py-1.5 rounded-xl border border-border-subtle text-xs">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, nomor, kelas, ruang..."
              className="bg-transparent text-text-main focus:outline-none w-48"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subTab === 'SANTRI' && (
            <>
              {onRegenerateAllPins && (
                <button
                  onClick={onRegenerateAllPins}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#B85D19] text-xs font-extrabold transition"
                  title="Acak ulang seluruh PIN Sesi Peserta"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Acak Ulang PIN</span>
                </button>
              )}
              <button
                onClick={() => {
                  setBulkStudentText(
                    'Ahmad Baihaqi | MTs | VIII-A | Lab CBT 1 | 0098412090\nSiti Nadia Zahra | MA | XII MAK-1 | Lab CBT 2 | 0071928399\nM. Ulil Albab | Wustho | II Wustho A | Lab Turats 1 | 3120098450'
                  );
                  setShowBulkStudentModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-xs font-extrabold transition"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Import Kolektif</span>
              </button>
              <button
                onClick={openAddStudentModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] text-white text-xs font-extrabold"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Santri/Siswa</span>
              </button>
            </>
          )}
          {subTab === 'GURU' && (
            <button
              onClick={() => setShowAddTeacher(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] text-white text-xs font-extrabold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru/Pengawas</span>
            </button>
          )}
          {(subTab === 'KARTU' || subTab === 'PRESENSI') && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] text-white text-xs font-extrabold shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (A4 / PDF)</span>
            </button>
          )}
        </div>
      </div>

      {subTab === 'SANTRI' && (
        <StudentTableTab
          students={filteredStudents}
          onEditStudent={openEditStudentModal}
          onDeleteStudent={onDeleteStudent}
        />
      )}

      {subTab === 'GURU' && <TeacherGridTab teachers={filteredTeachers} />}

      {subTab === 'KARTU' && (
        <ExamCardPrintTab students={filteredStudents} settings={settings} />
      )}

      {subTab === 'PRESENSI' && (
        <AttendancePrintTab
          students={filteredStudents}
          settings={settings}
          selectedJenjang={selectedJenjang}
        />
      )}

      {showBulkStudentModal && (
        <BulkImportStudentModal
          bulkStudentText={bulkStudentText}
          onChangeText={setBulkStudentText}
          onSubmit={handleBulkImportStudents}
          onClose={() => setShowBulkStudentModal(false)}
        />
      )}

      {showAddStudent && (
        <StudentFormModal
          editingStudent={editingStudent}
          nama={nama}
          setNama={setNama}
          jenjang={jenjang}
          setJenjang={setJenjang}
          nisn={nisn}
          setNisn={setNisn}
          kelas={kelas}
          setKelas={setKelas}
          ruang={ruang}
          setRuang={setRuang}
          sesi={sesi}
          setSesi={setSesi}
          gender={gender}
          setGender={setGender}
          onSubmit={handleCreateOrUpdateStudent}
          onClose={() => setShowAddStudent(false)}
        />
      )}

      {showAddTeacher && (
        <TeacherFormModal
          tNama={tNama}
          setTNama={setTNama}
          tGelar={tGelar}
          setTGelar={setTGelar}
          tMapel={tMapel}
          setTMapel={setTMapel}
          tJenjang={tJenjang}
          setTJenjang={setTJenjang}
          tPeran={tPeran}
          setTPeran={setTPeran}
          onSubmit={handleCreateTeacher}
          onClose={() => setShowAddTeacher(false)}
        />
      )}
    </div>
  );
};
