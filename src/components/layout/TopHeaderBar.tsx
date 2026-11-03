import React, { useState } from 'react';
import { Bell, ChevronDown, Film, LogOut, Moon, Search, Sun } from 'lucide-react';
import {
  ExamPacket,
  JenjangFilter,
  NavTab,
  Student,
  UserRole,
} from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';
import { AuthenticatedSession } from '../auth/LoginPortalView';

interface TopHeaderBarProps {
  packets: ExamPacket[];
  students: Student[];
  selectedJenjang: JenjangFilter;
  onSelectJenjang: (j: JenjangFilter) => void;
  onNavigateTab: (tab: NavTab) => void;
  userRole: UserRole;
  onSetUserRole: (role: UserRole) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenShowcase?: () => void;
  authSession?: AuthenticatedSession | null;
  onLogout?: () => void;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  packets,
  students,
  selectedJenjang,
  onSelectJenjang,
  onNavigateTab,
  userRole,
  onSetUserRole,
  darkMode,
  onToggleDarkMode,
  onOpenShowcase,
  authSession,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const searchResults =
    searchQuery.trim().length > 1
      ? [
          ...packets
            .filter(
              (p) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.mapel.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((p) => ({
              id: p.id,
              label: `[Bank Soal ${p.jenjang}] ${p.title}`,
              action: () => {
                onSelectJenjang(p.jenjang);
                onNavigateTab('bank-soal');
                setSearchQuery('');
              },
            })),
          ...students
            .filter(
              (s) =>
                s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.nomorPeserta.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((s) => ({
              id: s.id,
              label: `[Santri ${s.jenjang}] ${s.nama} (${s.nomorPeserta})`,
              action: () => {
                onSelectJenjang(s.jenjang);
                onNavigateTab('peserta-kartu');
                setSearchQuery('');
              },
            })),
        ].slice(0, 6)
      : [];

  return (
    <header className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Search Input Pill (matching "Search services..." in reference image) */}
      <div className="relative flex-1 max-w-md">
        <div className="flex items-center gap-2.5 bg-elevated rounded-2xl px-4 py-2.5 shadow-card border border-border-subtle/60 focus-within:border-[var(--brand-text-accent)]">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari paket soal, santri, jadwal ujian..."
            className="w-full bg-transparent text-xs font-medium text-text-main focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-text-muted hover:text-text-main"
            >
              ✕
            </button>
          )}
        </div>

        {/* Instant Search Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-elevated shadow-floating border border-border-subtle p-2 z-40 space-y-1">
            {searchResults.map((res) => (
              <button
                key={res.id}
                onClick={res.action}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface text-xs font-bold text-text-main transition"
              >
                {res.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: 4-Jenjang Quick Pill + Theme Toggle + Bell + Profile Dropdown */}
      <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
        {/* Quick Switcher 4 Jenjang */}
        <div className="hidden xl:flex items-center gap-1 bg-elevated p-1 rounded-2xl border border-border-subtle/60 shadow-card text-xs">
          {(['ALL', 'MTs', 'MA', 'Wustho', 'Ulya'] as JenjangFilter[]).map((j) => (
            <button
              key={j}
              onClick={() => onSelectJenjang(j)}
              className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition ${
                selectedJenjang === j
                  ? 'bg-[#211955] text-white'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {j === 'ALL' ? 'Semua Jenjang' : JENJANG_META[j].shortLabel}
            </button>
          ))}
        </div>

        {/* Motion Graphics Community Video Showcase Button */}
        {onOpenShowcase && (
          <button
            onClick={onOpenShowcase}
            title="Putar & Rekam Video Generative Motion Graphics (Showcase Komunitas)"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#211955] hover:bg-[#2d2270] text-[#F8B478] text-xs font-extrabold transition shadow-card whitespace-nowrap"
          >
            <Film className="w-4 h-4 shrink-0" />
            <span>Video Showcase</span>
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          className="p-2.5 rounded-2xl bg-elevated border border-border-subtle/60 text-text-main hover:border-[var(--brand-text-accent)] transition shadow-card"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-[#F8B478]" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => onNavigateTab('jadwal-live')}
          title="Notifikasi Sesi Ujian"
          className="relative p-2.5 rounded-2xl bg-elevated border border-border-subtle/60 text-text-main hover:border-[var(--brand-text-accent)] transition shadow-card"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F0544F]" />
        </button>

        {/* User Avatar & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl bg-elevated border border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)] transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F0544F] to-[#F8B478] text-white font-extrabold text-xs flex items-center justify-center shadow-sm optical-circle-overshoot">
              {authSession?.avatarInitials || (userRole === 'admin' ? 'AF' : userRole === 'guru' ? 'KL' : 'SN')}
            </div>
            <div className="text-left">
              <div className="text-xs font-extrabold text-text-main leading-none whitespace-nowrap">
                {authSession?.name ||
                  (userRole === 'admin'
                    ? 'Ust. Ahmad Fauzi'
                    : userRole === 'guru'
                    ? 'KH. Dr. Lukman'
                    : 'Mode Ujian Santri')}
              </div>
              <div className="text-[10px] font-semibold text-text-muted mt-0.5 whitespace-nowrap">
                {authSession?.badgeRole ||
                  (userRole === 'admin'
                    ? 'Operator Utama CBT'
                    : userRole === 'guru'
                    ? 'Pengawas & Guru'
                    : 'Simulasi Peserta')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-elevated shadow-floating border border-border-subtle p-2 z-50 text-xs space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-text-muted">
                Ganti Peran Cepat
              </div>
              <button
                onClick={() => {
                  onSetUserRole('admin');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl font-bold transition ${
                  userRole === 'admin'
                    ? 'bg-[#211955] text-white'
                    : 'hover:bg-surface text-text-main'
                }`}
              >
                🛡️ Admin / Operator Madrasah
              </button>
              <button
                onClick={() => {
                  onSetUserRole('guru');
                  onNavigateTab('bank-soal');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl font-bold transition ${
                  userRole === 'guru'
                    ? 'bg-[#211955] text-white'
                    : 'hover:bg-surface text-text-main'
                }`}
              >
                👨‍🏫 Portal Guru &amp; Pengawas
              </button>
              <button
                onClick={() => {
                  onSetUserRole('siswa');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl font-bold transition ${
                  userRole === 'siswa'
                    ? 'bg-[#F8B478] text-[#1E1645]'
                    : 'hover:bg-surface text-text-main'
                }`}
              >
                🎓 Layar Simulasi Ujian Siswa
              </button>

              {onLogout && (
                <>
                  <div className="my-1 border-t border-border-subtle" />
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl font-extrabold text-[#D93834] hover:bg-red-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Keluar / Portal Login Resmi</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
