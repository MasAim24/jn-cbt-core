import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Megaphone,
  Radio,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import {
  ExamSchedule,
  LiveParticipant,
  ParticipantLiveStatus,
} from '../../types/cbt';
import { CornerTableSticker } from '../common/CornerStickerBadge';

interface LiveProctorTableProps {
  activeSchedule: ExamSchedule;
  filteredParticipants: LiveParticipant[];
  participantFilter: 'ALL' | ParticipantLiveStatus;
  onChangeParticipantFilter: (f: 'ALL' | ParticipantLiveStatus) => void;
  participantSearch: string;
  onChangeParticipantSearch: (val: string) => void;
  broadcastInput: string;
  onChangeBroadcastInput: (val: string) => void;
  onSendBroadcast: (e: React.FormEvent) => void;
  onClearBroadcast: () => void;
  onParticipantAction: (
    participant: LiveParticipant,
    action: 'RESET_LOGIN' | 'ADD_TIME' | 'FORCE_SUBMIT' | 'RESET_SUBMIT'
  ) => void;
  onBulkAction?: (action: 'BULK_RESET_LOGIN' | 'BULK_ADD_TIME') => void;
}

export const LiveProctorTable: React.FC<LiveProctorTableProps> = ({
  activeSchedule,
  filteredParticipants,
  participantFilter,
  onChangeParticipantFilter,
  participantSearch,
  onChangeParticipantSearch,
  broadcastInput,
  onChangeBroadcastInput,
  onSendBroadcast,
  onClearBroadcast,
  onParticipantAction,
  onBulkAction,
}) => {
  return (
    <div className="relative overflow-hidden rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-5">
      <CornerTableSticker
        type="token-live"
        glowTone="emerald-indigo"
        position="bottom-right"
        sizeClass="w-32 h-32 sm:w-40 sm:h-40"
        opacityClass="opacity-80"
      />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold text-text-main flex items-center gap-2 leading-snug">
              <ShieldCheck className="w-5 h-5 text-[#14B894] shrink-0" />
              <span>Monitor Ruang Pengawas: {activeSchedule.packetTitle}</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#087963] text-[10px] font-extrabold">
              <Radio className="w-3 h-3 text-[#14B894] animate-pulse" />
              <span>SQLite LAN &amp; Live Sync Aktif</span>
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Kendalikan sesi santri secara real-time di jaringan lokal: kirim pengumuman ke layar
            siswa, buka kunci anti-cheat massal saat listrik/Wi-Fi sempat padam, atau izinkan ujian
            ulang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold shrink-0">
          {onBulkAction && (
            <>
              <button
                type="button"
                onClick={() => onBulkAction('BULK_RESET_LOGIN')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#211955] border border-indigo-200 font-extrabold whitespace-nowrap transition"
                title="Buka kunci anti-cheat seluruh peserta di ruang ini secara serentak"
              >
                <Unlock className="w-3.5 h-3.5 shrink-0" />
                <span>Buka Kunci Massal (1 Ruang)</span>
              </button>
              <button
                type="button"
                onClick={() => onBulkAction('BULK_ADD_TIME')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#B85D19] border border-amber-200 font-extrabold whitespace-nowrap transition"
                title="Tambah waktu +10 menit untuk seluruh peserta yang sedang mengerjakan di ruang ini"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>+10m Massal (1 Ruang)</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('sim_student', '1');
              url.searchParams.set('packetId', activeSchedule.packetId);
              window.open(url.toString(), '_blank');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] border border-[#14B894]/40 font-extrabold whitespace-nowrap transition"
            title="Buka tab browser baru sebagai Santri untuk menguji sinkronisasi real-time"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span>Simulasi Tab Santri</span>
          </button>
          <span className="px-3.5 py-1.5 rounded-xl bg-[#211955] text-white font-mono whitespace-nowrap">
            TOKEN AKTIF: {activeSchedule.token}
          </span>
        </div>
      </div>

      {/* Live Broadcast Announcement Bar to Student Screens */}
      <form
        onSubmit={onSendBroadcast}
        className="relative z-10 rounded-2xl bg-surface/90 backdrop-blur-xs p-3.5 border border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs"
      >
        <div className="flex items-center gap-2 text-[var(--brand-text-accent)] font-extrabold shrink-0 whitespace-nowrap">
          <Megaphone className="w-4 h-4 shrink-0" />
          <span>Siaran Pengawas:</span>
        </div>
        <input
          type="text"
          value={broadcastInput}
          onChange={(e) => onChangeBroadcastInput(e.target.value)}
          placeholder={
            activeSchedule.announcement
              ? `Aktif: "${activeSchedule.announcement}" (Ketik baru untuk mengganti)`
              : 'Ketik pengumuman / ralat soal ke layar seluruh peserta di ruang ini...'
          }
          className="flex-1 bg-elevated px-3.5 py-2 rounded-xl border border-border-subtle text-text-main focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#211955] text-white font-extrabold whitespace-nowrap"
          >
            Kirim ke Layar Siswa
          </button>
          {activeSchedule.announcement && (
            <button
              type="button"
              onClick={onClearBroadcast}
              className="px-3 py-2 rounded-xl bg-red-50 text-[#D93834] font-bold whitespace-nowrap"
            >
              Hapus
            </button>
          )}
        </div>
      </form>

      {/* Participant Status Filter & Search */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(
            [
              { id: 'ALL', label: `Semua Peserta (${activeSchedule.liveParticipants.length})` },
              { id: 'MENGERJAKAN', label: 'Sedang Mengerjakan' },
              { id: 'MELANGGAR', label: 'Terkunci / Melanggar' },
              { id: 'SELESAI', label: 'Selesai Submit' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChangeParticipantFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                participantFilter === tab.id
                  ? 'bg-[#211955] text-white'
                  : 'bg-surface text-text-muted hover:text-text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border-subtle text-xs">
          <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <input
            type="text"
            value={participantSearch}
            onChange={(e) => onChangeParticipantSearch(e.target.value)}
            placeholder="Cari nama / nomor peserta..."
            className="bg-transparent text-text-main focus:outline-none w-44"
          />
        </div>
      </div>

      <div className="relative z-10 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted uppercase text-[11px] whitespace-nowrap">
              <th className="py-3 px-3">Peserta / Santri</th>
              <th className="py-3 px-3">Kelas</th>
              <th className="py-3 px-3">Status Live</th>
              <th className="py-3 px-3">Progres Soal</th>
              <th className="py-3 px-3">Sisa Waktu</th>
              <th className="py-3 px-3">Pelanggaran</th>
              <th className="py-3 px-3 text-right">Tindakan Pengawas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {filteredParticipants.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-text-muted">
                  Belum ada peserta yang sedang aktif pada filter ini. Saat santri login dengan
                  Token Ruang <strong>{activeSchedule.token}</strong>, progres soal &amp; status
                  anti-cheat akan tampil secara otomatis di tabel ini.
                </td>
              </tr>
            )}
            {filteredParticipants.map((p) => (
              <tr key={p.studentId} className="hover:bg-surface/60 transition">
                <td className="py-3.5 px-3">
                  <div className="font-extrabold text-text-main whitespace-nowrap">
                    {p.studentName}
                  </div>
                  <div className="text-[11px] font-mono text-text-muted whitespace-nowrap">
                    {p.nomorPeserta} • IP {p.ipAddress}
                  </div>
                </td>
                <td className="py-3.5 px-3 font-semibold text-text-main whitespace-nowrap">
                  {p.kelas}
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  {p.status === 'MENGERJAKAN' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#D97706] font-extrabold text-[11px] whitespace-nowrap">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>Mengerjakan</span>
                    </span>
                  )}
                  {p.status === 'SELESAI' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-[#087963] font-extrabold text-[11px] whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>Selesai (Terkunci Submit)</span>
                    </span>
                  )}
                  {p.status === 'MELANGGAR' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-[#D93834] font-extrabold text-[11px] whitespace-nowrap">
                      <ShieldAlert className="w-3 h-3 shrink-0" />
                      <span>Terkunci (Pindah Tab)</span>
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-surface overflow-hidden shrink-0">
                      <div
                        className="h-full bg-[#3B28CC] rounded-full"
                        style={{
                          width: `${Math.round(
                            (p.answeredCount / Math.max(1, p.totalQuestions)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-text-main">
                      {p.answeredCount}/{p.totalQuestions}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 font-mono font-bold text-text-main whitespace-nowrap">
                  {p.remainingMinutes} Menit
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  {p.violations > 0 ? (
                    <span className="text-[#D93834] font-extrabold">
                      {p.violations}x Peringatan
                    </span>
                  ) : (
                    <span className="text-[#087963] font-semibold">Aman (0)</span>
                  )}
                </td>
                <td className="py-3.5 px-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    {p.status === 'SELESAI' ? (
                      <button
                        onClick={() => onParticipantAction(p, 'RESET_SUBMIT')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#087963] font-extrabold whitespace-nowrap transition"
                        title="Hapus status selesai & izinkan peserta ini mengerjakan ulang"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Izinkan Ujian Ulang</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onParticipantAction(p, 'RESET_LOGIN')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#211955] font-bold whitespace-nowrap transition"
                          title="Buka Kunci / Reset Login"
                        >
                          Buka Kunci
                        </button>
                        <button
                          onClick={() => onParticipantAction(p, 'ADD_TIME')}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#B85D19] font-bold whitespace-nowrap transition"
                          title="Tambah Waktu 15 Menit"
                        >
                          +15m
                        </button>
                        <button
                          onClick={() => onParticipantAction(p, 'FORCE_SUBMIT')}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#D93834] font-bold whitespace-nowrap transition"
                        >
                          Submit
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
