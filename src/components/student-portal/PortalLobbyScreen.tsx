import React from 'react';
import { ArrowLeft, KeyRound, Sparkles, UserCheck } from 'lucide-react';
import { ExamPacket, Student } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface PortalLobbyScreenProps {
  packets: ExamPacket[];
  selectedPacketId: string;
  onSelectPacketId: (id: string) => void;
  activePacket: ExamPacket;
  matchingStudent?: Student;
  tokenInput: string;
  onChangeTokenInput: (val: string) => void;
  onStartExam: () => void;
  onExitPortal: () => void;
}

export const PortalLobbyScreen: React.FC<PortalLobbyScreenProps> = ({
  packets,
  selectedPacketId,
  onSelectPacketId,
  activePacket,
  matchingStudent,
  tokenInput,
  onChangeTokenInput,
  onStartExam,
  onExitPortal,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-[28px] bg-[#211955] text-white p-7 shadow-floating flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#F8B478] text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal Ujian Santri / Siswa — JN ExamCBTCore</span>
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Simulasi &amp; Ruang Ujian Berbasis Komputer
          </h1>
          <p className="text-xs text-indigo-200">
            Pilih paket ujian lintas jenjang (MTs, Aliyah, Wustho, atau &apos;Ulya) untuk menguji
            tampilan soal siswa secara langsung.
          </p>
        </div>
        <button
          onClick={onExitPortal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>

      {/* Choose Jenjang Packet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {packets.map((pkt) => {
          const meta = JENJANG_META[pkt.jenjang];
          const isSelected = pkt.id === selectedPacketId;
          return (
            <div
              key={pkt.id}
              onClick={() => onSelectPacketId(pkt.id)}
              className={`cursor-pointer rounded-[24px] bg-elevated p-5 border transition-all ${
                isSelected
                  ? 'border-[var(--brand-text-accent)] ring-2 ring-indigo-500/20 shadow-floating'
                  : 'border-border-subtle/70 shadow-card hover:border-[var(--brand-text-accent)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
                  style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                >
                  {meta.fullLabel}
                </span>
                <span className="text-xs font-mono font-bold text-text-muted">
                  {pkt.questions.length} Soal • KKM {pkt.kkm}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-text-main mt-2.5">
                {pkt.title}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {pkt.mapel} • Kelas {pkt.kelas} • Opsi A–{pkt.optionCount === 5 ? 'E' : 'D'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Student Identity & Token Verification Card */}
      <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 text-xs">
          <div className="inline-flex items-center gap-2 font-extrabold text-[#087963]">
            <UserCheck className="w-4 h-4" />
            <span>Peserta Terverifikasi Otomatis (Mode Demo):</span>
          </div>
          <div className="text-base font-extrabold text-text-main">
            {matchingStudent?.nama || 'Santri Simulasi CBT'} (
            {matchingStudent?.nomorPeserta || `26-${activePacket.jenjang.toUpperCase()}-SIM`})
          </div>
          <div className="text-text-muted">
            Jenjang {JENJANG_META[activePacket.jenjang].fullLabel} • Kelas {activePacket.kelas} •
            Token Aktif: <strong className="font-mono text-text-main">{tokenInput}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle">
            <KeyRound className="w-4 h-4 text-[#B85D19]" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => onChangeTokenInput(e.target.value.toUpperCase())}
              className="w-24 bg-transparent font-mono font-extrabold text-sm text-text-main focus:outline-none"
            />
          </div>
          <button
            onClick={onStartExam}
            className="px-6 py-3 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-extrabold transition shadow-md"
          >
            Mulai Kerjakan Ujian &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
