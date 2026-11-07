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
  canTeacherAccessPacket,
  canTeacherAccessSubmission,
  isUnitManagerSession,
} from './utils/rbacHelper';
import {
  isLocalSqliteHost,
  loadStateFromSqlite,
  saveStateToSqlite,
} from './utils/sqliteApiClient';
import {
  deleteScheduleFromSupabase,
  deleteStudentFromSupabase,
  deleteSubmissionFromSupabase,
  getPendingCloudPatches,
  getSupabaseConfig,
  loadStateFromSupabase,
  patchMasterColumnInSupabase,
  saveMasterStateToSupabase,
  upsertSubmissionToSupabase,
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
        // First flush any pending local patches interrupted by a rapid page refresh
        const pendingBefore = getPendingCloudPatches();
        if (Object.keys(pendingBefore).length > 0) {
          await patchMasterColumnInSupabase(pendingBefore, supaCfg);
        }

        const cloudLoaded = await loadStateFromSupabase(supaCfg);
        if (mounted && cloudLoaded) {
          const pendingNow = getPendingCloudPatches();
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
            if (pendingNow.settings_json) {
              setSettings([normalizeSchoolSettings(pendingNow.settings_json)]);
            } else if (cloudLoaded.settings) {
              const normalizedCloudSettings = normalizeSchoolSettings(cloudLoaded.settings);
              setSettings([normalizedCloudSettings]);
            }

            if (pendingNow.packets_json) {
              setPackets(pendingNow.packets_json);
            } else if (Array.isArray(cloudLoaded.packets)) {
              setPackets(cloudLoaded.packets);
            }

            if (pendingNow.schedules_json) {
              setSchedules(pendingNow.schedules_json);
            } else if (Array.isArray(cloudLoaded.schedules)) {
              setSchedules(cloudLoaded.schedules);
            }

            if (pendingNow.students_json) {
              setStudents(pendingNow.students_json);
            } else if (Array.isArray(cloudLoaded.students) && cloudLoaded.students.length > 0) {
              setStudents(cloudLoaded.students);
            } else if (INITIAL_STUDENTS.length > 0) {
              setStudents(INITIAL_STUDENTS);
              await patchMasterColumnInSupabase({ students_json: INITIAL_STUDENTS }, supaCfg);
            }

            if (pendingNow.teachers_json) {
              setTeachers(pendingNow.teachers_json);
            } else if (Array.isArray(cloudLoaded.teachers)) {
              setTeachers(cloudLoaded.teachers);
            }

            if (Array.isArray(cloudLoaded.submissions)) {
              setSubmissions(cloudLoaded.submissions);
            }
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

  // Periodic READ-ONLY background cloud refresh for Login Portal & Admin/Guru views.
  // Never triggers a full-table overwrite back to Supabase.
  useEffect(() => {
    const supaCfg = getSupabaseConfig(currentSettings);
    if (!supaCfg || authSession?.role === 'siswa') return;

    const interval = setInterval(async () => {
      const pending = getPendingCloudPatches();
      if (Object.keys(pending).length > 0) {
        await patchMasterColumnInSupabase(pending, supaCfg);
      }

      const cloudLoaded = await loadStateFromSupabase(supaCfg);
      if (!cloudLoaded || cloudLoaded.empty) return;
      const latestPending = getPendingCloudPatches();

      if (!latestPending.students_json && Array.isArray(cloudLoaded.students)) {
        setStudents((prev) =>
          JSON.stringify(prev) === JSON.stringify(cloudLoaded.students)
            ? prev
            : cloudLoaded.students
        );
      }
      if (!latestPending.teachers_json && Array.isArray(cloudLoaded.teachers)) {
        setTeachers((prev) =>
          JSON.stringify(prev) === JSON.stringify(cloudLoaded.teachers)
            ? prev
            : cloudLoaded.teachers
        );
      }
      if (!latestPending.packets_json && Array.isArray(cloudLoaded.packets)) {
        setPackets((prev) =>
          JSON.stringify(prev) === JSON.stringify(cloudLoaded.packets)
            ? prev
            : cloudLoaded.packets
        );
      }
      if (!latestPending.schedules_json && Array.isArray(cloudLoaded.schedules)) {
        setSchedules((prev) =>
          JSON.stringify(prev) === JSON.stringify(cloudLoaded.schedules)
            ? prev
            : cloudLoaded.schedules
        );
      }
      if (!latestPending.settings_json && cloudLoaded.settings) {
        const normalizedCloud = normalizeSchoolSettings(cloudLoaded.settings);
        setSettings((prev) =>
          JSON.stringify(prev[0]) === JSON.stringify(normalizedCloud)
            ? prev
            : [normalizedCloud]
        );
      }
      if (Array.isArray(cloudLoaded.submissions)) {
        setSubmissions((prev) => {
          const byId = new Map(prev.map((s) => [s.id, s]));
          cloudLoaded.submissions.forEach((s) => byId.set(s.id, s));
          const merged = Array.from(byId.values());
          return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
        });
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [currentSettings, authSession]);

  // Auto-sync state changes ONLY to Local SQLite Server Database when running on localhost.
  // Cloud Supabase updates are dispatched explicitly on user actions via patchMasterColumnInSupabase
  // so background polls or stale tabs can NEVER overwrite cbt_app_state.
  useEffect(() => {
    if (!sqliteReadyRef.current || authSession?.role === 'siswa' || !isLocalSqliteHost()) return;
    const timer = setTimeout(() => {
      saveStateToSqlite({
        settings: currentSettings,
        packets,
        schedules,
        students,
        teachers,
        submissions,
      });
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
        } else if (ev.key === STORAGE_KEYS.STUDENTS) {
          setStudents(JSON.parse(ev.newValue));
        } else if (ev.key === STORAGE_KEYS.TEACHERS) {
          setTeachers(JSON.parse(ev.newValue));
        } else if (ev.key === STORAGE_KEYS.SUBMISSIONS) {
          setSubmissions(JSON.parse(ev.newValue));
        } else if (ev.key === STORAGE_KEYS.SETTINGS) {
          const parsed = JSON.parse(ev.newValue);
          if (Array.isArray(parsed) && parsed[0]) {
            setSettings([normalizeSchoolSettings(parsed[0])]);
          }
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

  // Handlers — All mutations synchronously update localStorage AND immediately PATCH
  // only the affected column in Supabase cbt_app_state (backed by a pending-patch journal).
  const handleSavePacket = (pkt: ExamPacket) => {
    sqliteReadyRef.current = true;
    const liveTeacher =
      authSession?.role === 'guru' ? teachers.find((t) => t.id === authSession.id) : undefined;
    const isIsolatedGuru =
      authSession?.role === 'guru' && !isUnitManagerSession(authSession, liveTeacher);

    setPackets((prev) => {
      const existing = prev.find((item) => item.id === pkt.id);
      if (existing && !canTeacherAccessPacket(existing, authSession, liveTeacher)) {
        return prev;
      }
      const stamped: ExamPacket = {
        ...pkt,
        guruId:
          existing?.guruId ||
          pkt.guruId ||
          (isIsolatedGuru && authSession ? authSession.id : undefined),
        guruNama:
          isIsolatedGuru && authSession && !existing?.guruNama
            ? authSession.name
            : pkt.guruNama || existing?.guruNama || '',
      };
      const next = existing
        ? prev.map((item) => (item.id === stamped.id ? stamped : item))
        : [stamped, ...prev];
      localStorage.setItem(STORAGE_KEYS.PACKETS, JSON.stringify(next));
      patchMasterColumnInSupabase({ packets_json: next });
      return next;
    });
  };

  const handleDeletePacket = (packetId: string) => {
    sqliteReadyRef.current = true;
    const liveTeacher =
      authSession?.role === 'guru' ? teachers.find((t) => t.id === authSession.id) : undefined;

    setPackets((prev) => {
      const target = prev.find((item) => item.id === packetId);
      if (target && !canTeacherAccessPacket(target, authSession, liveTeacher)) {
        return prev;
      }
      const next = prev.filter((item) => item.id !== packetId);
      localStorage.setItem(STORAGE_KEYS.PACKETS, JSON.stringify(next));
      patchMasterColumnInSupabase({ packets_json: next }, undefined, {
        deletedIds: [packetId],
      });
      return next;
    });
  };

  const handleSaveSchedule = (sch: ExamSchedule) => {
    sqliteReadyRef.current = true;
    setSchedules((prev) => {
      const exists = prev.some((item) => item.id === sch.id);
      const next = exists
        ? prev.map((item) => (item.id === sch.id ? sch : item))
        : [sch, ...prev];
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(next));
      patchMasterColumnInSupabase({ schedules_json: next });
      return next;
    });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    sqliteReadyRef.current = true;
    setSchedules((prev) => {
      const next = prev.filter((item) => item.id !== scheduleId);
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(next));
      patchMasterColumnInSupabase({ schedules_json: next }, undefined, {
        deletedIds: [scheduleId],
      });
      return next;
    });
    deleteScheduleFromSupabase(scheduleId);
  };

  const handleRefreshToken = (scheduleId: string) => {
    sqliteReadyRef.current = true;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const nextToken = Array.from({ length: 6 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
    setSchedules((prev) => {
      const next = prev.map((s) => (s.id === scheduleId ? { ...s, token: nextToken } : s));
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(next));
      patchMasterColumnInSupabase({ schedules_json: next });
      return next;
    });
  };

  const handleSaveStudent = (std: Student) => {
    sqliteReadyRef.current = true;
    setStudents((prev) => {
      const exists = prev.some((item) => item.id === std.id);
      const next = exists
        ? prev.map((item) => (item.id === std.id ? std : item))
        : [std, ...prev];
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      patchMasterColumnInSupabase({ students_json: next });
      return next;
    });
  };

  const handleBulkSaveStudents = (list: Student[]) => {
    sqliteReadyRef.current = true;
    setStudents((prev) => {
      const next = [...list, ...prev];
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      patchMasterColumnInSupabase({ students_json: next });
      return next;
    });
  };

  const handleRegenerateAllPins = () => {
    sqliteReadyRef.current = true;
    setStudents((prev) => {
      const next = prev.map((s) => ({
        ...s,
        pin: String(Math.floor(100000 + Math.random() * 900000)),
      }));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      patchMasterColumnInSupabase({ students_json: next });
      return next;
    });
  };

  const handleDeleteStudent = (id: string) => {
    sqliteReadyRef.current = true;
    setStudents((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      patchMasterColumnInSupabase({ students_json: next }, undefined, {
        deletedIds: [id],
      });
      return next;
    });
    deleteStudentFromSupabase(id);
  };

  const handleSaveTeacher = (tch: Teacher) => {
    sqliteReadyRef.current = true;
    setTeachers((prev) => {
      const exists = prev.some((item) => item.id === tch.id);
      const next = exists
        ? prev.map((item) => (item.id === tch.id ? tch : item))
        : [tch, ...prev];
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(next));
      patchMasterColumnInSupabase({ teachers_json: next });
      return next;
    });
  };

  const handleBulkSaveTeachers = (list: Teacher[]) => {
    if (!list || list.length === 0) return;
    sqliteReadyRef.current = true;
    setTeachers((prev) => {
      const byUsername = new Map(
        prev.map((item) => [(item.username || '').toLowerCase(), item])
      );
      const added: Teacher[] = [];
      const updatedIds = new Map<string, Teacher>();

      for (const incoming of list) {
        const uKey = (incoming.username || '').toLowerCase();
        const existing = uKey ? byUsername.get(uKey) : undefined;
        if (existing) {
          updatedIds.set(existing.id, { ...incoming, id: existing.id });
        } else {
          added.push(incoming);
        }
      }

      const mergedExisting = prev.map((item) => updatedIds.get(item.id) || item);
      const next = [...added, ...mergedExisting];
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(next));
      patchMasterColumnInSupabase({ teachers_json: next });
      return next;
    });
  };

  const handleDeleteTeacher = (id: string) => {
    sqliteReadyRef.current = true;
    setTeachers((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(next));
      patchMasterColumnInSupabase({ teachers_json: next }, undefined, {
        deletedIds: [id],
      });
      return next;
    });
  };

  const handleSaveSettings = (next: SchoolSettings) => {
    sqliteReadyRef.current = true;
    const normalized = normalizeSchoolSettings(next);
    setSettings([normalized]);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify([normalized]));
    patchMasterColumnInSupabase({ settings_json: normalized });
    if (authSession?.role === 'admin' && normalized.adminName) {
      setAuthSession((prev) =>
        prev ? { ...prev, name: normalized.adminName || prev.name } : prev
      );
    }
  };

  const handleUpdateSubmission = (sub: ExamSubmission) => {
    sqliteReadyRef.current = true;
    setSubmissions((prev) => {
      const exists = prev.some((item) => item.id === sub.id);
      const next = exists
        ? prev.map((item) => (item.id === sub.id ? sub : item))
        : [sub, ...prev];
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(next));
      return next;
    });
    upsertSubmissionToSupabase(sub);
  };

  const handleResetStudentSubmission = (studentId: string, packetId: string) => {
    sqliteReadyRef.current = true;
    setSubmissions((prev) => {
      const next = prev.filter(
        (item) => !(item.studentId === studentId && item.packetId === packetId)
      );
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(next));
      return next;
    });
    setSchedules((prev) => {
      const next = prev.map((sch) => {
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
      });
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(next));
      patchMasterColumnInSupabase({ schedules_json: next });
      return next;
    });
  };

  const handleResetSubmissionRecord = (sub: ExamSubmission) => {
    sqliteReadyRef.current = true;
    setSubmissions((prev) => {
      const next = prev.filter((item) => item.id !== sub.id);
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(next));
      return next;
    });
    deleteSubmissionFromSupabase(sub.id);
    handleResetStudentSubmission(sub.studentId, sub.packetId);
  };

  const handleChangeSelfPassword = (newPass: string) => {
    if (!authSession) return;
    sqliteReadyRef.current = true;
    if (authSession.role === 'admin') {
      setSettings((prev) => {
        const nextSetting = normalizeSchoolSettings({
          ...(prev[0] || INITIAL_SETTINGS),
          adminPassword: newPass,
        });
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify([nextSetting]));
        patchMasterColumnInSupabase({ settings_json: nextSetting });
        return [nextSetting];
      });
    } else if (authSession.role === 'guru') {
      setTeachers((prev) => {
        const next = prev.map((t) =>
          t.id === authSession.id ? { ...t, password: newPass } : t
        );
        localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(next));
        patchMasterColumnInSupabase({ teachers_json: next });
        return next;
      });
    }
  };

  const handleForceSyncSqlite = async (overrideSettings?: SchoolSettings) => {
    const activeSettings = normalizeSchoolSettings(overrideSettings || currentSettings);
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
    sqliteReadyRef.current = true;
    const normalizedSettings = normalizeSchoolSettings(INITIAL_SETTINGS);
    setPackets(INITIAL_PACKETS);
    setSchedules(INITIAL_SCHEDULES);
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setSettings([normalizedSettings]);
    saveMasterStateToSupabase({
      settings: normalizedSettings,
      packets: INITIAL_PACKETS,
      schedules: INITIAL_SCHEDULES,
      students: INITIAL_STUDENTS,
      teachers: INITIAL_TEACHERS,
      submissions: INITIAL_SUBMISSIONS,
    });
  };

  const handleImportFullBackup = (data: any) => {
    sqliteReadyRef.current = true;
    const nextPackets = Array.isArray(data.packets) ? data.packets : packets;
    const nextSchedules = Array.isArray(data.schedules) ? data.schedules : schedules;
    const nextStudents = Array.isArray(data.students) ? data.students : students;
    const nextTeachers = Array.isArray(data.teachers) ? data.teachers : teachers;
    const nextSubmissions = Array.isArray(data.submissions) ? data.submissions : submissions;
    const nextSettings = data.settings
      ? normalizeSchoolSettings(data.settings)
      : currentSettings;

    setPackets(nextPackets);
    setSchedules(nextSchedules);
    setStudents(nextStudents);
    setTeachers(nextTeachers);
    setSubmissions(nextSubmissions);
    setSettings([nextSettings]);

    saveMasterStateToSupabase({
      settings: nextSettings,
      packets: nextPackets,
      schedules: nextSchedules,
      students: nextStudents,
      teachers: nextTeachers,
      submissions: nextSubmissions,
    });
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

  const liveTeacherRecord =
    authSession.role === 'guru' ? teachers.find((t) => t.id === authSession.id) : undefined;
  const effectiveAuthSession: AuthenticatedSession =
    authSession.role === 'guru'
      ? {
          ...authSession,
          name: liveTeacherRecord
            ? liveTeacherRecord.gelar
              ? `${liveTeacherRecord.nama}, ${liveTeacherRecord.gelar}`
              : liveTeacherRecord.nama
            : authSession.name,
          peran: liveTeacherRecord?.peran || authSession.peran,
          jenjang: liveTeacherRecord?.jenjangAmpu[0] || authSession.jenjang || 'MTs',
          allowedJenjangs:
            liveTeacherRecord?.jenjangAmpu && liveTeacherRecord.jenjangAmpu.length > 0
              ? liveTeacherRecord.jenjangAmpu
              : authSession.allowedJenjangs && authSession.allowedJenjangs.length > 0
              ? authSession.allowedJenjangs
              : authSession.jenjang
              ? [authSession.jenjang]
              : ['MTs'],
          mapelAmpu: liveTeacherRecord?.mapelAmpu || authSession.mapelAmpu,
        }
      : authSession;

  const teacherAllowedJenjangs =
    effectiveAuthSession.role === 'guru' ? effectiveAuthSession.allowedJenjangs : undefined;

  const scopedPackets =
    effectiveAuthSession.role === 'guru'
      ? packets.filter((p) => canTeacherAccessPacket(p, effectiveAuthSession, liveTeacherRecord))
      : packets;
  const scopedPacketIds = new Set(scopedPackets.map((p) => p.id));

  const scopedSchedules =
    teacherAllowedJenjangs && teacherAllowedJenjangs.length > 0
      ? schedules.filter((s) => teacherAllowedJenjangs.includes(s.jenjang))
      : schedules;
  const scopedStudents =
    teacherAllowedJenjangs && teacherAllowedJenjangs.length > 0
      ? students.filter((s) => teacherAllowedJenjangs.includes(s.jenjang))
      : students;
  const scopedSubmissions =
    effectiveAuthSession.role === 'guru'
      ? submissions.filter((s) =>
          canTeacherAccessSubmission(s, scopedPacketIds, effectiveAuthSession, liveTeacherRecord)
        )
      : submissions;

  const effectiveSelectedJenjang: JenjangFilter =
    teacherAllowedJenjangs && teacherAllowedJenjangs.length > 0
      ? teacherAllowedJenjangs.length === 1
        ? teacherAllowedJenjangs[0]
        : selectedJenjang === 'ALL' || teacherAllowedJenjangs.includes(selectedJenjang as any)
        ? selectedJenjang
        : teacherAllowedJenjangs[0]
      : selectedJenjang;

  const handleSelectJenjang = (next: JenjangFilter) => {
    if (teacherAllowedJenjangs && teacherAllowedJenjangs.length > 0) {
      if (teacherAllowedJenjangs.length === 1) {
        setSelectedJenjang(teacherAllowedJenjangs[0]);
        return;
      }
      if (next !== 'ALL' && !teacherAllowedJenjangs.includes(next)) {
        setSelectedJenjang(teacherAllowedJenjangs[0]);
        return;
      }
    }
    setSelectedJenjang(next);
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
          allowedTabs={effectiveAuthSession.allowedTabs}
          onSelectTab={setActiveTab}
          onSetUserRole={setUserRole}
          onOpenStudentSim={() => handleOpenStudentSim()}
          onOpenGuide={() => setShowGuideModal(true)}
          onLogout={handleLogout}
        />

        {/* Inner Content Surface Canvas (#F6F8FC in light mode) */}
        <div className="flex-1 min-w-0 rounded-[28px] bg-surface p-4 sm:p-6 lg:p-7 flex flex-col justify-between space-y-6">
          <TopHeaderBar
            packets={scopedPackets}
            students={scopedStudents}
            selectedJenjang={effectiveSelectedJenjang}
            onSelectJenjang={handleSelectJenjang}
            onNavigateTab={setActiveTab}
            userRole={userRole}
            onSetUserRole={setUserRole}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            authSession={effectiveAuthSession}
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
                  if (effectiveAuthSession.role === 'siswa') {
                    handleLogout();
                  } else {
                    setUserRole(effectiveAuthSession.role);
                    setActiveTab('rekap-nilai');
                  }
                }}
                onSubmitExamResult={handleUpdateSubmission}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    selectedJenjang={effectiveSelectedJenjang}
                    onSelectJenjang={handleSelectJenjang}
                    onNavigate={setActiveTab}
                    onOpenStudentSim={handleOpenStudentSim}
                    packets={scopedPackets}
                    schedules={scopedSchedules}
                    students={scopedStudents}
                    submissions={scopedSubmissions}
                    onRefreshToken={handleRefreshToken}
                    authSession={effectiveAuthSession}
                  />
                )}

                {activeTab === 'bank-soal' && (
                  <BankSoalView
                    packets={scopedPackets}
                    teachers={teachers}
                    settings={currentSettings}
                    selectedJenjang={effectiveSelectedJenjang}
                    onSelectJenjang={handleSelectJenjang}
                    onSavePacket={handleSavePacket}
                    onDeletePacket={handleDeletePacket}
                    onOpenStudentSim={handleOpenStudentSim}
                    authSession={effectiveAuthSession}
                  />
                )}

                {activeTab === 'jadwal-live' && (
                  <JadwalLiveView
                    schedules={scopedSchedules}
                    packets={scopedPackets}
                    selectedJenjang={effectiveSelectedJenjang}
                    onSelectJenjang={handleSelectJenjang}
                    onSaveSchedule={handleSaveSchedule}
                    onDeleteSchedule={handleDeleteSchedule}
                    onRefreshToken={handleRefreshToken}
                    onOpenStudentSim={handleOpenStudentSim}
                    onResetStudentSubmission={handleResetStudentSubmission}
                    authSession={effectiveAuthSession}
                  />
                )}

                {activeTab === 'peserta-kartu' && (
                  <DataPesertaKartuView
                    students={scopedStudents}
                    teachers={teachers}
                    settings={currentSettings}
                    selectedJenjang={effectiveSelectedJenjang}
                    onSelectJenjang={handleSelectJenjang}
                    onSaveStudent={handleSaveStudent}
                    onBulkSaveStudents={handleBulkSaveStudents}
                    onRegenerateAllPins={handleRegenerateAllPins}
                    onDeleteStudent={handleDeleteStudent}
                    onSaveTeacher={handleSaveTeacher}
                    onBulkSaveTeachers={handleBulkSaveTeachers}
                    onDeleteTeacher={handleDeleteTeacher}
                    onSaveSettings={handleSaveSettings}
                    authSession={effectiveAuthSession}
                  />
                )}

                {activeTab === 'rekap-nilai' && (
                  <RekapNilaiView
                    submissions={scopedSubmissions}
                    packets={scopedPackets}
                    settings={currentSettings}
                    selectedJenjang={effectiveSelectedJenjang}
                    onSelectJenjang={handleSelectJenjang}
                    onUpdateSubmission={handleUpdateSubmission}
                    onResetSubmission={handleResetSubmissionRecord}
                    authSession={effectiveAuthSession}
                  />
                )}

                {activeTab === 'pengaturan' && (
                  <PengaturanView
                    settings={currentSettings}
                    students={students}
                    teachers={teachers}
                    onNavigateTab={setActiveTab}
                    onSaveSettings={handleSaveSettings}
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
