import React, { useEffect, useRef, useState } from 'react';
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
import {
  AuthenticatedSession,
  LoginPortalView,
} from './components/auth/LoginPortalView';
import { subscribeLiveSyncEvents } from './utils/liveProctorSync';
import {
  isLocalSqliteHost,
  loadStateFromSqlite,
  saveStateToSqlite,
} from './utils/sqliteApiClient';
import {
  getSupabaseConfig,
  loadStateFromSupabase,
  saveMasterStateToSupabase,
} from './utils/supabaseCloudClient';

const STORAGE_KEYS = {
  PACKETS: 'jn_cbt_packets_v3',
  SCHEDULES: 'jn_cbt_schedules_v3',
  STUDENTS: 'jn_cbt_students_v3',
  TEACHERS: 'jn_cbt_teachers_v3',
  SUBMISSIONS: 'jn_cbt_submissions_v3',
  SETTINGS: 'jn_cbt_settings_v3',
  THEME: 'jn_cbt_theme_v3',
  AUTH_SESSION: 'jn_cbt_auth_session_v4',
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

function normalizeSchoolSettings(raw?: SchoolSettings): SchoolSettings {
  const base = raw || INITIAL_SETTINGS;
  const isLegacyYayasan =
    !base.namaYayasan ||
    base.namaYayasan === 'Yayasan Pendidikan Islam & Pondok Pesantren Jabal Nur';
  const isLegacyKota = !base.kota || base.kota.includes('Sidoarjo');
  const isLegacyAlamat = !base.alamat || base.alamat.includes('Pesantren Jabal Nur No.');

  const envSupa = getSupabaseConfig();
  const nextUrl = base.supabaseUrl || envSupa?.url || INITIAL_SETTINGS.supabaseUrl || '';
  const nextKey =
    base.supabaseAnonKey || envSupa?.anonKey || INITIAL_SETTINGS.supabaseAnonKey || '';

  return {
    ...INITIAL_SETTINGS,
    ...base,
    namaYayasan: isLegacyYayasan ? INITIAL_SETTINGS.namaYayasan : base.namaYayasan,
    alamat: isLegacyAlamat ? INITIAL_SETTINGS.alamat : base.alamat,
    kota: isLegacyKota ? INITIAL_SETTINGS.kota : base.kota,
    supabaseUrl: nextUrl,
    supabaseAnonKey: nextKey,
    syncMode: nextUrl && nextKey ? 'SUPABASE_HYBRID' : base.syncMode || 'LOCAL_STORAGE',
  };
}

export function App() {
  const [authSession, setAuthSession] = useState<AuthenticatedSession | null>(() => {
    try {
      localStorage.removeItem('jn_cbt_auth_session_v3');
    } catch {
      // ignore
    }
    return loadFromStorage<AuthenticatedSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
  });
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedJenjang, setSelectedJenjang] = useState<JenjangFilter>('ALL');
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = loadFromStorage<AuthenticatedSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
    return saved?.role || 'admin';
  });
  const [studentSimPacketId, setStudentSimPacketId] = useState<string | undefined>(() => {
    const saved = loadFromStorage<AuthenticatedSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
    return saved?.packetId;
  });
  const [studentSimStudentId, setStudentSimStudentId] = useState<string | undefined>(() => {
    const saved = loadFromStorage<AuthenticatedSession | null>(STORAGE_KEYS.AUTH_SESSION, null);
    return saved?.studentId;
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.THEME, false)
  );
  const sqliteReadyRef = useRef(false);

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
  const [settings, setSettings] = useState<SchoolSettings[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.SETTINGS, [INITIAL_SETTINGS]);
    return [normalizeSchoolSettings(loaded[0])];
  });

  const currentSettings = settings[0] || INITIAL_SETTINGS;

  // Purge any legacy dummy records if kept alive in HMR memory or localStorage
  useEffect(() => {
    const legacyDummyPackets = new Set([
      'pkt-mts-01',
      'pkt-ma-01',
      'pkt-wustho-01',
      'pkt-ulya-01',
    ]);
    const legacyDummySchedules = new Set(['sch-01', 'sch-02', 'sch-03', 'sch-04']);
    const legacyDummyStudents = new Set([
      'std-mts-1',
      'std-mts-2',
      'std-mts-3',
      'std-ma-1',
      'std-ma-2',
      'std-wst-1',
      'std-wst-2',
      'std-uly-1',
      'std-uly-2',
      'std-imp-1793664205470-0',
      'std-imp-1793664205470-1',
      'std-imp-1793664205470-2',
    ]);
    const legacyDummyTeachers = new Set(['tch-1', 'tch-2', 'tch-3', 'tch-4']);
    const legacyDummySubs = new Set(['sub-01', 'sub-02', 'sub-03', 'sub-04']);

    setPackets((prev) =>
      prev.some((p) => legacyDummyPackets.has(p.id))
        ? prev.filter((p) => !legacyDummyPackets.has(p.id))
        : prev
    );
    setStudents((prev) =>
      prev.some((s) => legacyDummyStudents.has(s.id))
        ? prev.filter((s) => !legacyDummyStudents.has(s.id))
        : prev
    );
    setTeachers((prev) =>
      prev.some((t) => legacyDummyTeachers.has(t.id))
        ? prev.filter((t) => !legacyDummyTeachers.has(t.id))
        : prev
    );
    setSubmissions((prev) =>
      prev.some((sub) => legacyDummySubs.has(sub.id))
        ? prev.filter((sub) => !legacyDummySubs.has(sub.id))
        : prev
    );
    setSchedules((prev) =>
      prev
        .filter((sch) => !legacyDummySchedules.has(sch.id))
        .map((sch) => ({
          ...sch,
          liveParticipants: sch.liveParticipants.filter(
            (lp) => !legacyDummyStudents.has(lp.studentId)
          ),
        }))
    );
  }, []);

  // Hydrate or Seed Central Database (Supabase Cloud Primary -> Local SQLite Fallback) on mount
  useEffect(() => {
    let mounted = true;

    const initDatabases = async () => {
      const supaCfg = getSupabaseConfig(currentSettings);
      if (supaCfg) {
        const cloudLoaded = await loadStateFromSupabase(supaCfg);
        if (mounted && cloudLoaded) {
          if (cloudLoaded.empty) {
            await saveMasterStateToSupabase(
              {
                settings: currentSettings,
                packets,
                schedules,
                students,
                teachers,
                submissions,
              },
              supaCfg
            );
          } else {
            if (cloudLoaded.settings) {
              const normalizedCloudSettings = normalizeSchoolSettings(cloudLoaded.settings);
              setSettings([normalizedCloudSettings]);
            }
            if (Array.isArray(cloudLoaded.packets)) {
              setPackets(cloudLoaded.packets);
            }
            if (Array.isArray(cloudLoaded.schedules)) {
              setSchedules(cloudLoaded.schedules);
            }
            if (Array.isArray(cloudLoaded.students)) setStudents(cloudLoaded.students);
            if (Array.isArray(cloudLoaded.teachers)) setTeachers(cloudLoaded.teachers);
            if (Array.isArray(cloudLoaded.submissions)) setSubmissions(cloudLoaded.submissions);
          }
          setTimeout(() => {
            sqliteReadyRef.current = true;
          }, 120);
          return;
        }
      }

      if (!isLocalSqliteHost()) {
        sqliteReadyRef.current = true;
        return;
      }

      const loaded = await loadStateFromSqlite();
      if (!mounted || !loaded) {
        sqliteReadyRef.current = true;
        return;
      }
      if (loaded.empty) {
        await saveStateToSqlite({
          settings: currentSettings,
          packets,
          schedules,
          students,
          teachers,
          submissions,
        });
        sqliteReadyRef.current = true;
      } else {
        if (loaded.settings) {
          setSettings([normalizeSchoolSettings(loaded.settings)]);
        }
        if (Array.isArray(loaded.packets)) {
          setPackets(loaded.packets);
        }
        if (Array.isArray(loaded.schedules)) {
          setSchedules(loaded.schedules);
        }
        if (Array.isArray(loaded.students)) setStudents(loaded.students);
        if (Array.isArray(loaded.teachers)) setTeachers(loaded.teachers);
        if (Array.isArray(loaded.submissions)) setSubmissions(loaded.submissions);
        setTimeout(() => {
          sqliteReadyRef.current = true;
        }, 120);
      }
    };

    initDatabases();
    return () => {
      mounted = false;
    };
  }, []);

  // Periodic background cloud refresh for Login Portal & Proctor/Rekap views
  useEffect(() => {
    const supaCfg = getSupabaseConfig(currentSettings);
    if (!supaCfg || authSession?.role === 'siswa') return;

    const interval = setInterval(async () => {
      const cloudLoaded = await loadStateFromSupabase(supaCfg);
      if (!cloudLoaded || cloudLoaded.empty) return;
      if (!authSession) {
        // On Login screen, keep student/teacher roster & schedules fresh
        if (Array.isArray(cloudLoaded.students)) setStudents(cloudLoaded.students);
        if (Array.isArray(cloudLoaded.teachers)) setTeachers(cloudLoaded.teachers);
        if (Array.isArray(cloudLoaded.schedules)) {
          setSchedules(cloudLoaded.schedules);
        }
        if (Array.isArray(cloudLoaded.packets)) {
          setPackets(cloudLoaded.packets);
        }
      } else {
        // For logged-in Admin/Guru, merge incoming student submissions & live participant status
        if (Array.isArray(cloudLoaded.submissions)) {
          setSubmissions((prev) => {
            const byId = new Map(prev.map((s) => [s.id, s]));
            cloudLoaded.submissions.forEach((s) => byId.set(s.id, s));
            return Array.from(byId.values());
          });
        }
        if (Array.isArray(cloudLoaded.schedules) && cloudLoaded.schedules.length > 0) {
          setSchedules((prev) =>
            prev.map((sch) => {
              const match = cloudLoaded.schedules.find((cs) => cs.id === sch.id);
              return match
                ? {
                    ...sch,
                    liveParticipants: match.liveParticipants,
                    hadirCount: match.hadirCount,
                    selesaiCount: match.selesaiCount,
                  }
                : sch;
            })
          );
        }
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [currentSettings, authSession]);

  // Auto-sync state changes to Cloud Supabase & Local SQLite Server Database (debounced 400ms, Admin & Guru only;
  // Student devices push atomic STUDENT_PROGRESS and STUDENT_SUBMITTED events)
  useEffect(() => {
    if (!sqliteReadyRef.current || authSession?.role === 'siswa') return;
    const timer = setTimeout(() => {
      const payload = {
        settings: currentSettings,
        packets,
        schedules,
        students,
        teachers,
        submissions,
      };
      if (getSupabaseConfig(currentSettings)) {
        saveMasterStateToSupabase(payload);
      }
      if (isLocalSqliteHost()) {
        saveStateToSqlite(payload);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [packets, schedules, students, teachers, submissions, currentSettings, authSession?.role]);

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
    if (authSession) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(authSession));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  }, [authSession]);

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

  // Auto-open Student Exam Portal if launched via "?sim_student=1&packetId=..." dual-tab button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sim_student') === '1') {
      const targetPktId = params.get('packetId') || packets[0]?.id;
      if (!authSession) {
        setAuthSession({
          role: 'siswa',
          id: 'std-dual-tab',
          name: 'Santri Simulasi Dual-Tab',
          badgeRole: 'Peserta Ujian CBT (Live Sync)',
          avatarInitials: 'SS',
          packetId: targetPktId,
        });
      }
      setStudentSimPacketId(targetPktId);
      setUserRole('siswa');
    }
  }, []);

  // Real-time Cross-Tab BroadcastChannel & Storage Synchronization
  useEffect(() => {
    const unsubscribeSync = subscribeLiveSyncEvents((msg) => {
      if (msg.type === 'STUDENT_PROGRESS' || msg.type === 'STUDENT_SUBMITTED') {
        setSchedules((prev) =>
          prev.map((sch) => {
            if (sch.id !== msg.scheduleId && sch.packetId !== msg.packetId) {
              return sch;
            }
            const exists = sch.liveParticipants.some(
              (p) =>
                p.studentId === msg.participant.studentId ||
                p.nomorPeserta === msg.participant.nomorPeserta
            );
            const updatedList = exists
              ? sch.liveParticipants.map((p) =>
                  p.studentId === msg.participant.studentId ||
                  p.nomorPeserta === msg.participant.nomorPeserta
                    ? msg.participant
                    : p
                )
              : [msg.participant, ...sch.liveParticipants];
            const selesaiCount = updatedList.filter((p) => p.status === 'SELESAI').length;
            return {
              ...sch,
              selesaiCount: Math.max(sch.selesaiCount, selesaiCount),
              liveParticipants: updatedList,
            };
          })
        );
      }

      if (msg.type === 'STUDENT_SUBMITTED') {
        setSubmissions((prev) => {
          const exists = prev.some((s) => s.id === msg.submission.id);
          return exists ? prev : [msg.submission, ...prev];
        });
      }
    });

    const handleCrossTabStorage = (ev: StorageEvent) => {
      if (!ev.newValue) return;
      try {
        if (ev.key === STORAGE_KEYS.PACKETS) {
          setPackets(JSON.parse(ev.newValue));
        } else if (ev.key === STORAGE_KEYS.SCHEDULES) {
          setSchedules(JSON.parse(ev.newValue));
        } else if (ev.key === STORAGE_KEYS.SUBMISSIONS) {
          setSubmissions(JSON.parse(ev.newValue));
        }
      } catch {
        // Ignore parse error
      }
    };

    window.addEventListener('storage', handleCrossTabStorage);
    return () => {
      unsubscribeSync();
      window.removeEventListener('storage', handleCrossTabStorage);
    };
  }, []);

  // Handlers
  const handleSavePacket = (pkt: ExamPacket) => {
    sqliteReadyRef.current = true;
    setPackets((prev) => {
      const exists = prev.some((item) => item.id === pkt.id);
      return exists ? prev.map((item) => (item.id === pkt.id ? pkt : item)) : [pkt, ...prev];
    });
  };

  const handleDeletePacket = (packetId: string) => {
    sqliteReadyRef.current = true;
    setPackets((prev) => prev.filter((item) => item.id !== packetId));
  };

  const handleSaveSchedule = (sch: ExamSchedule) => {
    sqliteReadyRef.current = true;
    setSchedules((prev) => {
      const exists = prev.some((item) => item.id === sch.id);
      return exists ? prev.map((item) => (item.id === sch.id ? sch : item)) : [sch, ...prev];
    });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    sqliteReadyRef.current = true;
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
    setTeachers((prev) => {
      const exists = prev.some((item) => item.id === tch.id);
      return exists ? prev.map((item) => (item.id === tch.id ? tch : item)) : [tch, ...prev];
    });
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateSubmission = (sub: ExamSubmission) => {
    setSubmissions((prev) => {
      const exists = prev.some((item) => item.id === sub.id);
      return exists ? prev.map((item) => (item.id === sub.id ? sub : item)) : [sub, ...prev];
    });
  };

  const handleResetStudentSubmission = (studentId: string, packetId: string) => {
    setSubmissions((prev) =>
      prev.filter((item) => !(item.studentId === studentId && item.packetId === packetId))
    );
    setSchedules((prev) =>
      prev.map((sch) => {
        if (sch.packetId !== packetId) return sch;
        const updatedList = sch.liveParticipants.map((p) =>
          p.studentId === studentId
            ? {
                ...p,
                status: 'MENGERJAKAN' as const,
                violations: 0,
                remainingMinutes: sch.durasiMenit,
                lastActivity: 'Diizinkan Ujian Ulang',
              }
            : p
        );
        return {
          ...sch,
          selesaiCount: updatedList.filter((p) => p.status === 'SELESAI').length,
          liveParticipants: updatedList,
        };
      })
    );
  };

  const handleResetSubmissionRecord = (sub: ExamSubmission) => {
    setSubmissions((prev) => prev.filter((item) => item.id !== sub.id));
    handleResetStudentSubmission(sub.studentId, sub.packetId);
  };

  const handleChangeSelfPassword = (newPass: string) => {
    if (!authSession) return;
    if (authSession.role === 'admin') {
      setSettings((prev) => [{ ...(prev[0] || INITIAL_SETTINGS), adminPassword: newPass }]);
    } else if (authSession.role === 'guru') {
      setTeachers((prev) =>
        prev.map((t) => (t.id === authSession.id ? { ...t, password: newPass } : t))
      );
    }
  };

  const handleForceSyncSqlite = async (overrideSettings?: SchoolSettings) => {
    const activeSettings = overrideSettings || currentSettings;
    const payload = {
      settings: activeSettings,
      packets,
      schedules,
      students,
      teachers,
      submissions,
    };
    const supaCfg = getSupabaseConfig(activeSettings);
    if (supaCfg) {
      await saveMasterStateToSupabase(payload, supaCfg);
    }
    if (isLocalSqliteHost()) {
      await saveStateToSqlite(payload);
    }
  };

  const handleOpenStudentSim = (packetId?: string) => {
    setStudentSimPacketId(packetId);
    setUserRole('siswa');
  };

  const handleLoginSuccess = (session: AuthenticatedSession) => {
    setAuthSession(session);
    setUserRole(session.role);
    if (session.role === 'siswa') {
      setStudentSimPacketId(session.packetId);
      setStudentSimStudentId(session.studentId);
    } else if (session.role === 'guru') {
      if (session.jenjang) {
        setSelectedJenjang(session.jenjang);
      }
      const firstAllowed = session.allowedTabs?.[0] || 'dashboard';
      setActiveTab(firstAllowed);
    } else {
      setSelectedJenjang('ALL');
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    setStudentSimPacketId(undefined);
    setStudentSimStudentId(undefined);
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

  if (!authSession) {
    return (
      <LoginPortalView
        students={students}
        teachers={teachers}
        schedules={schedules}
        packets={packets}
        submissions={submissions}
        settings={currentSettings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

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
          allowedTabs={authSession.allowedTabs}
          onSelectTab={setActiveTab}
          onSetUserRole={setUserRole}
          onOpenStudentSim={() => handleOpenStudentSim()}
          onOpenGuide={() => setShowGuideModal(true)}
          onLogout={handleLogout}
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
            authSession={authSession}
            onChangeSelfPassword={handleChangeSelfPassword}
            onLogout={handleLogout}
          />

          {/* Active View Content */}
          <main className="flex-1">
            {userRole === 'siswa' ? (
              <StudentExamPortal
                packets={packets}
                schedules={schedules}
                students={students}
                settings={currentSettings}
                initialPacketId={studentSimPacketId}
                initialStudentId={studentSimStudentId}
                onExitPortal={() => {
                  if (authSession.role === 'siswa') {
                    handleLogout();
                  } else {
                    setUserRole(authSession.role);
                    setActiveTab('rekap-nilai');
                  }
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
                    authSession={authSession}
                  />
                )}

                {activeTab === 'bank-soal' && (
                  <BankSoalView
                    packets={packets}
                    settings={currentSettings}
                    selectedJenjang={selectedJenjang}
                    onSelectJenjang={setSelectedJenjang}
                    onSavePacket={handleSavePacket}
                    onDeletePacket={handleDeletePacket}
                    onOpenStudentSim={handleOpenStudentSim}
                    authSession={authSession}
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
                    onResetStudentSubmission={handleResetStudentSubmission}
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
                    onDeleteTeacher={handleDeleteTeacher}
                    onSaveSettings={(next) => setSettings([next])}
                    authSession={authSession}
                  />
                )}

                {activeTab === 'rekap-nilai' && (
                  <RekapNilaiView
                    submissions={submissions}
                    packets={packets}
                    settings={currentSettings}
                    selectedJenjang={selectedJenjang}
                    onSelectJenjang={setSelectedJenjang}
                    onUpdateSubmission={handleUpdateSubmission}
                    onResetSubmission={handleResetSubmissionRecord}
                    authSession={authSession}
                  />
                )}

                {activeTab === 'pengaturan' && (
                  <PengaturanView
                    settings={currentSettings}
                    students={students}
                    teachers={teachers}
                    onNavigateTab={setActiveTab}
                    onSaveSettings={(next) => {
                      setSettings([next]);
                      if (authSession?.role === 'admin' && next.adminName) {
                        setAuthSession((prev) =>
                          prev ? { ...prev, name: next.adminName || prev.name } : prev
                        );
                      }
                    }}
                    onResetDemoData={handleResetDemoData}
                    onExportFullBackup={handleExportFullBackup}
                    onImportFullBackup={handleImportFullBackup}
                    onForceSyncSqlite={handleForceSyncSqlite}
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
