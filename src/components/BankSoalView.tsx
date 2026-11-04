import React, { useState } from 'react';
import {
  Copy,
  FileUp,
  MonitorPlay,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import {
  ExamPacket,
  JenjangFilter,
  Question,
  QuestionType,
  SchoolSettings,
} from '../types/cbt';
import { INITIAL_SETTINGS, JENJANG_META } from '../data/initialData';
import { PacketListSidebar } from './bank-soal/PacketListSidebar';
import { QuestionCardItem } from './bank-soal/QuestionCardItem';
import { QuestionEditorModal } from './bank-soal/QuestionEditorModal';
import { BulkImportQuestionModal, NewPacketModal } from './bank-soal/BankSoalModals';
import { CornerTableSticker } from './common/CornerStickerBadge';
import { OfficialPdfModal } from './common/OfficialPdfModal';
import { AuthenticatedSession } from './auth/LoginPortalView';

interface BankSoalViewProps {
  packets: ExamPacket[];
  settings?: SchoolSettings;
  selectedJenjang: JenjangFilter;
  onSelectJenjang: (j: JenjangFilter) => void;
  onSavePacket: (packet: ExamPacket) => void;
  onDeletePacket: (packetId: string) => void;
  onOpenStudentSim: (packetId: string) => void;
  authSession?: AuthenticatedSession | null;
}

export const BankSoalView: React.FC<BankSoalViewProps> = ({
  packets,
  settings = INITIAL_SETTINGS,
  selectedJenjang,
  onSelectJenjang,
  onSavePacket,
  onDeletePacket,
  onOpenStudentSim,
  authSession,
}) => {
  const [activePacketId, setActivePacketId] = useState<string>(packets[0]?.id || '');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'ALL' | QuestionType>('ALL');
  const [questionSearch, setQuestionSearch] = useState('');
  const [showNewPacketModal, setShowNewPacketModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showPdfNaskahModal, setShowPdfNaskahModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [bulkText, setBulkText] = useState('');

  const filteredPackets = packets.filter((p) =>
    selectedJenjang === 'ALL' ? true : p.jenjang === selectedJenjang
  );

  const activePacket =
    filteredPackets.find((p) => p.id === activePacketId) || filteredPackets[0] || packets[0];

  const displayedQuestions = (activePacket?.questions || []).filter((q) => {
    const matchType = questionTypeFilter === 'ALL' ? true : q.type === questionTypeFilter;
    const matchSearch =
      !questionSearch.trim() ||
      q.prompt.toLowerCase().includes(questionSearch.toLowerCase()) ||
      (q.arabicPrompt && q.arabicPrompt.includes(questionSearch)) ||
      (q.kitabReference &&
        q.kitabReference.toLowerCase().includes(questionSearch.toLowerCase()));
    return matchType && matchSearch;
  });

  const handleDuplicatePacket = (pkt: ExamPacket) => {
    const cloned: ExamPacket = {
      ...pkt,
      id: `pkt-${Date.now()}`,
      code: `${pkt.code}-COPY`,
      title: `${pkt.title} (Salinan)`,
      updatedAt: 'Baru saja',
      questions: pkt.questions.map((q, idx) => ({
        ...q,
        id: `q-${Date.now()}-${idx}`,
      })),
    };
    onSavePacket(cloned);
    setActivePacketId(cloned.id);
  };

  const handleSaveQuestion = (newQ: Question) => {
    if (!activePacket) return;
    const updatedQuestions = editingQuestion
      ? activePacket.questions.map((item) => (item.id === editingQuestion.id ? newQ : item))
      : [...activePacket.questions, newQ];

    onSavePacket({
      ...activePacket,
      updatedAt: 'Baru saja',
      questions: updatedQuestions.map((item, idx) => ({ ...item, nomor: idx + 1 })),
    });
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!activePacket) return;
    const remaining = activePacket.questions
      .filter((q) => q.id !== questionId)
      .map((q, idx) => ({ ...q, nomor: idx + 1 }));
    onSavePacket({
      ...activePacket,
      updatedAt: 'Baru saja',
      questions: remaining,
    });
  };

  const handleBulkImport = (imported: Question[]) => {
    if (!activePacket) return;
    onSavePacket({
      ...activePacket,
      updatedAt: 'Baru saja (Import Massal)',
      questions: [...activePacket.questions, ...imported].map((q, idx) => ({
        ...q,
        nomor: idx + 1,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-elevated p-5 rounded-[24px] shadow-card border border-border-subtle/60">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-[#211955] whitespace-nowrap">
              Multi-Jenjang &amp; Kitab Ready
            </span>
            <span className="text-xs text-text-muted font-medium">
              PG • PG Kompleks • Benar/Salah • Esai/Tarkib
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-text-main mt-1">
            Bank Soal &amp; Paket Ujian CBT
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'MTs', 'MA', 'Wustho', 'Ulya'] as JenjangFilter[]).map((j) => (
            <button
              key={j}
              onClick={() => onSelectJenjang(j)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedJenjang === j
                  ? 'bg-[#211955] text-white shadow-sm'
                  : 'bg-surface text-text-muted hover:text-text-main border border-border-subtle'
              }`}
            >
              {j === 'ALL' ? 'Semua' : JENJANG_META[j].shortLabel}
            </button>
          ))}

          <button
            onClick={() => setShowNewPacketModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F8B478] hover:bg-[#f3a35c] text-[#1E1645] text-xs font-extrabold whitespace-nowrap transition shadow-sm"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Paket Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Packet Selector (4 cols) + Right Question List & Editor (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <PacketListSidebar
          packets={filteredPackets}
          activePacketId={activePacket?.id || ''}
          onSelectPacket={setActivePacketId}
        />

        {/* Right column: Active Packet Details & Questions */}
        {activePacket ? (
          <div className="lg:col-span-8 space-y-5">
            {/* Packet Header Card */}
            <div className="relative overflow-hidden rounded-[24px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
              <CornerTableSticker
                type="bank-soal"
                glowTone="indigo-gold"
                position="bottom-right"
                sizeClass="w-28 h-28 sm:w-32 sm:h-32"
                opacityClass="opacity-85"
              />
              {/* Row 1: Badges + Secondary Icon Actions */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-extrabold whitespace-nowrap"
                    style={{
                      backgroundColor: JENJANG_META[activePacket.jenjang].badgeBg,
                      color: JENJANG_META[activePacket.jenjang].badgeText,
                    }}
                  >
                    {JENJANG_META[activePacket.jenjang].fullLabel}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-surface border border-border-subtle text-[11px] font-mono font-bold text-text-muted whitespace-nowrap">
                    {activePacket.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-surface border border-border-subtle text-xs font-bold text-text-muted whitespace-nowrap">
                    KKM: {activePacket.kkm}
                  </span>
                </div>

                <div className="no-print flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDuplicatePacket(activePacket)}
                    title="Duplikat Paket Soal"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface hover:bg-indigo-50 text-text-muted hover:text-text-main border border-border-subtle text-[11px] font-bold transition whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Duplikat</span>
                  </button>
                  <button
                    onClick={() => setShowPdfNaskahModal(true)}
                    title="Output PDF Murni & Cetak Naskah Soal + Kunci Jawaban (A4)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface hover:bg-indigo-50 text-text-muted hover:text-text-main border border-border-subtle text-[11px] font-bold transition whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">PDF Naskah A4</span>
                  </button>
                  {packets.length > 1 && (
                    <button
                      onClick={() => onDeletePacket(activePacket.id)}
                      title="Hapus Paket Soal"
                      className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#D93834] transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Full-Width Title & Metadata */}
              <div className="relative z-10">
                <h2 className="text-lg sm:text-xl font-extrabold text-text-main leading-snug">
                  {activePacket.title}
                </h2>
                <p className="text-xs text-text-muted font-medium mt-1 leading-relaxed">
                  <span>Mapel: </span>
                  <strong className="text-text-main">{activePacket.mapel}</strong>
                  <span className="mx-2">•</span>
                  <span>Kelas / Marhalah: </span>
                  <strong className="text-text-main">{activePacket.kelas}</strong>
                  <span className="mx-2">•</span>
                  <span>Pengampu: </span>
                  <strong className="text-text-main">{activePacket.guruNama}</strong>
                </p>
              </div>

              {/* Row 3: Primary Action Toolbar */}
              <div className="relative z-10 no-print flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle/60">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenStudentSim(activePacket.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-xs font-extrabold whitespace-nowrap transition"
                  >
                    <MonitorPlay className="w-3.5 h-3.5 shrink-0 optical-play-icon" />
                    <span>Simulasi CBT</span>
                  </button>
                  <button
                    onClick={() => {
                      setBulkText(
                        'Apa hukum melaksanakan shalat berjamaah lima waktu menurut jumhur ulama Syafi’iyyah? | صَلَاةُ الْجَمَاعَةِ سُنَّةٌ مُؤَكَّدَةٌ أَوْ فَرْضُ كِفَايَةٍ | Fardhu Kifayah bagi laki-laki mukim | Makruh | Mubah | Haram | A'
                      );
                      setShowBulkImportModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#B85D19] text-xs font-extrabold whitespace-nowrap transition"
                    title="Import & Export Kolektif Bank Soal (CSV / JSON / Copy-Paste)"
                  >
                    <FileUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Import / Export (CSV/JSON)</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowQuestionModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white text-xs font-extrabold whitespace-nowrap transition shadow-sm"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Tambah Butir Soal</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border-subtle text-xs w-full sm:w-auto">
                  <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Cari kata kunci / matan..."
                    className="bg-transparent text-text-main focus:outline-none w-full sm:w-44"
                  />
                </div>
              </div>

              {/* Row 4: Filter Tipe Soal */}
              <div className="relative z-10 no-print flex flex-wrap items-center gap-1.5 text-xs">
                {(
                  [
                    { id: 'ALL', label: `Semua Soal (${activePacket.questions.length})` },
                    { id: 'PG', label: 'Pilihan Ganda' },
                    { id: 'PG_KOMPLEKS', label: 'PG Kompleks' },
                    { id: 'BENAR_SALAH', label: 'Benar/Salah' },
                    { id: 'ESAI', label: 'Esai/Tarkib' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setQuestionTypeFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                      questionTypeFilter === tab.id
                        ? 'bg-[#211955] text-white'
                        : 'bg-surface text-text-muted hover:text-text-main'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {displayedQuestions.map((q) => (
                <QuestionCardItem
                  key={q.id}
                  question={q}
                  onEdit={(item) => {
                    setEditingQuestion(item);
                    setShowQuestionModal(true);
                  }}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {activePacket && (
        <>
          <BulkImportQuestionModal
            isOpen={showBulkImportModal}
            activePacket={activePacket}
            bulkText={bulkText}
            onChangeBulkText={setBulkText}
            onClose={() => setShowBulkImportModal(false)}
            onImportQuestions={handleBulkImport}
          />

          <QuestionEditorModal
            isOpen={showQuestionModal}
            activePacket={activePacket}
            editingQuestion={editingQuestion}
            onClose={() => {
              setShowQuestionModal(false);
              setEditingQuestion(null);
            }}
            onSaveQuestion={handleSaveQuestion}
          />

          <OfficialPdfModal
            isOpen={showPdfNaskahModal}
            onClose={() => setShowPdfNaskahModal(false)}
            docType="NASKAH_SOAL"
            settings={settings}
            selectedJenjang={selectedJenjang}
            packet={activePacket}
          />
        </>
      )}

      <NewPacketModal
        isOpen={showNewPacketModal}
        onClose={() => setShowNewPacketModal(false)}
        onCreatePacket={(created) => {
          const finalPacket =
            authSession?.role === 'guru' && authSession.name
              ? { ...created, guruNama: created.guruNama || authSession.name }
              : created;
          onSavePacket(finalPacket);
          setActivePacketId(finalPacket.id);
        }}
      />
    </div>
  );
};
