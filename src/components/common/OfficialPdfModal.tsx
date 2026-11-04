import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck2,
  Printer,
  X,
} from 'lucide-react';
import {
  ExamPacket,
  ExamSubmission,
  JenjangFilter,
  SchoolSettings,
  Student,
} from '../../types/cbt';
import {
  buildPurePdfBlobFromCanvases,
  OfficialPdfDocType,
  renderKartuPesertaPages,
  renderLegerNilaiPages,
  renderNaskahSoalPages,
  renderPresensiBeritaAcaraPages,
  renderRekapNilaiPages,
} from '../../utils/purePdfEngine';

interface OfficialPdfModalProps {
  isOpen: boolean;
  docType: OfficialPdfDocType;
  onClose: () => void;
  settings: SchoolSettings;
  selectedJenjang: JenjangFilter;
  students?: Student[];
  submissions?: ExamSubmission[];
  packet?: ExamPacket;
}

const DOC_META: Record<
  OfficialPdfDocType,
  { title: string; subtitle: string; filenamePrefix: string }
> = {
  KARTU_PESERTA: {
    title: 'Kartu Peserta & PIN Sesi Ujian CBT (A4)',
    subtitle: 'Dokumen resmi kartu peserta ber-QR Code siap gunting (6 Kartu / Halaman A4)',
    filenamePrefix: 'Kartu_Peserta_CBT',
  },
  PRESENSI_BERITA_ACARA: {
    title: 'Daftar Hadir & Berita Acara Pelaksanaan CBT (A4)',
    subtitle: 'Dokumen presensi ruang ujian dengan kolom tanda tangan zig-zag & pengesahan panitia',
    filenamePrefix: 'Daftar_Hadir_Berita_Acara_CBT',
  },
  REKAP_NILAI: {
    title: 'Laporan Resmi Rekapitulasi Nilai & Ketuntasan KKM (A4)',
    subtitle: 'Dokumen rekapitulasi skor objektif, esai/tarkib, dan pengesahan Pimpinan Madrasah',
    filenamePrefix: 'Rekap_Nilai_Resmi_CBT',
  },
  LEGER_NILAI: {
    title: 'Leger Nilai Kolektif, Peringkat Paralel & Analisis Daya Serap (A4)',
    subtitle: 'Dokumen pemeringkatan akademik santri/siswa beserta matriks predikat taqdir & daya serap',
    filenamePrefix: 'Leger_Nilai_Peringkat_CBT',
  },
  NASKAH_SOAL: {
    title: 'Naskah Soal Ujian & Kunci Jawaban Resmi (A4)',
    subtitle: 'Arsip naskah soal bilingual (Matan Arab RTL & Indonesia) beserta kunci & pembahasan',
    filenamePrefix: 'Naskah_Soal_CBT',
  },
};

const EMPTY_STUDENTS: Student[] = [];
const EMPTY_SUBMISSIONS: ExamSubmission[] = [];

