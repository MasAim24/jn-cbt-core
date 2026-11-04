import React from 'react';
import { X } from 'lucide-react';
import { ExamPacket } from '../../types/cbt';

interface NewScheduleModalProps {
  packets: ExamPacket[];
  packetId: string;
  setPacketId: (v: string) => void;
  kelasTarget: string;
  setKelasTarget: (v: string) => void;
  tanggal: string;
  setTanggal: (v: string) => void;
  waktuMulai: string;
  setWaktuMulai: (v: string) => void;
  waktuSelesai: string;
  setWaktuSelesai: (v: string) => void;
  durasiMenit: number;
  setDurasiMenit: (v: number) => void;
  ruang: string;
  setRuang: (v: string) => void;
  pengawas: string;
  setPengawas: (v: string) => void;
  acakSoal: boolean;
  setAcakSoal: (v: boolean) => void;
  acakOpsi: boolean;
  setAcakOpsi: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({
  packets,
  packetId,
  setPacketId,
  kelasTarget,
  setKelasTarget,
  tanggal,
  setTanggal,
  waktuMulai,
  setWaktuMulai,
  waktuSelesai,
  setWaktuSelesai,
  durasiMenit,
  setDurasiMenit,
  ruang,
  setRuang,
  pengawas,
  setPengawas,
  acakSoal,
  setAcakSoal,
  acakOpsi,
  setAcakOpsi,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-lg w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            Jadwalkan Sesi Ujian CBT Baru
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-text-main block mb-1">
              Pilih Paket Bank Soal
            </label>
            <select
              value={packetId}
              onChange={(e) => setPacketId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-bold"
            >
              {packets.length === 0 && (
                <option value="">
                  -- Belum ada Paket Soal (Buat di menu Bank Soal terlebih dahulu) --
                </option>
              )}
              {packets.map((pkt) => (
                <option key={pkt.id} value={pkt.id}>
                  [{pkt.jenjang}] {pkt.title} ({pkt.mapel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">
                Kelas / Marhalah Sasaran
              </label>
              <input
                type="text"
                value={kelasTarget}
                onChange={(e) => setKelasTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Tanggal Ujian</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Jam Mulai</label>
              <input
                type="time"
                value={waktuMulai}
                onChange={(e) => setWaktuMulai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Jam Selesai</label>
              <input
                type="time"
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Durasi (Menit)</label>
              <input
                type="number"
                value={durasiMenit}
                onChange={(e) => setDurasiMenit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-main block mb-1">Ruang Lab / Aula</label>
              <input
                type="text"
                value={ruang}
                onChange={(e) => setRuang(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Pengawas Ruang</label>
              <input
                type="text"
                value={pengawas}
                onChange={(e) => setPengawas(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acakSoal}
                onChange={(e) => setAcakSoal(e.target.checked)}
              />
              <span className="font-semibold text-text-main">Acak Urutan Soal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acakOpsi}
                onChange={(e) => setAcakOpsi(e.target.checked)}
              />
              <span className="font-semibold text-text-main">Acak Opsi Jawaban</span>
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface text-text-muted font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#211955] text-white font-extrabold"
            >
              Terbitkan Jadwal &amp; Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
