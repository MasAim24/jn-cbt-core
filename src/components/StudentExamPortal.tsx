import React, { useEffect, useState } from 'react';
import {
  Clock,
  LogOut,
  Maximize2,
  Megaphone,
} from 'lucide-react';
import {
  ExamPacket,
  ExamSchedule,
  ExamSubmission,
  Question,
  Student,
} from '../types/cbt';
import { PortalLobbyScreen } from './student-portal/PortalLobbyScreen';
import { PortalResultReview } from './student-portal/PortalResultReview';
import { ActiveQuestionCanvas } from './student-portal/ActiveQuestionCanvas';
import {
  ConfirmSubmitModal,
  QuestionMatrixSidebar,
} from './student-portal/QuestionMatrixSidebar';

interface StudentExamPortalProps {
  packets: ExamPacket[];
  schedules: ExamSchedule[];
  students: Student[];
  initialPacketId?: string;
  initialStudentId?: string;
  onExitPortal: () => void;
  onSubmitExamResult: (submission: ExamSubmission) => void;
}

export const StudentExamPortal: React.FC<StudentExamPortalProps> = ({
  packets,
  schedules,
  students,
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

  const activePacket = packets.find((p) => p.id === selectedPacketId) || packets[0];
  const matchingSchedule =
    schedules.find((s) => s.packetId === activePacket?.id) || schedules[0];
  const matchingStudent =
    (initialStudentId && students.find((s) => s.id === initialStudentId)) ||
    students.find((s) => s.jenjang === activePacket?.jenjang) ||
    students[0];

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
  const [bsAnswers, setBsAnswers] = useState<Record<string, boolean>>({});
  const [esaiAnswers, setEsaiAnswers] = useState<Record<string, string>>({});
  const [doubtFlags, setDoubtFlags] = useState<Record<string, boolean>>({});
  const [lastSubmission, setLastSubmission] = useState<ExamSubmission | null>(null);

  useEffect(() => {
    if (matchingSchedule) {
      setTokenInput(matchingSchedule.token);
      setSecondsLeft(matchingSchedule.durasiMenit * 60);
    }
  }, [selectedPacketId]);

  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted]);

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

    activePacket.questions.forEach((q) => {
      if (q.type === 'PG') {
        if (pgAnswers[q.id] && pgAnswers[q.id] === q.correctAnswer) {
          pgScore += q.weight;
        }
      } else if (q.type === 'PG_KOMPLEKS') {
        const chosen = pgkAnswers[q.id] || [];
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
        if (bsAnswers[q.id] !== undefined && bsAnswers[q.id] === q.correctBoolean) {
          benarSalahScore += q.weight;
        }
      } else if (q.type === 'ESAI') {
        const ans = (esaiAnswers[q.id] || '').trim();
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
    const submission: ExamSubmission = {
      id: `sub-${Date.now()}`,
      scheduleId: matchingSchedule?.id || 'sch-sim',
      packetId: activePacket.id,
      studentId: matchingStudent?.id || 'std-sim',
      studentName: matchingStudent?.nama || 'Santri Simulasi CBT',
      nomorPeserta: matchingStudent?.nomorPeserta || `26-${activePacket.jenjang}-SIM`,
      jenjang: activePacket.jenjang,
      kelas: activePacket.kelas,
      mapel: activePacket.mapel,
      submittedAt: 'Baru saja (Simulasi Live)',
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
    };

    setShowConfirmSubmitModal(false);
    setLastSubmission(submission);
    setIsSubmitted(true);
    onSubmitExamResult(submission);
  };

  if (!activePacket) return null;

  const answeredTotalCount = activePacket.questions.filter((q) => isQuestionAnswered(q)).length;
  const unansweredTotalCount = activePacket.questions.length - answeredTotalCount;
  const doubtTotalCount = activePacket.questions.filter((q) => doubtFlags[q.id]).length;

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

  return (
    <div className="space-y-4">
      {matchingSchedule?.announcement && (
        <div className="rounded-2xl bg-[#FFF4D6] border border-[#F59E0B] px-4 py-3 flex items-center gap-3 text-xs text-[#1E1645] shadow-sm">
          <Megaphone className="w-4 h-4 text-[#D97706] shrink-0" />
          <div>
            <strong className="font-extrabold">Pengumuman Pengawas Ruang: </strong>
            <span>{matchingSchedule.announcement}</span>
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
            <h2 className="text-sm sm:text-base font-extrabold leading-tight">
              {activePacket.title}
            </h2>
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
    </div>
  );
};
