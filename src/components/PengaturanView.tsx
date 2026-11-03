import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  RotateCcw,
  Save,
  ShieldCheck,
  Sliders,
  Upload,
} from 'lucide-react';
import { SchoolSettings } from '../types/cbt';
import { CornerTableSticker } from './common/CornerStickerBadge';

interface PengaturanViewProps {
  settings: SchoolSettings;
  onSaveSettings: (next: SchoolSettings) => void;
  onResetDemoData: () => void;
  onExportFullBackup: () => void;
  onImportFullBackup?: (jsonData: any) => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  onSaveSettings,
  onResetDemoData,
  onExportFullBackup,
  onImportFullBackup,
}) => {
  const [form, setForm] = useState<SchoolSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportFullBackup) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        onImportFullBackup(parsed);
        if (parsed.settings) {
          setForm(parsed.settings);
        }
        setRestoreNotice('Backup JSON berhasil dipulihkan!');
        setTimeout(() => setRestoreNotice(null), 3000);
      } catch {
        setRestoreNotice('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-elevated p-5 rounded-[24px] shadow-card border border-border-subtle/60">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-[#211955]">
            Konfigurasi Sistem &amp; Multi-Jenjang
          </span>
          <h1 className="text-xl font-extrabold text-text-main mt-1">
            Pengaturan Lembaga, Keamanan CBT &amp; Sinkronisasi Database
          </h1>
          {restoreNotice && (
            <p className="text-xs font-extrabold text-[#087963] mt-1">{restoreNotice}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#087963] text-xs font-extrabold whitespace-nowrap transition"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span>Restore JSON</span>
          </button>
          <button
            type="button"
            onClick={onExportFullBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-indigo-50 text-text-main text-xs font-bold border border-border-subtle whitespace-nowrap transition"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Backup JSON</span>
          </button>
          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#D93834] text-xs font-bold whitespace-nowrap transition"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Data Awal</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left: Identitas Madrasah & Pimpinan 4 Jenjang */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
          <CornerTableSticker
            type="pengaturan"
            glowTone="royal-teal"
            position="bottom-right"
            sizeClass="w-32 h-32 sm:w-40 sm:h-40"
            opacityClass="opacity-80"
          />
          <h2 className="relative z-10 text-base font-extrabold text-text-main flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--brand-text-accent)]" />
            <span>Identitas Yayasan &amp; Pimpinan 4 Jenjang</span>
          </h2>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="font-bold text-text-main block mb-1">
                Nama Yayasan / Pondok Pesantren
              </label>
              <input
                type="text"
                value={form.namaYayasan}
                onChange={(e) => setForm({ ...form, namaYayasan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>

            <div>
              <label className="font-bold text-text-main block mb-1">Nama Aplikasi CBT</label>
              <input
                type="text"
                value={form.namaAplikasi}
                onChange={(e) => setForm({ ...form, namaAplikasi: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-text-main block mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={form.tahunAjaran}
                  onChange={(e) => setForm({ ...form, tahunAjaran: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
              <div>
                <label className="font-bold text-text-main block mb-1">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) =>
                    setForm({ ...form, semester: e.target.value as 'Ganjil' | 'Genap' })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-text-main block mb-1">
                Kepala Madrasah Tsanawiyah (MTs)
              </label>
              <input
                type="text"
                value={form.kepalaMTs}
                onChange={(e) => setForm({ ...form, kepalaMTs: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>

            <div>
              <label className="font-bold text-text-main block mb-1">
                Kepala Madrasah Aliyah (MA)
              </label>
              <input
                type="text"
                value={form.kepalaMA}
                onChange={(e) => setForm({ ...form, kepalaMA: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>

            <div>
              <label className="font-bold text-text-main block mb-1">
                Mudir PDF / Diniyah Wustho
              </label>
              <input
                type="text"
                value={form.mudirWustho}
                onChange={(e) => setForm({ ...form, mudirWustho: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>

            <div>
              <label className="font-bold text-text-main block mb-1">
                Mudir PDF / Ma&apos;had &apos;Ulya
              </label>
              <input
                type="text"
                value={form.mudirUlya}
                onChange={(e) => setForm({ ...form, mudirUlya: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-text-main block mb-1">
                Ketua Panitia Ujian Terpadu
              </label>
              <input
                type="text"
                value={form.ketuaPanitia}
                onChange={(e) => setForm({ ...form, ketuaPanitia: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-main"
              />
            </div>
          </div>
        </div>

        {/* Right: Anti-Cheat & Database Connector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-4">
            <h2 className="text-base font-extrabold text-text-main flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#14B894]" />
              <span>Keamanan &amp; Anti-Cheat Ujian</span>
            </h2>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface cursor-pointer">
              <div>
                <div className="font-bold text-text-main">Wajib Layar Penuh (Fullscreen)</div>
                <div className="text-[11px] text-text-muted">
                  Beri peringatan otomatis saat santri keluar mode layar penuh
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.antiCheatFullscreen}
                onChange={(e) =>
                  setForm({ ...form, antiCheatFullscreen: e.target.checked })
                }
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface cursor-pointer">
              <div>
                <div className="font-bold text-text-main">Deteksi Pindah Tab / Jendela</div>
                <div className="text-[11px] text-text-muted">
                  Catat pelanggaran ke Ruang Pengawas jika membuka tab lain
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.antiCheatBlockTabSwitch}
                onChange={(e) =>
                  setForm({ ...form, antiCheatBlockTabSwitch: e.target.checked })
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Batas Pelanggaran
                </label>
                <input
                  type="number"
                  value={form.maxViolationsAllowed}
                  onChange={(e) =>
                    setForm({ ...form, maxViolationsAllowed: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
              <div>
                <label className="font-bold text-text-main block mb-1">
                  Rotasi Token (Menit)
                </label>
                <input
                  type="number"
                  value={form.autoRotateTokenMinutes}
                  onChange={(e) =>
                    setForm({ ...form, autoRotateTokenMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[26px] bg-elevated p-6 shadow-card border border-border-subtle/60 space-y-3.5">
            <h2 className="text-base font-extrabold text-text-main flex items-center gap-2">
              <Database className="w-4 h-4 text-[#F59E0B]" />
              <span>Penyimpanan Lokal &amp; Konektor Supabase</span>
            </h2>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Seluruh perubahan tersimpan otomatis di browser (LocalStorage). Anda juga dapat
              menghubungkan ke instance Supabase madrasah kapan saja.
            </p>
            <div>
              <label className="font-bold text-text-main block mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={form.supabaseUrl}
                onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-text-main block mb-1">Supabase Anon Key</label>
              <input
                type="password"
                value={form.supabaseAnonKey}
                onChange={(e) => setForm({ ...form, supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-subtle text-text-main font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedNotice ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#087963]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pengaturan berhasil disimpan!</span>
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#211955] hover:bg-[#2d2270] text-white font-extrabold transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
