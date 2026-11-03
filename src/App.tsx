import React, { useEffect, useState } from 'react';
import {
  ExamPacket,
  ExamSchedule,
  ExamSubmission,
  JenjangFilter,
  NavTab,
  SchoolSettings,
  Student,
  Teacher,
  UserRole,
} from './types/cbt';
import {
  INITIAL_PACKETS,
  INITIAL_SCHEDULES,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_TEACHERS,
} from './data/initialData';
import { FloatingSidebar } from './components/layout/FloatingSidebar';
import { TopHeaderBar } from './components/layout/TopHeaderBar';
import { AppFooter, GuideModal } from './components/layout/GuideModal';
import { DashboardView } from './components/DashboardView';
import { BankSoalView } from './components/BankSoalView';
import { JadwalLiveView } from './components/JadwalLiveView';
import { DataPesertaKartuView } from './components/DataPesertaKartuView';
import { RekapNilaiView } from './components/RekapNilaiView';
import { PengaturanView } from './components/PengaturanView';
import { StudentExamPortal } from './components/StudentExamPortal';

const STORAGE_KEYS = {
  PACKETS: 'jn_cbt_packets_v2',
  SCHEDULES: 'jn_cbt_schedules_v2',
  STUDENTS: 'jn_cbt_students_v2',
  TEACHERS: 'jn_cbt_teachers_v2',
  SUBMISSIONS: 'jn_cbt_submissions_v2',
  SETTINGS: 'jn_cbt_settings_v2',
  THEME: 'jn_cbt_theme_v2',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedJenjang, setSelectedJenjang] = useState<JenjangFilter>('ALL');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [studentSimPacketId, setStudentSimPacketId] = useState<string | undefined>(undefined);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.THEME, false)
  );

  // Persistent CBT State
  const [packets, setPackets] = useState<ExamPacket[]>(() =>
    loadFromStorage(STORAGE_KEYS.PACKETS, INITIAL_PACKETS)
  );
  const [schedules, setSchedules] = useState<ExamSchedule[]>(() =>
    loadFromStorage(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES)
  );
  const [students, setStudents] = useState<Student[]>(() =>
    loadFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS)
  );
  const [teachers, setTeachers] = useState<Teacher[]>(() =>
    loadFromStorage(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS)
  );
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() =>
    loadFromStorage(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS)
  );
  const [settings, setSettings] = useState<SchoolSettings[]>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, [INITIAL_SETTINGS])
  );

  const currentSettings = settings[0] || INITIAL_SETTINGS;

  // Sync to localStorage & theme attribute
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PACKETS, JSON.stringify(packets));
  }, [packets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handlers
  const handleSavePacket = (pkt: ExamPacket) => {
    setPackets((prev) => {
      const exists = prev.some((item) => item.id === pkt.id);
      return exists ? prev.map((item) => (item.id === pkt.id ? pkt : item)) : [pkt, ...prev];
    });
  };

  const handleDeletePacket = (packetId: string) => {
    setPackets((prev) => prev.filter((item) => item.id !== packetId));
  };

  const handleSaveSchedule = (sch: ExamSchedule) => {
    setSchedules((prev) => {
      const exists = prev.some((item) => item.id === sch.id);
      return exists ? prev.map((item) => (item.id === sch.id ? sch : item)) : [sch, ...prev];
    });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((item) => item.id !== scheduleId));
  };

  const handleRefreshToken = (scheduleId: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const nextToken = Array.from({ length: 6 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, token: nextToken } : s))
    );
  };

  const handleSaveStudent = (std: Student) => {
    setStudents((prev) => {
      const exists = prev.some((item) => item.id === std.id);
      return exists ? prev.map((item) => (item.id === std.id ? std : item)) : [std, ...prev];
    });
  };

  const handleBulkSaveStudents = (list: Student[]) => {
    setStudents((prev) => [...list, ...prev]);
  };

  const handleRegenerateAllPins = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        pin: String(Math.floor(100000 + Math.random() * 900000)),
      }))
    );
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveTeacher = (tch: Teacher) => {
    setTeachers((prev) => [tch, ...prev]);
  };

  const handleUpdateSubmission = (sub: ExamSubmission) => {
    setSubmissions((prev) => {
      const exists = prev.some((item) => item.id === sub.id);
      return exists ? prev.map((item) => (item.id === sub.id ? sub : item)) : [sub, ...prev];
    });
  };

  const handleOpenStudentSim = (packetId?: string) => {
    setStudentSimPacketId(packetId);
    setUserRole('siswa');
  };

  const handleResetDemoData = () => {
    setPackets(INITIAL_PACKETS);
    setSchedules(INITIAL_SCHEDULES);
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setSettings([INITIAL_SETTINGS]);
  };

  const handleImportFullBackup = (data: any) => {
    if (Array.isArray(data.packets)) setPackets(data.packets);
    if (Array.isArray(data.schedules)) setSchedules(data.schedules);
    if (Array.isArray(data.students)) setStudents(data.students);
    if (Array.isArray(data.teachers)) setTeachers(data.teachers);
    if (Array.isArray(data.submissions)) setSubmissions(data.submissions);
    if (data.settings) setSettings([data.settings]);
  };

  const handleExportFullBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'JN ExamCBTCore',
      settings: currentSettings,
      packets,
      schedules,
      students,
      teachers,
      submissions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_JN_ExamCBTCore_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="relative min-h-screen w-full p-2 sm:p-4 lg:p-6 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-outer-frame)' }}
    >
      {/* Decorative diagonal background accent matching reference image */}
      <div
        className="no-print pointer-events-none fixed bottom-4 right-7 text-3xl font-black tracking-tighter select-none opacity-85"
        style={{ color: darkMode ? '#8362ff' : '#211955' }}
        aria-hidden="true"
      >
        //
      </div>

      {/* Outer White Board Shell (matching the white frame of the reference image) */}
      <div
        className="relative z-10 max-w-[1440px] mx-auto min-h-[calc(100vh-3rem)] rounded-[34px] shadow-floating p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row items-stretch lg:items-start gap-4 lg:gap-5 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-board-shell)' }}
      >
        <FloatingSidebar
          activeTab={activeTab}
          userRole={userRole}
          onSelectTab={setActiveTab}
          onSetUserRole={setUserRole}
          onOpenStudentSim={() => handleOpenStudentSim()}
          onOpenGuide={() => setShowGuideModal(true)}
        />

        {/* Inner Content Surface Canvas (#F6F8FC in light mode) */}
        <div className="flex-1 min-w-0 rounded-[28px] bg-surface p-4 sm:p-6 lg:p-7 flex flex-col justify-between space-y-6">
          <TopHeaderBar
            packets={packets}
            students={students}
            selectedJenjang={selectedJenjang}
            onSelectJenjang={setSelectedJenjang}
            onNavigateTab={setActiveTab}
            userRole={userRole}
            onSetUserRole={setUserRole}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
          />

          {/* Active View Content */}
          <main className="flex-1">
            {userRole === 'siswa' ? (
              <StudentExamPortal
                packets={packets}
                schedules={schedules}
                students={students}
                initialPacketId={studentSimPacketId}
                onExitPortal={() => {
                  setUserRole('admin');
                  setActiveTab('rekap-nilai');
                }}
                onSubmitExamResult={handleUpdateSubmission}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    selectedJenjang={selectedJenjang}
                    onSelectJenjang={setSelectedJenjang}
                    onNavigate={setActiveTab}
                    onOpenStudentSim={handleOpenStudentSim}
                    packets={packets}
                    schedules={schedules}
                    students={students}
                    submissions={submissions}
                    onRefreshToken={handleRefreshToken}
                  />
                )}

                {activeTab === 'bank-soal' && (
                  <BankSoalView
                    packets={packets}
                    selectedJenjang={selectedJenjang}
                    onSelectJenjang={setSelectedJenjang}
                    onSavePacket={handleSavePacket}
                    onDeletePacket={handleDeletePacket}
                    onOpenStudentSim={handleOpenStudentSim}
                  />
                )}

                {activeTab === 'jadwal-live' && (
                  <JadwalLiveView
                    schedules={schedules}
                    packets={packets}
                    selectedJenjang={selectedJenjang}
                    onSelectJenjang={setSelectedJenjang}
                    onSaveSchedule={handleSaveSchedule}
                    onDeleteSchedule={handleDeleteSchedule}
                    onRefreshToken={handleRefreshToken}
                    onOpenStudentSim={handleOpenStudentSim}
                  />
                )}

                {activeTab === 'peserta-kartu' && (
                  <DataPesertaKartuView
                    students={students}
                    teachers={teachers}
                    settings={currentSettings}
                    selectedJenjang={selectedJenjang}
                    onSelectJenjang={setSelectedJenjang}
                    onSaveStudent={handleSaveStudent}
                    onBulkSaveStudents={handleBulkSaveStudents}
                    onRegenerateAllPins={handleRegenerateAllPins}
                    onDeleteStudent={handleDeleteStudent}
                    onSaveTeacher={handleSaveTeacher}
                  />
                )}

                {activeTab === 'rekap-nilai' && (
                  <RekapNilaiView
                    submissions={submissions}
                    settings={currentSettings}
                    selectedJenjang={selectedJenjang}
                    onSelectJenjang={setSelectedJenjang}
                    onUpdateSubmission={handleUpdateSubmission}
                  />
                )}

                {activeTab === 'pengaturan' && (
                  <PengaturanView
                    settings={currentSettings}
                    onSaveSettings={(next) => setSettings([next])}
                    onResetDemoData={handleResetDemoData}
                    onExportFullBackup={handleExportFullBackup}
                    onImportFullBackup={handleImportFullBackup}
                  />
                )}
              </>
            )}
          </main>

          <AppFooter settings={currentSettings} />
        </div>
      </div>

      <GuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
}

export default App;
