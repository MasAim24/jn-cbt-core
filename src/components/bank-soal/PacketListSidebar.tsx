import React from 'react';
import { Languages } from 'lucide-react';
import { ExamPacket } from '../../types/cbt';
import { JENJANG_META } from '../../data/initialData';

interface PacketListSidebarProps {
  packets: ExamPacket[];
  activePacketId: string;
  onSelectPacket: (packetId: string) => void;
}

export const PacketListSidebar: React.FC<PacketListSidebarProps> = ({
  packets,
  activePacketId,
  onSelectPacket,
}) => {
  return (
    <div className="no-print lg:col-span-4 space-y-3.5">
      {packets.map((pkt) => {
        const isSelected = activePacketId === pkt.id;
        const meta = JENJANG_META[pkt.jenjang];

        return (
          <div
            key={pkt.id}
            onClick={() => onSelectPacket(pkt.id)}
            className={`cursor-pointer rounded-[22px] p-4 transition-all border ${
              isSelected
                ? 'bg-[#211955] text-white border-[#211955] shadow-floating'
                : 'bg-elevated text-text-main border-border-subtle/60 shadow-card hover:border-[var(--brand-text-accent)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.16)' : meta.badgeBg,
                  color: isSelected ? '#F8B478' : meta.badgeText,
                }}
              >
                {meta.fullLabel}
              </span>
              <span
                className={`text-[11px] font-mono font-bold whitespace-nowrap ${
                  isSelected ? 'text-indigo-200' : 'text-text-muted'
                }`}
              >
                {pkt.code}
              </span>
            </div>

            <h3 className="text-sm font-extrabold mt-2.5 leading-snug">{pkt.title}</h3>
            <p
              className={`text-xs mt-1 leading-relaxed ${
                isSelected ? 'text-indigo-200' : 'text-text-muted'
              }`}
            >
              {pkt.mapel} • Kelas {pkt.kelas}
            </p>

            <div className="mt-3.5 pt-3 border-t border-current/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-bold">{pkt.questions.length} Butir Soal</span>
                <span>•</span>
                <span>Opsi A–{pkt.optionCount === 5 ? 'E' : 'D'}</span>
              </div>
              {pkt.hasArabicKitab && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${
                    isSelected ? 'bg-white/15 text-[#55E5C7]' : 'bg-teal-50 text-[#087963]'
                  }`}
                >
                  <Languages className="w-3 h-3 shrink-0" />
                  <span>Kitab/Arab</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
