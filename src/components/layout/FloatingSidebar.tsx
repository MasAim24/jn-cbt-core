import React from 'react';
import {
  Award,
  Clock,
  HelpCircle,
  Home,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { NavTab, UserRole } from '../../types/cbt';

interface FloatingSidebarProps {
  activeTab: NavTab;
  userRole: UserRole;
  allowedTabs?: NavTab[];
  onSelectTab: (tab: NavTab) => void;
  onSetUserRole: (role: UserRole) => void;
  onOpenStudentSim: () => void;
  onOpenGuide: () => void;
  onLogout?: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Beranda Utama', icon: <Home className="w-5 h-5" /> },
  { id: 'bank-soal', label: 'Bank Soal & Kitab', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'jadwal-live', label: 'Jadwal & Token', icon: <Clock className="w-5 h-5" /> },
  { id: 'peserta-kartu', label: 'Santri & Kartu', icon: <Users className="w-5 h-5" /> },
  { id: 'rekap-nilai', label: 'Rekap Nilai', icon: <Award className="w-5 h-5" /> },
  { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
];

export const FloatingSidebar: React.FC<FloatingSidebarProps> = ({
  activeTab,
  userRole,
  allowedTabs,
  onSelectTab,
  onSetUserRole,
  onOpenStudentSim,
  onOpenGuide,
  onLogout,
}) => {
  const visibleNavItems =
    userRole === 'guru' && allowedTabs && allowedTabs.length > 0
      ? NAV_ITEMS.filter((item) => allowedTabs.includes(item.id))
      : NAV_ITEMS;

  return (
    <aside
      className="no-print sticky top-3 sm:top-4 lg:top-11 self-stretch lg:self-start lg:w-[82px] lg:h-[calc(100vh-5.5rem)] lg:max-h-[820px] shrink-0 rounded-[26px] lg:rounded-[28px] text-white flex lg:flex-col items-center justify-between lg:justify-start py-2.5 px-3 sm:px-4 lg:py-4 lg:px-0 shadow-floating z-40"
      style={{ backgroundColor: '#211955' }}
    >
      {/* Top Brand Mark (White Circle Logo + Label underneath) */}
      <button
        type="button"
        onClick={() => {
          if (userRole === 'siswa') onSetUserRole('admin');
          onSelectTab(visibleNavItems[0]?.id || 'dashboard');
        }}
        title="Beranda Utama JN ExamCBTCore"
        className="group cursor-pointer flex lg:flex-col items-center justify-center gap-2 lg:gap-1.5 lg:w-full select-none shrink-0 focus:outline-none"
      >
        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white text-[#211955] flex items-center justify-center font-black text-xs shadow-sm optical-circle-overshoot transition-transform group-hover:scale-105 overflow-hidden p-0.5">
          <img
            src={`${(import.meta as any).env?.BASE_URL || '/'}logo-jabalnur.png`}
            alt="Logo Pondok Pesantren Jabal Nur"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <span className="hidden sm:block text-[9px] font-extrabold tracking-[0.15em] uppercase text-indigo-100 leading-none">
          CBTCORE
        </span>
      </button>

      {/* Subtle Divider between Brand Mark & Navigation on Desktop */}
      <div className="hidden lg:block w-8 h-px bg-white/15 my-3 shrink-0" />

      {/* Center Navigation Icons with Signature Left-Indented Curved Cutout on Active Tab */}
      <nav
        aria-label="Navigasi Utama CBT"
        className="flex lg:flex-col items-center lg:items-stretch gap-1 sm:gap-1.5 lg:gap-1.5 lg:w-full"
      >
        {visibleNavItems.map((item) => {
          const isActive = userRole !== 'siswa' && activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (userRole === 'siswa') onSetUserRole('admin');
                onSelectTab(item.id);
              }}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative group flex items-center justify-center w-10 h-10 lg:h-11 transition-colors focus:outline-none ${
                isActive
                  ? 'sidebar-notch-active font-extrabold'
                  : 'lg:w-[50px] lg:mx-auto text-indigo-200/85 hover:text-white hover:bg-white/10 rounded-2xl'
              }`}
            >
              <span className="relative z-10 transition-transform duration-150 group-hover:scale-105">
                {item.icon}
              </span>
              {/* Tooltip on desktop hover */}
              <span className="hidden lg:group-hover:flex items-center gap-2 absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#17152B] text-white text-xs font-extrabold whitespace-nowrap shadow-floating border border-white/10 z-50 pointer-events-none">
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#F8B478]" />}
              </span>
            </button>
          );
        })}

        {/* Help '?' Button matching the '?' icon in the reference sidebar */}
        <button
          type="button"
          onClick={onOpenGuide}
          title="Panduan Singkat JN ExamCBTCore"
          aria-label="Panduan Singkat JN ExamCBTCore"
          className="relative group hidden sm:flex items-center justify-center w-10 h-10 lg:w-[50px] lg:h-11 lg:mx-auto rounded-2xl text-indigo-200/85 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
        >
          <HelpCircle className="w-5 h-5 transition-transform duration-150 group-hover:scale-105" />
          <span className="hidden lg:group-hover:flex items-center gap-2 absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#17152B] text-white text-xs font-extrabold whitespace-nowrap shadow-floating border border-white/10 z-50 pointer-events-none">
            <span>Panduan &amp; Bantuan Sistem</span>
          </span>
        </button>
      </nav>

      {/* Bottom Student Exam Mode / Logout Button anchored at bottom */}
      <div className="lg:mt-auto lg:pt-2 flex flex-col items-center lg:w-full shrink-0">
        <div className="hidden lg:block w-8 h-px bg-white/15 mb-2.5" />
        <button
          type="button"
          onClick={() => {
            if (userRole === 'siswa') {
              onSetUserRole('admin');
            } else if (onLogout) {
              onLogout();
            } else {
              onOpenStudentSim();
            }
          }}
          title={
            userRole === 'siswa'
              ? 'Kembali ke Mode Pengelola'
              : 'Keluar Sesi / Buka Portal Login Resmi'
          }
          aria-label={
            userRole === 'siswa'
              ? 'Kembali ke Mode Pengelola'
              : 'Keluar Sesi / Buka Portal Login Resmi'
          }
          className={`relative group w-10 h-10 lg:w-[50px] lg:h-11 rounded-2xl flex items-center justify-center transition-colors focus:outline-none ${
            userRole === 'siswa'
              ? 'bg-[#F8B478] text-[#1E1645] shadow-sm'
              : 'text-indigo-200/85 hover:bg-white/10 hover:text-white'
          }`}
        >
          <LogOut className="w-5 h-5 transition-transform duration-150 group-hover:scale-105" />
          <span className="hidden lg:group-hover:flex items-center gap-2 absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#17152B] text-white text-xs font-extrabold whitespace-nowrap shadow-floating border border-white/10 z-50 pointer-events-none">
            <span>
              {userRole === 'siswa'
                ? 'Keluar Mode Siswa (Ke Admin)'
                : 'Keluar Sesi / Portal Login'}
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
};
