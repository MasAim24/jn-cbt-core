import React from 'react';
import { X } from 'lucide-react';
import { SchoolSettings } from '../../types/cbt';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-elevated rounded-[26px] max-w-lg w-full p-6 shadow-floating border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-main">
            Panduan Cepat JN ExamCBTCore
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 text-xs text-text-muted leading-relaxed">
          <p>
            <strong className="text-text-main">1. Multi-Jenjang Terpadu:</strong> Gunakan tombol
            filter atau klik kartu jenjang (<strong>MTs, Aliyah, Wustho, &apos;Ulya</strong>) untuk
            menyaring bank soal, jadwal, peserta, dan rekap nilai.
          </p>
          <p>
            <strong className="text-text-main">2. Bank Soal Kitab &amp; Umum:</strong> Mendukung
            teks Arab berharakat (RTL otomatis) dengan font khusus Kitab Turats serta 4 tipe soal
            (PG, PG Kompleks, Benar/Salah, dan Uraian/Tarkib).
          </p>
          <p>
            <strong className="text-text-main">3. Simulasi Ujian Siswa:</strong> Klik tombol{' '}
            <em>Simulasi Ujian Siswa</em> untuk merasakan langsung pengalaman santri mengerjakan
            soal CBT hingga nilai otomatis masuk ke menu Rekap Nilai.
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#211955] text-white text-xs font-extrabold"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppFooter: React.FC<{ settings: SchoolSettings }> = ({ settings }) => (
  <footer className="no-print pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted border-t border-border-subtle/50">
    <div>
      <strong>{settings.namaAplikasi}</strong> — {settings.namaYayasan}
    </div>
    <div className="flex items-center gap-3">
      <span>MTs • Madrasah Aliyah • PDF Wustho • PDF &apos;Ulya</span>
    </div>
  </footer>
);
