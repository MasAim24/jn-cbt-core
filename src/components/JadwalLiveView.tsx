import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  ExamPacket,
  ExamSchedule,
  JenjangFilter,
  LiveParticipant,
  ParticipantLiveStatus,
} from '../types/cbt';
import { JENJANG_META } from '../data/initialData';
import { ScheduleCardGrid } from './jadwal/ScheduleCardGrid';
import { LiveProctorTable } from './jadwal/LiveProctorTable';
import { NewScheduleModal } from './jadwal/NewScheduleModal';
import { publishLiveSyncEvent } from '../utils/liveProctorSync';

interface JadwalLiveViewProps {
  schedules: ExamSchedule[];
  packets: ExamPacket[];
  selectedJenjang: JenjangFilter;
  onSelectJenjang: (j: JenjangFilter) => void;
  onSaveSchedule: (schedule: ExamSchedule) => void;
  onDeleteSchedule?: (scheduleId: string) => void;
  onRefreshToken: (scheduleId: string) => void;
  onOpenStudentSim: (packetId: string) => void;
}

export const JadwalLiveView: React.FC<JadwalLiveViewProps> = ({
  schedules,
  packets,
  selectedJenjang,
  onSelectJenjang,
  onSaveSchedule,
  onDeleteSchedule,
  onRefreshToken,
  onOpenStudentSim,
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(schedules[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [participantFilter, setParticipantFilter] = useState<'ALL' | ParticipantLiveStatus>('ALL');
  const [participantSearch, setParticipantSearch] = useState('');
  const [broadcastInput, setBroadcastInput] = useState('');

  // New schedule form state
  const [packetId, setPacketId] = useState(packets[0]?.id || '');
  const [kelasTarget, setKelasTarget] = useState('VIII-A & VIII-B');
  const [tanggal, setTanggal] = useState('2026-11-04');
  const [waktuMulai, setWaktuMulai] = useState('07:30');
  const [waktuSelesai, setWaktuSelesai] = useState('09:00');
  const [durasiMenit, setDurasiMenit] = useState(90);
  const [ruang, setRuang] = useState('Lab CBT Utama — Jabal Nur');
  const [pengawas, setPengawas] = useState('Pengawas Ruang CBT');
  const [totalPeserta] = useState(0);
  const [acakSoal, setAcakSoal] = useState(true);
  const [acakOpsi, setAcakOpsi] = useState(true);

  const filteredSchedules = schedules.filter((s) =>
    selectedJenjang === 'ALL' ? true : s.jenjang === selectedJenjang
  );

  const activeSchedule =
    filteredSchedules.find((s) => s.id === selectedScheduleId) ||
    filteredSchedules[0] ||
    schedules[0];

  const filteredParticipants = (activeSchedule?.liveParticipants || []).filter((p) => {
    const matchStatus = participantFilter === 'ALL' ? true : p.status === participantFilter;
    const matchSearch =
      !participantSearch.trim() ||
      p.studentName.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.nomorPeserta.toLowerCase().includes(participantSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCopyToken = (id: string, token: string) => {
    navigator.clipboard?.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleCycleScheduleStatus = (sch: ExamSchedule) => {
    const nextStatus =
      sch.status === 'LIVE' ? 'COMPLETED' : sch.status === 'COMPLETED' ? 'UPCOMING' : 'LIVE';
    onSaveSchedule({ ...sch, status: nextStatus });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchedule) return;
    const nextAnnouncement = broadcastInput.trim() || undefined;
    onSaveSchedule({
      ...activeSchedule,
      announcement: nextAnnouncement,
    });
    publishLiveSyncEvent({
      type: 'PROCTOR_BROADCAST',
      scheduleId: activeSchedule.id,
      packetId: activeSchedule.packetId,
      announcement: nextAnnouncement,
      timestamp: Date.now(),
    });
    setBroadcastInput('');
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPacket = packets.find((p) => p.id === packetId) || packets[0];
    if (!chosenPacket) return;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randToken = Array.from({ length: 6 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');

    const created: ExamSchedule = {
      id: `sch-${Date.now()}`,
      packetId: chosenPacket.id,
      packetTitle: chosenPacket.title,
      mapel: chosenPacket.mapel,
      jenjang: chosenPacket.jenjang,
      kelasTarget,
      tanggal,
      waktuMulai,
      waktuSelesai,
      durasiMenit: Number(durasiMenit) || 90,
      token: randToken,
      ruang,
      pengawas,
      status: 'LIVE',
      acakSoal,
      acakOpsi,
      totalPeserta: Number(totalPeserta) || 0,
      hadirCount: 0,
      selesaiCount: 0,
      liveParticipants: [],
    };

    onSaveSchedule(created);
    setSelectedScheduleId(created.id);
    setShowAddModal(false);
  };

  const handleParticipantAction = (
    participant: LiveParticipant,
    action: 'RESET_LOGIN' | 'ADD_TIME' | 'FORCE_SUBMIT'
  ) => {
    if (!activeSchedule) return;
    const updatedList = activeSchedule.liveParticipants.map((p) => {
      if (p.studentId !== participant.studentId) return p;
      if (action === 'RESET_LOGIN') {
        return {
          ...p,
          status: 'MENGERJAKAN' as const,
          violations: 0,
          lastActivity: 'Login direset Pengawas',
        };
      }
      if (action === 'ADD_TIME') {
        return {
          ...p,
          remainingMinutes: p.remainingMinutes + 15,
          lastActivity: '+15 Menit diberikan',
        };
      }
      return {
        ...p,
        status: 'SELESAI' as const,
        answeredCount: p.totalQuestions,
        remainingMinutes: 0,
        lastActivity: 'Diselesaikan Pengawas',
      };
    });

    onSaveSchedule({
      ...activeSchedule,
      liveParticipants: updatedList,
    });

    publishLiveSyncEvent({
      type: 'PROCTOR_ACTION',
      scheduleId: activeSchedule.id,
      packetId: activeSchedule.packetId,
      studentId: participant.studentId,
      nomorPeserta: participant.nomorPeserta,
      action,
      addedMinutes: action === 'ADD_TIME' ? 15 : undefined,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-elevated p-5 rounded-[24px] shadow-card border border-border-subtle/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-[#087963]">
              <span className="w-2 h-2 rounded-full bg-[#14B894] animate-pulse" />
              <span>Live Proctoring &amp; Token Server</span>
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-text-main mt-1">
            Jadwal Ujian, Token &amp; Ruang Pengawas CBT
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'MTs', 'MA', 'Wustho', 'Ulya'] as JenjangFilter[]).map((j) => (
            <button
              key={j}
              onClick={() => onSelectJenjang(j)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedJenjang === j
                  ? 'bg-[#211955] text-white'
                  : 'bg-surface text-text-muted hover:text-text-main border border-border-subtle'
              }`}
            >
              {j === 'ALL' ? 'Semua' : JENJANG_META[j].shortLabel}
            </button>
          ))}

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F8B478] hover:bg-[#f3a35c] text-[#1E1645] text-xs font-extrabold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Jadwal &amp; Sesi Baru</span>
          </button>
        </div>
      </div>

      <ScheduleCardGrid
        schedules={filteredSchedules}
        totalSchedulesCount={schedules.length}
        activeScheduleId={activeSchedule?.id}
        copiedId={copiedId}
        onSelectScheduleId={setSelectedScheduleId}
        onCycleStatus={handleCycleScheduleStatus}
        onCopyToken={handleCopyToken}
        onRefreshToken={onRefreshToken}
        onDeleteSchedule={onDeleteSchedule}
        onOpenStudentSim={onOpenStudentSim}
      />

      {activeSchedule && (
        <LiveProctorTable
          activeSchedule={activeSchedule}
          filteredParticipants={filteredParticipants}
          participantFilter={participantFilter}
          onChangeParticipantFilter={setParticipantFilter}
          participantSearch={participantSearch}
          onChangeParticipantSearch={setParticipantSearch}
          broadcastInput={broadcastInput}
          onChangeBroadcastInput={setBroadcastInput}
          onSendBroadcast={handleSendBroadcast}
          onClearBroadcast={() => {
            onSaveSchedule({ ...activeSchedule, announcement: undefined });
            publishLiveSyncEvent({
              type: 'PROCTOR_BROADCAST',
              scheduleId: activeSchedule.id,
              packetId: activeSchedule.packetId,
              announcement: undefined,
              timestamp: Date.now(),
            });
          }}
          onParticipantAction={handleParticipantAction}
        />
      )}

      {showAddModal && (
        <NewScheduleModal
          packets={packets}
          packetId={packetId}
          setPacketId={setPacketId}
          kelasTarget={kelasTarget}
          setKelasTarget={setKelasTarget}
          tanggal={tanggal}
          setTanggal={setTanggal}
          waktuMulai={waktuMulai}
          setWaktuMulai={setWaktuMulai}
          waktuSelesai={waktuSelesai}
          setWaktuSelesai={setWaktuSelesai}
          durasiMenit={durasiMenit}
          setDurasiMenit={setDurasiMenit}
          ruang={ruang}
          setRuang={setRuang}
          pengawas={pengawas}
          setPengawas={setPengawas}
          acakSoal={acakSoal}
          setAcakSoal={setAcakSoal}
          acakOpsi={acakOpsi}
          setAcakOpsi={setAcakOpsi}
          onSubmit={handleCreateSchedule}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
