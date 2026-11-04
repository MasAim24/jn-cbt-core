import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Edit3,
  FileSpreadsheet,
  ListChecks,
  Printer,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  ExamPacket,
  ExamSubmission,
  JenjangFilter,
  SchoolSettings,
} from '../types/cbt';
import { INITIAL_PACKETS, JENJANG_META } from '../data/initialData';
import {
  EssayGradingModal,
  RekapAnalysisGrid,
} from './rekap/RekapSubComponents';
import { ItemAnalysisSection } from './rekap/ItemAnalysisSection';
import { CornerTableSticker } from './common/CornerStickerBadge';
import { OfficialPdfModal } from './common/OfficialPdfModal';
import { OfficialPdfDocType } from '../utils/purePdfEngine';
import { AuthenticatedSession } from './auth/LoginPortalView';

interface RekapNilaiViewProps {
  submissions: ExamSubmission[];
  packets?: ExamPacket[];
  settings: SchoolSettings;
  selectedJenjang: JenjangFilter;
  onSelectJenjang: (j: JenjangFilter) => void;
  onUpdateSubmission: (updated: ExamSubmission) => void;
  onResetSubmission?: (sub: ExamSubmission) => void;
  authSession?: AuthenticatedSession | null;
}

export const RekapNilaiView: React.FC<RekapNilaiViewProps> = ({
  submissions,
  packets = INITIAL_PACKETS,
  settings,
  selectedJenjang,
  onSelectJenjang,
  onUpdateSubmission,
  onResetSubmission,
  authSession,
}) => {
  const [gradingItem, setGradingItem] = useState<ExamSubmission | null>(null);
  const [esaiPoints, setEsaiPoints] = useState<number>(25);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'REMEDIAL' | 'UNGRADED'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'TABEL' | 'ANALISIS' | 'BUTIR_SOAL'>('TABEL');
  const [pdfModalDocType, setPdfModalDocType] = useState<OfficialPdfDocType | null>(null);
  const [scopeToKelasBinaan, setScopeToKelasBinaan] = useState(true);

  const baseByJenjang = submissions.filter((s) => {
    const matchJenjang = selectedJenjang === 'ALL' ? true : s.jenjang === selectedJenjang;
    const matchWaliKelas =
      authSession?.peran === 'Wali Kelas' &&
      authSession.kelasBinaan &&
      scopeToKelasBinaan
        ? s.kelas.toLowerCase().includes(authSession.kelasBinaan.toLowerCase())
        : true;
    return matchJenjang && matchWaliKelas;
  });

  const filtered = baseByJenjang.filter((s) => {
    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PASSED'
        ? s.totalScore >= s.kkm
        : statusFilter === 'REMEDIAL'
        ? s.totalScore < s.kkm
        : !s.isEsaiGraded;
    const matchSearch =
      !searchQuery.trim() ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nomorPeserta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mapel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Statistics Calculation
  const scores = baseByJenjang.map((s) => s.totalScore);
  const avgScore =
    scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const passedCount = baseByJenjang.filter((s) => s.totalScore >= s.kkm).length;
  const passRate =
    baseByJenjang.length > 0 ? Math.round((passedCount / baseByJenjang.length) * 100) : 100;
  const ungradedCount = baseByJenjang.filter((s) => !s.isEsaiGraded).length;

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nomor Peserta',
      'Nama Santri/Siswa',
      'Jenjang',
      'Kelas/Marhalah',
      'Mata Pelajaran',
      'Skor PG',
      'Skor PG Kompleks',
      'Skor Benar/Salah',
      'Skor Esai',
      'Total Nilai',
      'KKM',
      'Status Kelulusan',
      'Waktu Submit',
    ];
    const rows = filtered.map((item, idx) => [
      idx + 1,
      `"${item.nomorPeserta}"`,
      `"${item.studentName}"`,
      item.jenjang,
      `"${item.kelas}"`,
      `"${item.mapel}"`,
      item.pgScore,
      item.pgKompleksScore,
      item.benarSalahScore,
      item.esaiScore,
      item.totalScore,
      item.kkm,
      item.totalScore >= item.kkm ? 'TUNTAS' : 'REMEDIAL',
      `"${item.submittedAt}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Nilai_JN_ExamCBTCore_${selectedJenjang}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openGradeModal = (sub: ExamSubmission) => {
    setGradingItem(sub);
    setEsaiPoints(sub.esaiScore);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingItem) return;
    const boundedEsai = Math.max(0, Math.min(30, Number(esaiPoints) || 0));
    const newTotal =
      gradingItem.pgScore +
      gradingItem.pgKompleksScore +
      gradingItem.benarSalahScore +
      boundedEsai;

    onUpdateSubmission({
      ...gradingItem,
      esaiScore: boundedEsai,
      totalScore: newTotal,
      isEsaiGraded: true,
    });
    setGradingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-elevated p-5 rounded-[24px] shadow-card border border-border-subtle/60">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-[#087963]">
            Otomatisasi Skor, Analisis Butir &amp; Koreksi Rubrik Esai
          </span>
          <h1 className="text-xl font-extrabold text-text-main mt-1">
            Rekapitulasi Nilai, Koreksi Esai &amp; Export Laporan
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14B894] hover:bg-[#0b987c] text-white text-xs font-extrabold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setPdfModalDocType('LEGER_NILAI')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8B478] hover:bg-[#f3a35c] text-[#1E1645] text-xs font-extrabold transition shadow-sm"
          >
            <Award className="w-4 h-4" />
            <span>Cetak Leger &amp; Peringkat (PDF A4)</span>
          </button>
          <button
            onClick={() => setPdfModalDocType('REKAP_NILAI')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-extrabold transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Nilai (PDF A4)</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar: Tabel Nilai vs Daya Serap vs Analisis Butir Soal */}
      <div className="no-print flex flex-wrap items-center gap-2 bg-elevated p-2 rounded-2xl shadow-card border border-border-subtle/60 text-xs">
        <button
          onClick={() => setViewMode('TABEL')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold transition ${
            viewMode === 'TABEL'
              ? 'bg-[#211955] text-white shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>1. Tabel Nilai &amp; Koreksi Esai</span>
        </button>
        <button
          onClick={() => setViewMode('ANALISIS')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold transition ${
            viewMode === 'ANALISIS'
              ? 'bg-[#211955] text-white shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>2. Analisis Daya Serap Marhalah</span>
        </button>
        <button
          onClick={() => setViewMode('BUTIR_SOAL')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold transition ${
            viewMode === 'BUTIR_SOAL'
              ? 'bg-[#211955] text-white shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>3. Analisis Butir Soal (Indeks P, Daya Pembeda D &amp; Pengecoh)</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[22px] bg-elevated p-4 shadow-card border border-border-subtle/60">
          <span className="text-xs font-semibold text-text-muted block">Rata-rata Nilai</span>
          <div className="text-2xl font-extrabold text-[var(--brand-text-accent)] mt-1">
            {avgScore}
          </div>
          <span className="text-[11px] text-text-muted">Dari {baseByJenjang.length} peserta</span>
        </div>

        <div className="rounded-[22px] bg-elevated p-4 shadow-card border border-border-subtle/60">
          <span className="text-xs font-semibold text-text-muted block">
            Tertinggi / Terendah
          </span>
          <div className="text-2xl font-extrabold text-text-main mt-1">
            {maxScore} <span className="text-sm text-text-muted font-bold">/ {minScore}</span>
          </div>
          <span className="text-[11px] text-[#087963] font-bold">Distribusi Skor Aktual</span>
        </div>

        <div className="rounded-[22px] bg-elevated p-4 shadow-card border border-border-subtle/60">
          <span className="text-xs font-semibold text-text-muted block">Ketuntasan KKM</span>
          <div className="text-2xl font-extrabold text-[#14B894] mt-1">{passRate}%</div>
          <span className="text-[11px] text-text-muted">
            {passedCount} dari {baseByJenjang.length} santri tuntas
          </span>
        </div>

        <div className="rounded-[22px] bg-elevated p-4 shadow-card border border-border-subtle/60">
          <span className="text-xs font-semibold text-text-muted block">
            Antrean Koreksi Esai
          </span>
          <div className="text-2xl font-extrabold text-[#D97706] mt-1">{ungradedCount}</div>
          <span className="text-[11px] text-text-muted">
            {ungradedCount === 0 ? 'Semua esai sudah dinilai' : 'Menunggu review pengampu'}
          </span>
        </div>
      </div>

      {/* Filter Pills & Search */}
      {authSession?.peran === 'Wali Kelas' && authSession.kelasBinaan && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 text-xs">
          <div>
            <span className="font-extrabold text-[#087963]">
              Rekap Nilai Kelas Binaan ({authSession.kelasBinaan}):
            </span>{' '}
            <span className="text-text-main">
              Menampilkan hasil nilai ujian dan leger peringkat khusus kelas binaan Anda.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScopeToKelasBinaan((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-elevated border border-border-subtle font-extrabold text-[#087963] hover:bg-surface transition"
          >
            {scopeToKelasBinaan
              ? 'Tampilkan Semua Kelas'
              : `Fokus Kelas ${authSession.kelasBinaan}`}
          </button>
        </div>
      )}

      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'MTs', 'MA', 'Wustho', 'Ulya'] as JenjangFilter[]).map((j) => (
            <button
              key={j}
              onClick={() => onSelectJenjang(j)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedJenjang === j
                  ? 'bg-[#211955] text-white'
                  : 'bg-elevated text-text-muted hover:text-text-main border border-border-subtle'
              }`}
            >
              {j === 'ALL' ? 'Semua Jenjang' : JENJANG_META[j].shortLabel}
            </button>
          ))}

          <span className="text-border-subtle">|</span>

          {(
            [
              { id: 'ALL', label: 'Semua Status' },
              { id: 'PASSED', label: 'Tuntas KKM' },
              { id: 'REMEDIAL', label: 'Remedial' },
              { id: 'UNGRADED', label: `Perlu Koreksi (${ungradedCount})` },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st.id
                  ? 'bg-[#F8B478] text-[#1E1645]'
                  : 'bg-elevated text-text-muted hover:text-text-main border border-border-subtle'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-elevated px-3.5 py-1.5 rounded-xl border border-border-subtle text-xs">
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama santri / mapel..."
            className="bg-transparent text-text-main focus:outline-none w-48"
          />
        </div>
      </div>

      {viewMode === 'ANALISIS' && <RekapAnalysisGrid submissions={submissions} />}

      {viewMode === 'BUTIR_SOAL' && (
        <ItemAnalysisSection
          packets={packets}
          submissions={submissions}
          selectedJenjang={selectedJenjang}
        />
      )}

      {/* Main Gradebook Table */}
      <div className="relative overflow-hidden rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 overflow-x-auto">
        <CornerTableSticker
          type="rekap-nilai"
          glowTone="emerald-indigo"
          position="bottom-right"
          sizeClass="w-32 h-32 sm:w-40 sm:h-40"
          opacityClass="opacity-80"
        />
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-5">
          <h2 className="text-sm font-bold uppercase">{settings.namaYayasan}</h2>
          <h1 className="text-lg font-extrabold uppercase">
            LAPORAN REKAPITULASI HASIL UJIAN CBT ({settings.namaAplikasi})
          </h1>
          <p className="text-xs">
            Tahun Ajaran {settings.tahunAjaran} — Semester {settings.semester}
          </p>
        </div>

        <table className="relative z-10 w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted uppercase text-[11px] whitespace-nowrap">
              <th className="py-3 px-3">Peserta / Santri</th>
              <th className="py-3 px-3">Jenjang &amp; Mapel</th>
              <th className="py-3 px-3 text-center">PG</th>
              <th className="py-3 px-3 text-center">PGK</th>
              <th className="py-3 px-3 text-center">B/S</th>
              <th className="py-3 px-3 text-center">Esai/Tarkib</th>
              <th className="py-3 px-3 text-center">Nilai Akhir</th>
              <th className="py-3 px-3 text-center">Status KKM</th>
              <th className="no-print py-3 px-3 text-right">Koreksi &amp; Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-xs text-text-muted">
                  Belum ada data rekap nilai ujian yang masuk pada filter ini. Nilai akan otomatis
                  masuk saat santri menyelesaikan sesi ujian CBT.
                </td>
              </tr>
            )}
            {filtered.map((sub) => {
              const meta = JENJANG_META[sub.jenjang];
              const isPassed = sub.totalScore >= sub.kkm;
              return (
                <tr key={sub.id} className="hover:bg-surface/60 transition">
                  <td className="py-3.5 px-3">
                    <div className="font-extrabold text-text-main whitespace-nowrap">
                      {sub.studentName}
                    </div>
                    <div className="text-[11px] font-mono text-text-muted whitespace-nowrap">
                      {sub.nomorPeserta} • {sub.kelas}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold mb-1 whitespace-nowrap"
                      style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                    >
                      {sub.jenjang}
                    </span>
                    <div className="font-bold text-text-main">{sub.mapel}</div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-text-main whitespace-nowrap">
                    {sub.pgScore}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-text-main whitespace-nowrap">
                    {sub.pgKompleksScore}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-text-main whitespace-nowrap">
                    {sub.benarSalahScore}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className="font-mono font-extrabold text-text-main">
                      {sub.esaiScore}
                    </span>
                    {!sub.isEsaiGraded && (
                      <span className="block text-[10px] font-extrabold text-[#D97706] whitespace-nowrap">
                        Perlu Review
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className="px-3 py-1 rounded-xl bg-[#211955] text-white font-mono font-extrabold text-sm">
                      {sub.totalScore}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {isPassed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-[#087963] font-extrabold text-[11px] whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Tuntas (&ge;{sub.kkm})</span>
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-full bg-red-50 text-[#D93834] font-extrabold text-[11px] whitespace-nowrap">
                        Remedial (&lt;{sub.kkm})
                      </span>
                    )}
                  </td>
                  <td className="no-print py-3.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openGradeModal(sub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#B85D19] font-extrabold text-xs whitespace-nowrap transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 shrink-0" />
                        <span>Nilai Esai</span>
                      </button>
                      {onResetSubmission && (
                        <button
                          onClick={() => onResetSubmission(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#D93834] font-extrabold text-xs whitespace-nowrap transition"
                          title="Hapus nilai ini & izinkan santri mengerjakan ulang paket ujian ini"
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span>Reset Ujian</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {gradingItem && (
        <EssayGradingModal
          gradingItem={gradingItem}
          esaiPoints={esaiPoints}
          setEsaiPoints={setEsaiPoints}
          onSubmit={handleSaveGrade}
          onClose={() => setGradingItem(null)}
        />
      )}

      <OfficialPdfModal
        isOpen={Boolean(pdfModalDocType)}
        onClose={() => setPdfModalDocType(null)}
        docType={pdfModalDocType || 'REKAP_NILAI'}
        settings={settings}
        selectedJenjang={selectedJenjang}
        submissions={filtered}
      />
    </div>
  );
};