export const OfficialPdfModal: React.FC<OfficialPdfModalProps> = ({
  isOpen,
  docType,
  onClose,
  settings,
  selectedJenjang,
  students = EMPTY_STUDENTS,
  submissions = EMPTY_SUBMISSIONS,
  packet,
}) => {
  const [pageCanvases, setPageCanvases] = useState<HTMLCanvasElement[]>([]);
  const [pageDataUrls, setPageDataUrls] = useState<string[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const latestPropsRef = useRef({
    students,
    submissions,
    packet,
    settings,
    selectedJenjang,
  });
  latestPropsRef.current = {
    students,
    submissions,
    packet,
    settings,
    selectedJenjang,
  };

  useEffect(() => {
    if (!isOpen) return;
    setIsGenerating(true);
    setCurrentPageIdx(0);

    const timer = setTimeout(() => {
      try {
        const {
          students: curStudents,
          submissions: curSubmissions,
          packet: curPacket,
          settings: curSettings,
          selectedJenjang: curJenjang,
        } = latestPropsRef.current;

        let rendered: HTMLCanvasElement[] = [];
        if (docType === 'KARTU_PESERTA') {
          rendered = renderKartuPesertaPages(curStudents, curSettings, curJenjang);
        } else if (docType === 'PRESENSI_BERITA_ACARA') {
          rendered = renderPresensiBeritaAcaraPages(curStudents, curSettings, curJenjang);
        } else if (docType === 'REKAP_NILAI') {
          rendered = renderRekapNilaiPages(curSubmissions, curSettings, curJenjang);
        } else if (docType === 'LEGER_NILAI') {
          rendered = renderLegerNilaiPages(curSubmissions, curSettings, curJenjang);
        } else if (docType === 'NASKAH_SOAL' && curPacket) {
          rendered = renderNaskahSoalPages(curPacket, curSettings);
        }

        setPageCanvases(rendered);
        setPageDataUrls(rendered.map((c) => c.toDataURL('image/jpeg', 0.92)));
      } catch (err) {
        console.error('Gagal menyusun halaman PDF A4:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 30);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    docType,
    selectedJenjang,
    students.length,
    submissions.length,
    packet?.id,
    packet?.questions.length,
    settings.namaYayasan,
  ]);

  if (!isOpen) return null;

  const meta = DOC_META[docType];

  const handleDownloadPurePdf = () => {
    if (pageCanvases.length === 0) return;
    const blob = buildPurePdfBlobFromCanvases(pageCanvases);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const suffix =
      docType === 'NASKAH_SOAL' && packet ? packet.code : selectedJenjang;
    link.download = `${meta.filenamePrefix}_${suffix}_${settings.tahunAjaran.replace('/', '-')}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const handleIsolatedA4Print = () => {
    if (pageDataUrls.length === 0) return;

    // Remove any existing hidden print iframe
    const existingFrame = document.getElementById('jn-cbt-a4-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'jn-cbt-a4-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc) {
      handleDownloadPurePdf();
      return;
    }

    const imgsHtml = pageDataUrls
      .map(
        (src) =>
          `<div class="a4-page"><img src="${src}" alt="Halaman A4 Resmi" /></div>`
      )
      .join('');

    frameDoc.open();
    frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${meta.title} — ${settings.namaYayasan}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #ffffff;
      font-family: sans-serif;
    }
    .a4-page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .a4-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .a4-page img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  </style>
</head>
<body>
  ${imgsHtml}
</body>
</html>`);
    frameDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        handleDownloadPurePdf();
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-elevated rounded-[28px] max-w-5xl w-full p-4 sm:p-6 shadow-floating border border-border-subtle flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#211955] text-[#F8B478] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#087963] text-[10px] font-extrabold uppercase tracking-wider">
                  Pure PDF ISO-32000 Engine • Standar A4 Resmi
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-text-main mt-0.5">
                {meta.title}
              </h3>
              <p className="text-xs text-text-muted">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleIsolatedA4Print}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-indigo-50 text-text-main border border-border-subtle text-xs font-extrabold transition"
            >
              <Printer className="w-4 h-4 text-[#211955]" />
              <span>Cetak ke Printer (A4)</span>
            </button>

            <button
              onClick={handleDownloadPurePdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14B894] hover:bg-[#0b987c] text-white text-xs font-extrabold transition shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File PDF Murni (.pdf)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface text-text-muted hover:text-text-main transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center A4 Document Sheet Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-200/80 dark:bg-slate-900/80 rounded-2xl my-4 p-4 sm:p-6 flex flex-col items-center justify-start">
          {isGenerating ? (
            <div className="py-24 text-center space-y-2">
              <div className="w-10 h-10 rounded-full border-4 border-[#211955] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-text-main">
                Menyusun Tata Letak Dokumen Resmi A4 &amp; Kop Surat...
              </p>
            </div>
          ) : (
            pageDataUrls[currentPageIdx] && (
              <div className="w-full max-w-[680px] bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-300">
                <img
                  src={pageDataUrls[currentPageIdx]}
                  alt={`Pratinjau Halaman ${currentPageIdx + 1}`}
                  className="w-full h-auto block"
                />
              </div>
            )
          )}
        </div>

        {/* Bottom Pagination Controls */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="font-semibold text-text-muted">
            Ukuran Kertas: <strong>A4 Portrait (210 × 297 mm)</strong> • Resolusi Cetak Tinggi
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPageIdx === 0}
              onClick={() => setCurrentPageIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-border-subtle font-bold text-text-main disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-[#211955] text-white font-mono font-extrabold">
              Halaman {currentPageIdx + 1} / {Math.max(1, pageDataUrls.length)}
            </span>
            <button
              disabled={currentPageIdx >= pageDataUrls.length - 1}
              onClick={() =>
                setCurrentPageIdx((i) => Math.min(pageDataUrls.length - 1, i + 1))
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-border-subtle font-bold text-text-main disabled:opacity-40"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
