import React from 'react';
import { QrCode } from 'lucide-react';
import { JenjangFilter, SchoolSettings, Student } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface ExamCardPrintTabProps {
  students: Student[];
  settings: SchoolSettings;
}

export const ExamCardPrintTab: React.FC<ExamCardPrintTabProps> = ({
  students,
  settings,
}) => {
  return (
    <div className="rounded-[26px] bg-white text-slate-900 p-6 shadow-card border border-border-subtle/60">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {students.map((s) => {
          const meta = JENJANG_META[s.jenjang];
          return (
            <div
              key={s.id}
              className="border-2 border-slate-800 rounded-2xl p-4 break-inside-avoid bg-white"
            >
              {/* Header Kartu */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2.5 mb-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                    {settings.namaYayasan}
                  </div>
                  <div className="text-xs font-extrabold text-[#211955]">
                    KARTU PESERTA UJIAN CBT — {meta.fullLabel.toUpperCase()}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600">
                    Tahun Pelajaran {settings.tahunAjaran} ({settings.semester})
                  </div>
                </div>
                <div
                  className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold"
                  style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                >
                  {s.jenjang}
                </div>
              </div>

              {/* Body Kartu */}
              <div className="grid grid-cols-12 gap-3 items-center text-xs">
                <div className="col-span-8 space-y-1.5">
                  <div className="flex items-start">
                    <span className="w-28 shrink-0 text-slate-500 font-semibold">
                      Nama Peserta
                    </span>
                    <span className="mr-1.5 font-bold text-slate-500 shrink-0">:</span>
                    <span className="font-extrabold text-slate-900 min-w-0 break-words">
                      {s.nama}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-28 shrink-0 text-slate-500 font-semibold">
                      Nomor CBT
                    </span>
                    <span className="mr-1.5 font-bold text-slate-500 shrink-0">:</span>
                    <span className="font-mono font-extrabold text-[#211955]">
                      {s.nomorPeserta}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-28 shrink-0 text-slate-500 font-semibold">
                      Kelas/Marhalah
                    </span>
                    <span className="mr-1.5 font-bold text-slate-500 shrink-0">:</span>
                    <span className="font-bold text-slate-800">{s.kelas}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-28 shrink-0 text-slate-500 font-semibold">
                      Ruang / Sesi
                    </span>
                    <span className="mr-1.5 font-bold text-slate-500 shrink-0">:</span>
                    <span className="font-semibold text-slate-800 min-w-0 break-words">
                      {s.ruang} ({s.sesi})
                    </span>
                  </div>
                  <div className="flex items-center pt-0.5">
                    <span className="w-28 shrink-0 text-slate-500 font-semibold">
                      PIN Sesi CBT
                    </span>
                    <span className="mr-1.5 font-bold text-slate-500 shrink-0">:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-400 font-mono font-extrabold text-slate-900">
                      {s.pin}
                    </span>
                  </div>
                </div>

                {/* Simulated QR & Stamp Box */}
                <div className="col-span-4 flex flex-col items-center justify-center border border-slate-300 rounded-xl p-2 bg-slate-50 text-center">
                  <QrCode className="w-12 h-12 text-[#211955]" />
                  <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">
                    VERIFIED CBT
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-600">
                <span>Harap dibawa selama pelaksanaan ujian berlangsung</span>
                <span className="font-bold text-slate-800">
                  Ketua Panitia: {settings.ketuaPanitia}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AttendancePrintTabProps {
  students: Student[];
  settings: SchoolSettings;
  selectedJenjang: JenjangFilter;
}

export const AttendancePrintTab: React.FC<AttendancePrintTabProps> = ({
  students,
  settings,
  selectedJenjang,
}) => {
  return (
    <div className="rounded-[26px] bg-white text-slate-900 p-8 shadow-card border border-border-subtle/60 space-y-6">
      <div className="text-center border-b-2 border-slate-900 pb-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
          {settings.namaYayasan}
        </h2>
        <h1 className="text-lg font-extrabold uppercase text-slate-900 mt-0.5">
          DAFTAR HADIR &amp; BERITA ACARA PELAKSANAAN UJIAN CBT ({settings.namaAplikasi})
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Jenjang:{' '}
          {selectedJenjang === 'ALL'
            ? 'MTs • Madrasah Aliyah • Wustho • ’Ulya'
            : JENJANG_META[selectedJenjang].fullLabel}{' '}
          • Tahun Ajaran {settings.tahunAjaran} ({settings.semester})
        </p>
      </div>

      <table className="w-full border-collapse border border-slate-800 text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-900">
            <th className="border border-slate-800 py-2 px-3 w-10 text-center">No</th>
            <th className="border border-slate-800 py-2 px-3">Nomor Peserta</th>
            <th className="border border-slate-800 py-2 px-3">Nama Lengkap Santri/Siswa</th>
            <th className="border border-slate-800 py-2 px-3">Jenjang / Kelas</th>
            <th className="border border-slate-800 py-2 px-3">Ruang</th>
            <th className="border border-slate-800 py-2 px-3 w-40">Tanda Tangan</th>
            <th className="border border-slate-800 py-2 px-3 w-28">Ket.</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, idx) => (
            <tr key={s.id}>
              <td className="border border-slate-800 py-2.5 px-3 text-center font-bold">
                {idx + 1}
              </td>
              <td className="border border-slate-800 py-2.5 px-3 font-mono font-bold">
                {s.nomorPeserta}
              </td>
              <td className="border border-slate-800 py-2.5 px-3 font-semibold">{s.nama}</td>
              <td className="border border-slate-800 py-2.5 px-3">
                {s.jenjang} — {s.kelas}
              </td>
              <td className="border border-slate-800 py-2.5 px-3">{s.ruang}</td>
              <td className="border border-slate-800 py-2.5 px-3 text-slate-500">
                {idx % 2 === 0 ? `${idx + 1}. ..............` : `.............. ${idx + 1}.`}
              </td>
              <td className="border border-slate-800 py-2.5 px-3 text-center">Hadir</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-slate-800">
        <div>
          <p className="font-bold">Catatan Berita Acara Pengawas Ruang:</p>
          <div className="mt-2 h-20 border border-dashed border-slate-400 rounded-lg p-2 text-[11px] text-slate-500">
            Pelaksanaan ujian berjalan tertib dan lancar tanpa kendala teknis.
          </div>
        </div>
        <div className="flex justify-around text-center pt-2">
          <div>
            <p>Pengawas Ruang CBT,</p>
            <div className="h-14" />
            <p className="font-bold underline">( ........................................ )</p>
          </div>
          <div>
            <p>Ketua Panitia Ujian,</p>
            <div className="h-14" />
            <p className="font-bold underline">{settings.ketuaPanitia}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
