import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  LogOut,
  Maximize2,
  Megaphone,
  Radio,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import {
  ExamPacket,
  ExamSchedule,
  ExamSubmission,
  LiveParticipant,
  Question,
  SchoolSettings,
  Student,
} from '../types/cbt';
import { PortalLobbyScreen } from './student-portal/PortalLobbyScreen';
import { PortalResultReview } from './student-portal/PortalResultReview';
import { ActiveQuestionCanvas } from './student-portal/ActiveQuestionCanvas';
import {
  ConfirmSubmitModal,
  QuestionMatrixSidebar,
} from './student-portal/QuestionMatrixSidebar';
import {
  publishLiveSyncEvent,
  subscribeLiveSyncEvents,
} from '../utils/liveProctorSync';

interface StudentExamPortalProps {
  packets: ExamPacket[];
  schedules: ExamSchedule[];
  students: Student[];
  settings?: SchoolSettings;
  initialPacketId?: string;
  initialStudentId?: string;
  onExitPortal: () => void;
  onSubmitExamResult: (submission: ExamSubmission) => void;
}

export const StudentExamPortal: React.FC<StudentExamPortalProps> = ({
  packets,
  schedules,
  students,
  settings,
  initialPacketId,
  initialStudentId,
  onExitPortal,
  onSubmitExamResult,
}) => {
  const [selectedPacketId, setSelectedPacketId] = useState<string>(
    initialPacketId || packets[0]?.id || ''
  );
  const [hasStarted, setHasStarted] = useState<boolean>(Boolean(initialPacketId));
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState<boolean>(false);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [proctorToast, setProctorToast] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string | undefined>(undefined);
  const forceSubmitRef = useRef<(() => void) | null>(null);

  const activePacket = packets.find((p) => p.id === selectedPacketId) || packets[0];
  const matchingSchedule =
    schedules.find((s) => s.packetId === activePacket?.id) || schedules[0];
  const matchingStudent =
    (initialStudentId && students.find((s) => s.id === initialStudentId)) ||
    students.find((s) => s.jenjang === activePacket?.jenjang) ||
    students[0];

  const maxViolationsAllowed = settings?.maxViolationsAllowed || 3;
  const isLockedByAntiCheat =
    settings?.antiCheatBlockTabSwitch !== false && violationCount >= maxViolationsAllowed;

  const [tokenInput, setTokenInput] = useState<string>(
    matchingSchedule?.token || 'JN849K'
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [secondsLeft, setSecondsLeft] = useState<number>(
    (matchingSchedule?.durasiMenit || 90) * 60
  );

  // Answers state per question ID
  const [pgAnswers, setPgAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [pgkAnswers, setPgkAnswers] = useState<
    Record<string, ('A' | 'B' | 'C' | 'D' | 'E')[]>
  >({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, string>>>({});
  const [bsAnswers, setBsAnswers] = useState<Record<string, boolean>>({});
  const [esaiAnswers, setEsaiAnswers] = useState<Record<string, string>>({});
  const [doubtFlags, setDoubtFlags] = useState<Record<string, boolean>>({});
  const [lastSubmission, setLastSubmission] = useState<ExamSubmission | null>(null);
  const hydratedProgressKeyRef = useRef<string | null>(null);

  const progressStorageKey =
    activePacket?.id && (matchingStudent?.id || initialStudentId)
      ? `jn_cbt_exam_progress_v1_${matchingStudent?.id || initialStudentId}_${activePacket.id}`
      : null;

  // Hydrate saved answers & remaining timer if browser refreshed mid-exam
  useEffect(() => {
    if (!progressStorageKey || !activePacket) return;
    if (hydratedProgressKeyRef.current === progressStorageKey) return;
    hydratedProgressKeyRef.current = progressStorageKey;

    try {
      const raw = localStorage.getItem(progressStorageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.packetId === activePacket.id) {
          if (saved.pgAnswers) setPgAnswers(saved.pgAnswers);
          if (saved.pgkAnswers) setPgkAnswers(saved.pgkAnswers);
          if (saved.matchingAnswers) setMatchingAnswers(saved.matchingAnswers);
          if (saved.bsAnswers) setBsAnswers(saved.bsAnswers);
          if (saved.esaiAnswers) setEsaiAnswers(saved.esaiAnswers);
          if (saved.doubtFlags) setDoubtFlags(saved.doubtFlags);
          if (typeof saved.currentIndex === 'number') setCurrentIndex(saved.currentIndex);
          if (typeof saved.violationCount === 'number') setViolationCount(saved.violationCount);
          if (typeof saved.secondsLeft === 'number' && saved.secondsLeft > 0) {
            setSecondsLeft(saved.secondsLeft);
          } else if (matchingSchedule) {
            setSecondsLeft(matchingSchedule.durasiMenit * 60);
          }
          if (saved.hasStarted) {
            setHasStarted(true);
          }
          return;
        }
      }
    } catch {
      // Ignore parse error
    }

    if (matchingSchedule) {
      setTokenInput(matchingSchedule.token);
      setSecondsLeft(matchingSchedule.durasiMenit * 60);
    }
  }, [progressStorageKey, activePacket?.id, matchingSchedule?.id]);

  // Persist active exam answers & remaining seconds in real-time against accidental refresh
  useEffect(() => {
    if (!progressStorageKey || !activePacket || !hasStarted || isSubmitted) return;
    try {
      localStorage.setItem(
        progressStorageKey,
        JSON.stringify({
          packetId: activePacket.id,
          pgAnswers,
          pgkAnswers,
          matchingAnswers,
          bsAnswers,
          esaiAnswers,
          doubtFlags,
          currentIndex,
          violationCount,
          secondsLeft,
          hasStarted,
          savedAt: Date.now(),
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    progressStorageKey,
    activePacket?.id,
    hasStarted,
    isSubmitted,
    pgAnswers,
    pgkAnswers,
    matchingAnswers,
    bsAnswers,
    esaiAnswers,
    doubtFlags,
    currentIndex,
    violationCount,
    secondsLeft,
  ]);

  useEffect(() => {
    if (matchingSchedule) {
      setTokenInput(matchingSchedule.token);
      setLiveAnnouncement(matchingSchedule.announcement);
    }
  }, [matchingSchedule?.token, matchingSchedule?.announcement]);

  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted]);

  // Auto-submit immediately when countdown timer reaches 00:00
  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
    if (secondsLeft <= 0) {
      setProctorToast(
        'Waktu ujian telah habis (00:00). Lembar jawaban Anda dikumpulkan secara otomatis.'
      );
      forceSubmitRef.current?.();
    }
  }, [secondsLeft, hasStarted, isSubmitted]);

  // Anti-cheat tab switch listener during active exam
  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setViolationCount((v) => v + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [hasStarted, isSubmitted]);

  // Subscribe to real-time Proctor commands & announcements via BroadcastChannel
  useEffect(() => {
    return subscribeLiveSyncEvents((msg) => {
      if (
        msg.type === 'PROCTOR_BROADCAST' &&
        (msg.scheduleId === matchingSchedule?.id || msg.packetId === activePacket?.id)
      ) {
        setLiveAnnouncement(msg.announcement);
        if (msg.announcement) {
          setProctorToast(`Siaran Pengawas Baru: "${msg.announcement}"`);
          setTimeout(() => setProctorToast(null), 5000);
        }
      } else if (
        msg.type === 'PROCTOR_BULK_ACTION' &&
        (msg.scheduleId === matchingSchedule?.id || msg.packetId === activePacket?.id)
      ) {
        if (msg.action === 'BULK_RESET_LOGIN') {
          setViolationCount(0);
          setProctorToast('Pengawas Ruang membuka kunci anti-cheat seluruh peserta di ruang ini!');
          setTimeout(() => setProctorToast(null), 4500);
        } else if (msg.action === 'BULK_ADD_TIME') {
          const bonusSecs = (msg.addedMinutes || 10) * 60;
          setSecondsLeft((prev) => prev + bonusSecs);
          setProctorToast('Pengawas Ruang menambahkan waktu +10 Menit untuk seluruh ruang!');
          setTimeout(() => setProctorToast(null), 4500);
        }
      } else if (msg.type === 'PROCTOR_ACTION') {
        const isTargetStudent =
          msg.studentId === matchingStudent?.id ||
          msg.nomorPeserta === matchingStudent?.nomorPeserta ||
          msg.scheduleId === matchingSchedule?.id;
        if (!isTargetStudent) return;

        if (msg.action === 'RESET_LOGIN' || msg.action === 'RESET_SUBMIT') {
          setViolationCount(0);
          if (msg.action === 'RESET_SUBMIT') {
            setIsSubmitted(false);
            if (progressStorageKey) {
              try {
                localStorage.removeItem(progressStorageKey);
              } catch {
                // ignore
              }
            }
            setPgAnswers({});
            setPgkAnswers({});
            setBsAnswers({});
            setMatchingAnswers({});
            setEsaiAnswers({});
            setDoubtFlags({});
            setCurrentIndex(0);
            if (matchingSchedule) {
              setSecondsLeft(matchingSchedule.durasiMenit * 60);
            }
          }
          setProctorToast('Pengawas Ruang telah membuka kunci / mereset sesi ujian Anda!');
          setTimeout(() => setProctorToast(null), 4500);
        } else if (msg.action === 'ADD_TIME') {
          const bonusSecs = (msg.addedMinutes || 15) * 60;
          setSecondsLeft((prev) => prev + bonusSecs);
          setProctorToast('Pengawas Ruang menambahkan waktu +15 Menit pada sesi ujian Anda!');
          setTimeout(() => setProctorToast(null), 4500);
        } else if (msg.action === 'FORCE_SUBMIT') {
          setProctorToast('Pengawas Ruang menginstruksikan pengumpulan jawaban sekarang.');
          forceSubmitRef.current?.();
        }
      }
    });
  }, [matchingSchedule?.id, activePacket?.id, matchingStudent?.id, matchingStudent?.nomorPeserta]);

  // Keyboard Left/Right navigation for questions
  useEffect(() => {
    if (!hasStarted || isSubmitted || !activePacket) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(activePacket.questions.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isSubmitted, activePacket]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isQuestionAnswered = (q: Question) => {
    if (q.type === 'PG') return Boolean(pgAnswers[q.id]);
    if (q.type === 'PG_KOMPLEKS') return (pgkAnswers[q.id]?.length || 0) > 0;
    if (q.type === 'BENAR_SALAH') return bsAnswers[q.id] !== undefined;
    if (q.type === 'MENJODOHKAN') {
      const pairs = q.matchingPairs || [];
      if (pairs.length === 0) return false;
      const ans = matchingAnswers[q.id] || {};
      return pairs.some((p) => Boolean(ans[p.id]));
    }
    if (q.type === 'ESAI') return Boolean(esaiAnswers[q.id]?.trim());
    return false;
  };

  const togglePgkOption = (qId: string, label: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setPgkAnswers((prev) => {
      const current = prev[qId] || [];
      const next = current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label];
      return { ...prev, [qId]: next };
    });
  };

  const handleFinishExam = () => {
    if (!activePacket) return;
    let pgScore = 0;
    let pgKompleksScore = 0;
    let benarSalahScore = 0;
    let esaiScore = 0;
    let sampleEssayAnswer = '';
    let sampleEssayPrompt = '';
    const itemResponses: Record<string, string> = {};

    activePacket.questions.forEach((q) => {
      if (q.type === 'PG') {
        if (pgAnswers[q.id]) {
          itemResponses[q.id] = pgAnswers[q.id];
        }
        if (pgAnswers[q.id] && pgAnswers[q.id] === q.correctAnswer) {
          pgScore += q.weight;
        }
      } else if (q.type === 'PG_KOMPLEKS') {
        const chosen = pgkAnswers[q.id] || [];
        if (chosen.length > 0) {
          itemResponses[q.id] = chosen.join(',');
        }
        const expected = q.correctAnswers || [];
        const isExact =
          chosen.length === expected.length &&
          expected.every((val) => chosen.includes(val));
        if (isExact) {
          pgKompleksScore += q.weight;
        } else if (chosen.some((val) => expected.includes(val))) {
          pgKompleksScore += Math.round(q.weight * 0.5);
        }
      } else if (q.type === 'BENAR_SALAH') {
        if (bsAnswers[q.id] !== undefined) {
          itemResponses[q.id] = bsAnswers[q.id] ? 'BENAR' : 'SALAH';
        }
        if (bsAnswers[q.id] !== undefined && bsAnswers[q.id] === q.correctBoolean) {
          benarSalahScore += q.weight;
        }
      } else if (q.type === 'MENJODOHKAN') {
        const pairs = q.matchingPairs || [];
        const ansMap = matchingAnswers[q.id] || {};
        if (Object.values(ansMap).some(Boolean)) {
          itemResponses[q.id] = pairs
            .map((p) => `${p.id}:${ansMap[p.id] || '-'}`)
            .join('|');
        }
        if (pairs.length > 0) {
          const correctPairs = pairs.filter((p) => ansMap[p.id] === p.rightText).length;
          pgKompleksScore += Math.round((correctPairs / pairs.length) * q.weight);
        }
      } else if (q.type === 'ESAI') {
        const ans = (esaiAnswers[q.id] || '').trim();
        if (ans) {
          itemResponses[q.id] = ans;
        }
        sampleEssayPrompt = q.prompt;
        sampleEssayAnswer = ans || '(Belum diisi)';
        if (ans.length > 15) {
          esaiScore += Math.round(q.weight * 0.85);
        } else if (ans.length > 0) {
          esaiScore += Math.round(q.weight * 0.5);
        }
      }
    });

    const totalScore = pgScore + pgKompleksScore + benarSalahScore + esaiScore;
    const studentId = matchingStudent?.id || 'std-sim';
    const studentName = matchingStudent?.nama || 'Santri Simulasi CBT';
    const nomorPeserta = matchingStudent?.nomorPeserta || `26-${activePacket.jenjang}-SIM`;
    const scheduleId = matchingSchedule?.id || 'sch-sim';

    const submission: ExamSubmission = {
      id: `sub-${activePacket.id}-${studentId}`,
      scheduleId,
      packetId: activePacket.id,
      studentId,
      studentName,
      nomorPeserta,
      jenjang: activePacket.jenjang,
      kelas: activePacket.kelas,
      mapel: activePacket.mapel,
      submittedAt: 'Baru saja (Live Sync)',
      durationUsedMinutes: Math.max(
        1,
        Math.round(((matchingSchedule?.durasiMenit || 90) * 60 - secondsLeft) / 60)
      ),
      pgScore,
      pgKompleksScore,
      benarSalahScore,
      esaiScore,
      totalScore,
      kkm: activePacket.kkm,
      isEsaiGraded: false,
      violations: violationCount,
      essayQuestionPrompt: sampleEssayPrompt,
      essayAnswerSample: sampleEssayAnswer,
      itemResponses,
    };

    const finalParticipant: LiveParticipant = {
      studentId,
      studentName,
      nomorPeserta,
      kelas: matchingStudent?.kelas || activePacket.kelas,
      status: 'SELESAI',
      answeredCount: activePacket.questions.length,
      totalQuestions: activePacket.questions.length,
      remainingMinutes: 0,
      violations: violationCount,
      ipAddress: '192.168.10.88 (Live Tab)',
      lastActivity: 'Selesai & Submit',
    };

    publishLiveSyncEvent({
      type: 'STUDENT_SUBMITTED',
      scheduleId,
      packetId: activePacket.id,
      participant: finalParticipant,
      submission,
      timestamp: Date.now(),
    });

    if (progressStorageKey) {
      try {
        localStorage.removeItem(progressStorageKey);
      } catch {
        // ignore
      }
    }

    setShowConfirmSubmitModal(false);
    setLastSubmission(submission);
    setIsSubmitted(true);
    onSubmitExamResult(submission);
  };

  forceSubmitRef.current = handleFinishExam;

  const answeredTotalCount = activePacket
    ? activePacket.questions.filter((q) => isQuestionAnswered(q)).length
    : 0;
  const unansweredTotalCount = activePacket
    ? activePacket.questions.length - answeredTotalCount
    : 0;
  const doubtTotalCount = activePacket
    ? activePacket.questions.filter((q) => doubtFlags[q.id]).length
    : 0;

  // Broadcast live student progress across tabs whenever answers or violations change
  useEffect(() => {
    if (!hasStarted || isSubmitted || !activePacket) return;
    const studentId = matchingStudent?.id || 'std-sim';
    const studentName = matchingStudent?.nama || 'Santri Simulasi CBT';
    const nomorPeserta = matchingStudent?.nomorPeserta || `26-${activePacket.jenjang}-SIM`;
    const scheduleId = matchingSchedule?.id || 'sch-sim';

    const liveParticipant: LiveParticipant = {
      studentId,
      studentName,
      nomorPeserta,
      kelas: matchingStudent?.kelas || activePacket.kelas,
      status: isLockedByAntiCheat ? 'MELANGGAR' : 'MENGERJAKAN',
      answeredCount: answeredTotalCount,
      totalQuestions: activePacket.questions.length,
      remainingMinutes: Math.max(1, Math.ceil(secondsLeft / 60)),
      violations: violationCount,
      ipAddress: '192.168.10.88 (Live Tab)',
      lastActivity: isLockedByAntiCheat
        ? 'Terkunci Anti-Cheat (Pindah Tab)'
        : `Menjawab ${answeredTotalCount}/${activePacket.questions.length} soal`,
    };

    const delayMs =
      answeredTotalCount === 0 || violationCount > 0 || isLockedByAntiCheat
        ? 100
        : 1800 + Math.floor(Math.random() * 600);
    const timer = setTimeout(() => {
      publishLiveSyncEvent({
        type: 'STUDENT_PROGRESS',
        scheduleId,
        packetId: activePacket.id,
        participant: liveParticipant,
        timestamp: Date.now(),
      });
    }, delayMs);
    return () => clearTimeout(timer);
  }, [
    hasStarted,
    isSubmitted,
    answeredTotalCount,
    violationCount,
    isLockedByAntiCheat,
    activePacket?.id,
  ]);

  if (!activePacket) return null;

  // SCREEN 1: PRE-EXAM LOBBY
  if (!hasStarted) {
    return (
      <PortalLobbyScreen
        packets={packets}
        selectedPacketId={selectedPacketId}
        onSelectPacketId={setSelectedPacketId}
        activePacket={activePacket}
        matchingStudent={matchingStudent}
        tokenInput={tokenInput}
        onChangeTokenInput={setTokenInput}
        onStartExam={() => {
          setCurrentIndex(0);
          setIsSubmitted(false);
          setHasStarted(true);
        }}
        onExitPortal={onExitPortal}
      />
    );
  }

  // SCREEN 2: EXAM RESULT SUMMARY AFTER SUBMIT
  if (isSubmitted && lastSubmission) {
    return (
      <PortalResultReview
        lastSubmission={lastSubmission}
        activePacket={activePacket}
        onRetryOtherPacket={() => {
          setHasStarted(false);
          setIsSubmitted(false);
        }}
        onExitPortal={onExitPortal}
      />
    );
  }

  // SCREEN 3: ACTIVE CBT WORKSPACE
  const currentQuestion = activePacket.questions[currentIndex] || activePacket.questions[0];

  const displayedAnnouncement = liveAnnouncement ?? matchingSchedule?.announcement;

  return (
    <div className="space-y-4">
      {proctorToast && (
        <div className="rounded-2xl bg-[#14B894] text-white px-4 py-3 flex items-center justify-between gap-3 text-xs font-extrabold shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 shrink-0" />
            <span>{proctorToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setProctorToast(null)}
            className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[11px]"
          >
            Tutup
          </button>
        </div>
      )}

      {displayedAnnouncement && (
        <div className="rounded-2xl bg-[#FFF4D6] border border-[#F59E0B] px-4 py-3 flex items-center gap-3 text-xs text-[#1E1645] shadow-sm">
          <Megaphone className="w-4 h-4 text-[#D97706] shrink-0" />
          <div>
            <strong className="font-extrabold">Pengumuman Pengawas Ruang: </strong>
            <span>{displayedAnnouncement}</span>
          </div>
        </div>
      )}

      {/* Top Exam Status Bar */}
      <div className="rounded-[24px] bg-[#211955] text-white px-6 py-4 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-extrabold text-[#F8B478]">
            {activePacket.jenjang}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold leading-tight">
                {activePacket.title}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#14B894]/25 text-[#55E5C7] text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14B894] animate-ping" />
                <span>LIVE SYNC</span>
              </span>
            </div>
            <p className="text-[11px] text-indigo-200">
              Peserta: {matchingStudent?.nama} ({matchingStudent?.nomorPeserta})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 text-xs">
            {(['normal', 'large', 'xlarge'] as const).map((scale, idx) => (
              <button
                key={scale}
                onClick={() => setFontScale(scale)}
                className={`px-2.5 py-1 rounded-lg font-bold ${
                  fontScale === scale ? 'bg-white text-[#211955]' : 'text-indigo-200'
                }`}
              >
                {idx === 0 ? 'A-' : idx === 1 ? 'A' : 'A+'}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            title="Mode Layar Penuh (Fullscreen)"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8B478] text-[#1E1645] font-mono font-extrabold text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          <button
            onClick={onExitPortal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Simulasi</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Question Canvas + Right Number Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {currentQuestion && (
          <ActiveQuestionCanvas
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={activePacket.questions.length}
            fontScale={fontScale}
            pgAnswers={pgAnswers}
            onSelectPg={(qId, label) => setPgAnswers({ ...pgAnswers, [qId]: label })}
            pgkAnswers={pgkAnswers}
            onTogglePgk={togglePgkOption}
            bsAnswers={bsAnswers}
            onSelectBs={(qId, val) => setBsAnswers({ ...bsAnswers, [qId]: val })}
            matchingAnswers={matchingAnswers}
            onSelectMatch={(qId, pairId, rightText) =>
              setMatchingAnswers((prev) => ({
                ...prev,
                [qId]: { ...(prev[qId] || {}), [pairId]: rightText },
              }))
            }
            esaiAnswers={esaiAnswers}
            onChangeEsai={(qId, val) => setEsaiAnswers({ ...esaiAnswers, [qId]: val })}
            doubtFlags={doubtFlags}
            onToggleDoubt={(qId) =>
              setDoubtFlags((prev) => ({ ...prev, [qId]: !prev[qId] }))
            }
            onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            onNext={() =>
              setCurrentIndex((i) => Math.min(activePacket.questions.length - 1, i + 1))
            }
            onOpenConfirmSubmit={() => setShowConfirmSubmitModal(true)}
          />
        )}

        <QuestionMatrixSidebar
          activePacket={activePacket}
          currentIndex={currentIndex}
          onSelectIndex={setCurrentIndex}
          isQuestionAnswered={isQuestionAnswered}
          doubtFlags={doubtFlags}
          answeredTotalCount={answeredTotalCount}
          doubtTotalCount={doubtTotalCount}
          unansweredTotalCount={unansweredTotalCount}
          violationCount={violationCount}
          onOpenConfirmSubmit={() => setShowConfirmSubmitModal(true)}
        />
      </div>

      {showConfirmSubmitModal && (
        <ConfirmSubmitModal
          answeredTotalCount={answeredTotalCount}
          doubtTotalCount={doubtTotalCount}
          unansweredTotalCount={unansweredTotalCount}
          onClose={() => setShowConfirmSubmitModal(false)}
          onConfirmFinish={handleFinishExam}
        />
      )}

      {isLockedByAntiCheat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-elevated rounded-[28px] max-w-md w-full p-6 shadow-floating border-2 border-[#D93834] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#D93834] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-text-main">
              Sesi Ujian Terkunci Otomatis (Anti-Cheat)
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Sistem mendeteksi Anda berpindah tab atau keluar dari jendela ujian sebanyak{' '}
              <strong className="text-[#D93834]">{violationCount}x</strong> (Batas maksimal:{' '}
              {maxViolationsAllowed}x). Status Anda kini ditandai{' '}
              <strong className="text-[#D93834]">TERKUNCI / MELANGGAR</strong> di layar Pengawas
              Ruang.
            </p>
            <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle text-xs text-left space-y-1">
              <div className="font-extrabold text-text-main">Cara Membuka Kunci:</div>
              <div className="text-text-muted">
                1. Hubungi Pengawas Ruang atau buka tab <strong>Jadwal &amp; Live Proctoring</strong>{' '}
                lalu klik tombol <strong>Buka Kunci</strong> pada nama Anda.
              </div>
              <div className="text-text-muted">
                2. Atau gunakan tombol simulasi darurat di bawah ini:
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViolationCount(0)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-extrabold transition"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Kunci Simulasi (Reset Pelanggaran)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
