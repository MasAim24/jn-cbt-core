import React, { useState } from 'react';
import {
  CreditCard,
  FileDown,
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
  JurusanMA,
  NavTab,
  SchoolSettings,
  Student,
  Teacher,
  TeacherPeran,
} from '../types/cbt';
import { JENJANG_META } from '../data/initialData';
import { StudentTableTab, TeacherGridTab } from './peserta/StudentTableTab';
import {
  AttendancePrintTab,
  ExamCardPrintTab,
} from './peserta/ExamCardPrintTab';
import {
  BulkImportStudentModal,
  BulkImportTeacherModal,
  ROLE_DEFAULT_TABS,
  StudentFormModal,
  TeacherFormModal,
} from './peserta/PesertaModals';
import { parseBulkTeacherText } from '../utils/excelTemplateHelper';
import { OfficialPdfModal } from './common/OfficialPdfModal';
import { AuthenticatedSession } from './auth/LoginPortalView';

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
  onBulkSaveTeachers?: (list: Teacher[]) => void;
  onDeleteTeacher?: (id: string) => void;
  onSaveSettings?: (next: SchoolSettings) => void;
  authSession?: AuthenticatedSession | null;
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
  onBulkSaveTeachers,
  onDeleteTeacher,
  onSaveSettings,
  authSession,
}) => {
  const [subTab, setSubTab] = useState<'SANTRI' | 'GURU' | 'KARTU' | 'PRESENSI'>('SANTRI');
  const [scopeToKelasBinaan, setScopeToKelasBinaan] = useState(true);
  const canManageTeacherAccounts =
    !authSession ||
    authSession.role === 'admin' ||
    authSession.peran === 'Kepala Madrasah / Mudir' ||
    authSession.peran === 'Koordinator Kurikulum';
  const [searchQuery, setSearchQuery] = useState('');
  const [maFilter, setMaFilter] = useState<'ALL' | 'XI' | 'XII' | 'MIPA' | 'IPS' | 'UNSET'>(
    'ALL'
  );
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showBulkTeacherModal, setShowBulkTeacherModal] = useState(false);
  const [bulkTeacherText, setBulkTeacherText] = useState('');
  const [pdfDocType, setPdfDocType] = useState<'KARTU_PESERTA' | 'PRESENSI_BERITA_ACARA' | null>(
    null
  );

  // Student form state
  const [nama, setNama] = useState('');
  const [nomorPeserta, setNomorPeserta] = useState('');
  const [pin, setPin] = useState('');
  const [nisn, setNisn] = useState('');
  const [jenjang, setJenjang] = useState<Jenjang>('MTs');
  const [kelas, setKelas] = useState('VIII-A');
  const [ruang, setRuang] = useState('Lab CBT 1');
  const [sesi, setSesi] = useState<'Sesi 1 (Pagi)' | 'Sesi 2 (Siang)'>('Sesi 1 (Pagi)');
  const [gender, setGender] = useState<'L' | 'P'>('L');

  // Teacher / Staff Account form state
  const [tNama, setTNama] = useState('');
  const [tGelar, setTGelar] = useState('');
  const [tNip, setTNip] = useState('');
  const [tUsername, setTUsername] = useState('');
  const [tPassword, setTPassword] = useState('guru123');
  const [tNoHp, setTNoHp] = useState('');
  const [tMapel, setTMapel] = useState('');
  const [tKelasBinaan, setTKelasBinaan] = useState('');
  const [tJenjangList, setTJenjangList] = useState<Jenjang[]>(['MTs']);
  const [tPeran, setTPeran] = useState<TeacherPeran>('Guru Mapel');
  const [tHakAkses, setTHakAkses] = useState<NavTab[]>(ROLE_DEFAULT_TABS['Guru Mapel']);
  const [syncToSchoolSettings, setSyncToSchoolSettings] = useState(true);

  const filteredStudents = students.filter((s) => {
    const matchJenjang = selectedJenjang === 'ALL' ? true : s.jenjang === selectedJenjang;
    const matchWaliKelas =
      authSession?.peran === 'Wali Kelas' &&
      authSession.kelasBinaan &&
      scopeToKelasBinaan
        ? s.kelas.toLowerCase().includes(authSession.kelasBinaan.toLowerCase())
        : true;
    const resolvedJurusan: JurusanMA =
      s.jurusan ||
      (s.kelas.toUpperCase().includes('MIPA') || s.kelas.toUpperCase().includes('IPA')
        ? 'MIPA'
        : s.kelas.toUpperCase().includes('IPS')
        ? 'IPS'
        : '');
    const upperKelas = s.kelas.toUpperCase();
    const isKelasXII = /\bXII\b/.test(upperKelas);
    const isKelasXI = /\bXI\b/.test(upperKelas) && !isKelasXII;

    const matchMaFilter =
      maFilter === 'ALL' || s.jenjang !== 'MA'
        ? true
        : maFilter === 'XI'
        ? isKelasXI
        : maFilter === 'XII'
        ? isKelasXII
        : maFilter === 'MIPA'
        ? resolvedJurusan === 'MIPA'
        : maFilter === 'IPS'
        ? resolvedJurusan === 'IPS'
        : resolvedJurusan === '';

    const matchSearch =
      !searchQuery.trim() ||
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nomorPeserta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.tempatLahir || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ruang.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchWaliKelas && matchMaFilter && matchSearch;
  });

  const filteredTeachers = teachers.filter((t) => {
    const matchJenjang =
      selectedJenjang === 'ALL' ? true : t.jenjangAmpu.includes(selectedJenjang);
    const matchSearch =
      !searchQuery.trim() ||
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mapelAmpu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.peran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.kelasBinaan || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchSearch;
  });

  const openAddStudentModal = () => {
    setEditingStudent(null);
    setNama('');
    setNomorPeserta('');
    setPin('');
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
    setNomorPeserta(s.nomorPeserta);
    setPin(s.pin);
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
    const derivedJurusan: JurusanMA | undefined =
      jenjang === 'MA'
        ? kelas.toUpperCase().includes('MIPA') || kelas.toUpperCase().includes('IPA')
          ? 'MIPA'
          : kelas.toUpperCase().includes('IPS')
          ? 'IPS'
          : ''
        : undefined;
    if (editingStudent) {
      onSaveStudent({
        ...editingStudent,
        nama: nama.trim(),
        nomorPeserta: nomorPeserta.trim() || editingStudent.nomorPeserta,
        pin: pin.trim() || editingStudent.pin,
        nisn: nisn.trim() || editingStudent.nisn,
        jenjang,
        kelas,
        jurusan: derivedJurusan,
        ruang,
        sesi,
        gender,
      });
    } else {
      const seq = String(students.length + 1).padStart(3, '0');
      const randPin = pin.trim() || String(Math.floor(100000 + Math.random() * 900000));
      const created: Student = {
        id: `std-${Date.now()}`,
        nomorPeserta: nomorPeserta.trim() || `26-${jenjang.toUpperCase()}-${seq}`,
        nisn: nisn.trim() || `0098412${seq}`,
        nama: nama.trim(),
        jenjang,
        kelas,
        jurusan: derivedJurusan,
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
      const sNama = parts[0] || `Santri #${idx + 1}`;
      const rawJ = parts[1] || (selectedJenjang === 'ALL' ? 'MTs' : selectedJenjang);
      const sJenjang: Jenjang = (['MTs', 'MA', 'Wustho', 'Ulya'] as const).includes(
        rawJ as Jenjang
      )
        ? (rawJ as Jenjang)
        : 'MTs';
      const sKelas = parts[2] || 'VIII-A';
      const sRuang = parts[3] || 'Lab CBT 1';
      const sNisn = parts[4] || `0098765${String(students.length + idx + 1).padStart(3, '0')}`;
      const rawGender = (parts[5] || 'L').toUpperCase();
      const sGender: 'L' | 'P' = rawGender === 'P' ? 'P' : 'L';
      const rawSesi = parts[6] || 'Sesi 1 (Pagi)';
      const sSesi: 'Sesi 1 (Pagi)' | 'Sesi 2 (Siang)' = rawSesi
        .toLowerCase()
        .includes('siang')
        ? 'Sesi 2 (Siang)'
        : 'Sesi 1 (Pagi)';
      const seq = String(students.length + idx + 1).padStart(3, '0');

      return {
        id: `std-imp-${Date.now()}-${idx}`,
        nomorPeserta: `26-${sJenjang.toUpperCase()}-${seq}`,
        nisn: sNisn,
        nama: sNama,
        jenjang: sJenjang,
        kelas: sKelas,
        ruang: sRuang,
        sesi: sSesi,
        pin: String(Math.floor(100000 + Math.random() * 900000)),
        gender: sGender,
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

  const openAddTeacherModal = (presetRole?: TeacherPeran) => {
    const role = presetRole || 'Guru Mapel';
    const defaultJenjang: Jenjang = selectedJenjang === 'ALL' ? 'MTs' : selectedJenjang;
    setEditingTeacher(null);
    setTNama('');
    setTGelar('');
    setTNip('');
    setTUsername('');
    setTPassword('guru123');
    setTNoHp('');
    setTMapel(
      role === 'Kepala Madrasah / Mudir'
        ? `Kepala ${JENJANG_META[defaultJenjang].fullLabel}`
        : role === 'Wali Kelas'
        ? 'Wali Kelas / Pembina Rombel'
        : ''
    );
    setTKelasBinaan(role === 'Wali Kelas' ? 'VIII-A' : '');
    setTJenjangList([defaultJenjang]);
    setTPeran(role);
    setTHakAkses(ROLE_DEFAULT_TABS[role]);
    setSyncToSchoolSettings(true);
    setShowAddTeacher(true);
  };

  const openEditTeacherModal = (t: Teacher) => {
    setEditingTeacher(t);
    setTNama(t.nama);
    setTGelar(t.gelar);
    setTNip(t.nip);
    setTUsername(t.username || t.nip);
    setTPassword(t.password || 'guru123');
    setTNoHp(t.noHp);
    setTMapel(t.mapelAmpu);
    setTKelasBinaan(t.kelasBinaan || '');
    setTJenjangList(t.jenjangAmpu.length > 0 ? t.jenjangAmpu : ['MTs']);
    setTPeran(t.peran);
    setTHakAkses(
      t.hakAkses && t.hakAkses.length > 0 ? t.hakAkses : ROLE_DEFAULT_TABS[t.peran]
    );
    setSyncToSchoolSettings(false);
    setShowAddTeacher(true);
  };

  const handleCreateOrUpdateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tNama.trim()) return;

    const cleanNip = tNip.trim() || `1989010120200110${teachers.length + 1}`;
    const cleanUsername =
      tUsername.trim() ||
      tNama
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 12) ||
      cleanNip;

    const savedTeacher: Teacher = {
      id: editingTeacher ? editingTeacher.id : `tch-${Date.now()}`,
      nip: cleanNip,
      username: cleanUsername,
      password: tPassword.trim() || 'guru123',
      nama: tNama.trim(),
      gelar: tGelar.trim(),
      mapelAmpu:
        tMapel.trim() ||
        (tPeran === 'Guru Mapel' ? 'Fleksibel (Sesuai Paket Soal)' : tPeran),
      kelasBinaan: tKelasBinaan.trim() || undefined,
      jenjangAmpu: tJenjangList.length > 0 ? tJenjangList : ['MTs'],
      peran: tPeran,
      hakAkses: tHakAkses.length > 0 ? tHakAkses : ROLE_DEFAULT_TABS[tPeran],
      noHp: tNoHp.trim() || '-',
      statusAktif: true,
    };

    onSaveTeacher(savedTeacher);

    // Sync Kepala Madrasah / Mudir into SchoolSettings if requested
    if (
      tPeran === 'Kepala Madrasah / Mudir' &&
      syncToSchoolSettings &&
      onSaveSettings
    ) {
      const fullTitleName = savedTeacher.gelar
        ? `${savedTeacher.nama}, ${savedTeacher.gelar}`
        : savedTeacher.nama;
      const nextSettings: SchoolSettings = { ...settings };
      if (savedTeacher.jenjangAmpu.includes('MTs')) {
        nextSettings.kepalaMTs = fullTitleName;
      }
      if (savedTeacher.jenjangAmpu.includes('MA')) {
        nextSettings.kepalaMA = fullTitleName;
      }
      if (savedTeacher.jenjangAmpu.includes('Wustho')) {
        nextSettings.mudirWustho = fullTitleName;
      }
      if (savedTeacher.jenjangAmpu.includes('Ulya')) {
        nextSettings.mudirUlya = fullTitleName;
      }
      onSaveSettings(nextSettings);
    }

    setShowAddTeacher(false);
    setEditingTeacher(null);
  };

  const handleBulkImportTeachers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTeacherText.trim()) return;
    const defaultJenjang: Jenjang = selectedJenjang === 'ALL' ? 'MTs' : selectedJenjang;
    const importedList = parseBulkTeacherText(
      bulkTeacherText,
      defaultJenjang,
      teachers.length
    );
    if (importedList.length === 0) return;

    if (onBulkSaveTeachers) {
      onBulkSaveTeachers(importedList);
    } else {
      importedList.forEach((t) => onSaveTeacher(t));
    }
    setBulkTeacherText('');
    setShowBulkTeacherModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-elevated p-5 rounded-[24px] shadow-card border border-border-subtle/60">
        <div>
          <h1 className="text-xl font-extrabold text-text-main">
            Database Santri Real, Akun Pejabat/Guru &amp; Cetak Kartu CBT
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Input database santri real di lapangan serta kelola akun Kepala Madrasah/Diniyah, Wali
            Kelas, dan Guru Mapel beserta hak akses loginnya.
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
            <span>Database Santri Real ({filteredStudents.length})</span>
          </button>

          {canManageTeacherAccounts && (
            <button
              onClick={() => setSubTab('GURU')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                subTab === 'GURU'
                  ? 'bg-[#211955] text-white'
                  : 'bg-surface text-text-muted hover:text-text-main'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Akun Pejabat, Wali Kelas &amp; Guru ({filteredTeachers.length})</span>
            </button>
          )}

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

      {authSession?.peran === 'Wali Kelas' && authSession.kelasBinaan && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 text-xs">
          <div>
            <span className="font-extrabold text-[#087963]">
              Filter Otomatis Wali Kelas ({authSession.kelasBinaan}):
            </span>{' '}
            <span className="text-text-main">
              Menampilkan daftar santri, kartu ujian, dan presensi khusus kelas binaan Anda.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScopeToKelasBinaan((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-elevated border border-border-subtle font-extrabold text-[#087963] hover:bg-surface transition"
          >
            {scopeToKelasBinaan
              ? 'Tampilkan Semua Kelas'
              : `Fokus Kelas ${authSession.kelasBinaan}`}
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {authSession?.role === 'guru' &&
          (authSession.allowedJenjangs?.length === 1 ||
            (!authSession.allowedJenjangs && authSession.jenjang)) ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-[#211955] text-white text-xs font-extrabold">
              Unit Tugas:{' '}
              {
                JENJANG_META[authSession.allowedJenjangs?.[0] || authSession.jenjang || 'MTs']
                  .fullLabel
              }
            </span>
          ) : (
            (authSession?.role === 'guru' && authSession.allowedJenjangs?.length
              ? (authSession.allowedJenjangs as JenjangFilter[])
              : (['ALL', 'MTs', 'MA', 'Wustho', 'Ulya'] as JenjangFilter[])
            ).map((j) => (
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
            ))
          )}

          <div className="flex items-center gap-2 bg-elevated px-3 py-1.5 rounded-xl border border-border-subtle text-xs">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NISN, kelas, tempat lahir..."
              className="bg-transparent text-text-main focus:outline-none w-52"
            />
          </div>

          {subTab !== 'GURU' && (selectedJenjang === 'ALL' || selectedJenjang === 'MA') && (
            <select
              value={maFilter}
              onChange={(e) => setMaFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-elevated border border-border-subtle text-xs font-extrabold text-text-main focus:outline-none"
              title="Filter Kelas & Jurusan Peminatan MA (XI / XII / MIPA / IPS)"
            >
              <option value="ALL">Filter MA: Semua Kelas &amp; Jurusan</option>
              <option value="XI">Khusus Kelas XI MA (63 Santri)</option>
              <option value="XII">Khusus Kelas XII MA (84 Santri)</option>
              <option value="MIPA">Jurusan MIPA (Sains / IPA)</option>
              <option value="IPS">Jurusan IPS (Sosial)</option>
              <option value="UNSET">Belum Pilih Jurusan (MIPA/IPS)</option>
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subTab === 'SANTRI' && (
            <>
              <button
                onClick={() => setPdfDocType('KARTU_PESERTA')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#211955] text-xs font-extrabold transition"
                title="Output PDF Murni Kartu Peserta"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF Kartu ({filteredStudents.length})</span>
              </button>
              {onRegenerateAllPins && students.length > 0 && (
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
                  setBulkStudentText('');
                  setShowBulkStudentModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-xs font-extrabold transition"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Import CSV / Kolektif</span>
              </button>
              <button
                onClick={openAddStudentModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] text-white text-xs font-extrabold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Input Santri Baru</span>
              </button>
            </>
          )}
          {subTab === 'GURU' && (
            <>
              <button
                onClick={() => {
                  setBulkTeacherText('');
                  setShowBulkTeacherModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-xs font-extrabold transition"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Import Excel / Masal Guru</span>
              </button>
              <button
                onClick={() => openAddTeacherModal('Guru Mapel')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] text-white text-xs font-extrabold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Pejabat / Guru</span>
              </button>
            </>
          )}
          {(subTab === 'KARTU' || subTab === 'PRESENSI') && (
            <button
              onClick={() =>
                setPdfDocType(subTab === 'KARTU' ? 'KARTU_PESERTA' : 'PRESENSI_BERITA_ACARA')
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-extrabold shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Output PDF Murni &amp; Cetak A4</span>
            </button>
          )}
        </div>
      </div>

      {subTab === 'SANTRI' && (
        <StudentTableTab
          students={filteredStudents}
          onEditStudent={openEditStudentModal}
          onQuickUpdateStudent={onSaveStudent}
          onDeleteStudent={onDeleteStudent}
          onAddFirstStudent={openAddStudentModal}
          onOpenBulkImport={() => {
            setBulkStudentText('');
            setShowBulkStudentModal(true);
          }}
        />
      )}

      {subTab === 'GURU' && (
        <TeacherGridTab
          teachers={filteredTeachers}
          settings={settings}
          onEditTeacher={openEditTeacherModal}
          onDeleteTeacher={onDeleteTeacher}
          onQuickAddRole={(role) => openAddTeacherModal(role)}
          onOpenBulkImportTeachers={() => {
            setBulkTeacherText('');
            setShowBulkTeacherModal(true);
          }}
        />
      )}

      {subTab === 'KARTU' && (
        <ExamCardPrintTab
          students={filteredStudents}
          settings={settings}
          onOpenPdfKartu={() => setPdfDocType('KARTU_PESERTA')}
        />
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

      {showBulkTeacherModal && (
        <BulkImportTeacherModal
          bulkTeacherText={bulkTeacherText}
          defaultJenjang={selectedJenjang === 'ALL' ? 'MTs' : selectedJenjang}
          existingCount={teachers.length}
          onChangeText={setBulkTeacherText}
          onSubmit={handleBulkImportTeachers}
          onClose={() => setShowBulkTeacherModal(false)}
        />
      )}

      {showAddStudent && (
        <StudentFormModal
          editingStudent={editingStudent}
          nama={nama}
          setNama={setNama}
          nomorPeserta={nomorPeserta}
          setNomorPeserta={setNomorPeserta}
          pin={pin}
          setPin={setPin}
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
          editingTeacher={editingTeacher}
          tNama={tNama}
          setTNama={setTNama}
          tGelar={tGelar}
          setTGelar={setTGelar}
          tNip={tNip}
          setTNip={setTNip}
          tUsername={tUsername}
          setTUsername={setTUsername}
          tPassword={tPassword}
          setTPassword={setTPassword}
          tNoHp={tNoHp}
          setTNoHp={setTNoHp}
          tMapel={tMapel}
          setTMapel={setTMapel}
          tKelasBinaan={tKelasBinaan}
          setTKelasBinaan={setTKelasBinaan}
          tJenjangList={tJenjangList}
          setTJenjangList={setTJenjangList}
          tPeran={tPeran}
          setTPeran={setTPeran}
          tHakAkses={tHakAkses}
          setTHakAkses={setTHakAkses}
          syncToSchoolSettings={syncToSchoolSettings}
          setSyncToSchoolSettings={setSyncToSchoolSettings}
          onSubmit={handleCreateOrUpdateTeacher}
          onClose={() => setShowAddTeacher(false)}
        />
      )}

      {pdfDocType && (
        <OfficialPdfModal
          isOpen={Boolean(pdfDocType)}
          onClose={() => setPdfDocType(null)}
          docType={pdfDocType}
          settings={settings}
          selectedJenjang={selectedJenjang}
          students={filteredStudents}
        />
      )}
    </div>
  );
};
