import React, { useEffect, useState } from 'react';

export type StickerType =
  | 'cbt-hero'
  | 'token-live'
  | 'bank-soal'
  | 'peserta-kartu'
  | 'rekap-nilai'
  | 'pengaturan';

const STICKER_PATHS: Record<StickerType, string> = {
  'cbt-hero': '/stickers/cbt-hero.jpg',
  'token-live': '/stickers/token-live.jpg',
  'bank-soal': '/stickers/bank-soal.jpg',
  'peserta-kartu': '/stickers/peserta-kartu.jpg',
  'rekap-nilai': '/stickers/rekap-nilai.jpg',
  pengaturan: '/stickers/pengaturan.jpg',
};

const processedStickerCache: Partial<Record<StickerType, string>> = {};

/**
 * Removes the outer pure-white square canvas around the die-cut sticker's drop shadow
 * while preserving the crisp white die-cut sticker contour around the 3D illustration.
 */
function processDieCutSticker(src: string, key: StickerType): Promise<string> {
  if (processedStickerCache[key]) {
    return Promise.resolve(processedStickerCache[key]!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 360;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;
        const visited = new Uint8Array(size * size);
        const queue = new Int32Array(size * size);
        let head = 0;
        let tail = 0;

        const push = (x: number, y: number) => {
          const idx = y * size + x;
          if (!visited[idx]) {
            visited[idx] = 1;
            queue[tail++] = idx;
          }
        };

        for (let x = 0; x < size; x++) {
          push(x, 0);
          push(x, size - 1);
        }
        for (let y = 0; y < size; y++) {
          push(0, y);
          push(size - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          const p = idx * 4;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];

          // Outer canvas background is pure white (>= 248); die-cut drop shadow is ~220-245
          if (r >= 248 && g >= 248 && b >= 248) {
            data[p + 3] = 0;
            const x = idx % size;
            const y = (idx / size) | 0;
            if (x + 1 < size) push(x + 1, y);
            if (x - 1 >= 0) push(x - 1, y);
            if (y + 1 < size) push(x, y + 1);
            if (y - 1 >= 0) push(x, y - 1);
          } else if (r >= 242 && g >= 242 && b >= 242) {
            // Soften outer edge of the sticker shadow for smooth anti-aliasing
            data[p + 3] = Math.round(((248 - Math.min(r, g, b)) / 6) * 180);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        processedStickerCache[key] = dataUrl;
        resolve(dataUrl);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

interface DieCutStickerImageProps {
  type: StickerType;
  alt?: string;
  className?: string;
}

export const DieCutStickerImage: React.FC<DieCutStickerImageProps> = ({
  type,
  alt = 'Ilustrasi Menu CBT',
  className = 'w-28 h-28',
}) => {
  const rawSrc = STICKER_PATHS[type];
  const [src, setSrc] = useState<string>(processedStickerCache[type] || rawSrc);

  useEffect(() => {
    let mounted = true;
    processDieCutSticker(rawSrc, type).then((res) => {
      if (mounted) setSrc(res);
    });
    return () => {
      mounted = false;
    };
  }, [rawSrc, type]);

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`select-none object-contain drop-shadow-[0_10px_20px_rgba(33,25,85,0.22)] transition-transform duration-300 ${className}`}
    />
  );
};

interface CornerTableStickerProps {
  type: StickerType;
  glowTone?: 'indigo-gold' | 'emerald-indigo' | 'amber-indigo' | 'royal-teal';
  position?: 'top-right' | 'bottom-right';
  sizeClass?: string;
  opacityClass?: string;
}

const GLOW_STYLES: Record<
  NonNullable<CornerTableStickerProps['glowTone']>,
  { primary: string; secondary: string }
> = {
  'indigo-gold': {
    primary: 'rgba(248, 180, 120, 0.34)',
    secondary: 'rgba(59, 40, 204, 0.20)',
  },
  'emerald-indigo': {
    primary: 'rgba(20, 184, 148, 0.30)',
    secondary: 'rgba(59, 40, 204, 0.20)',
  },
  'amber-indigo': {
    primary: 'rgba(245, 158, 11, 0.28)',
    secondary: 'rgba(33, 25, 85, 0.22)',
  },
  'royal-teal': {
    primary: 'rgba(85, 229, 199, 0.28)',
    secondary: 'rgba(131, 98, 255, 0.22)',
  },
};

/**
 * Renders a decorative die-cut sticker in the corner of a card or table container
 * with a soft radial ambient lighting glow behind the table/card corner.
 */
export const CornerTableSticker: React.FC<CornerTableStickerProps> = ({
  type,
  glowTone = 'indigo-gold',
  position = 'bottom-right',
  sizeClass = 'w-28 h-28 sm:w-36 sm:h-36',
  opacityClass = 'opacity-90',
}) => {
  const glow = GLOW_STYLES[glowTone];
  const isTop = position === 'top-right';

  return (
    <div
      aria-hidden="true"
      className={`no-print pointer-events-none absolute right-0 ${
        isTop ? 'top-0' : 'bottom-0'
      } z-0 overflow-hidden rounded-[inherit] inset-0`}
    >
      {/* Soft Radial Ambient Lighting Glow behind the table/card corner */}
      <div
        className={`absolute ${
          isTop ? '-top-14 -right-14' : '-bottom-16 -right-14'
        } w-64 h-64 rounded-full blur-3xl`}
        style={{
          background: `radial-gradient(circle, ${glow.primary} 0%, ${glow.secondary} 52%, transparent 75%)`,
        }}
      />
      <div
        className={`absolute ${
          isTop ? 'top-2 right-6' : 'bottom-2 right-6'
        } w-36 h-36 rounded-full blur-2xl`}
        style={{
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.65) 0%, ${glow.primary} 60%, transparent 100%)`,
        }}
      />

      {/* Die-Cut Corner Sticker Emblem */}
      <div
        className={`absolute ${
          isTop
            ? '-top-3 -right-3 sm:top-1 sm:right-2 rotate-[6deg]'
            : '-bottom-4 -right-3 sm:-bottom-3 sm:right-2 rotate-[-7deg]'
        } ${opacityClass}`}
      >
        <DieCutStickerImage type={type} className={sizeClass} />
      </div>
    </div>
  );
};
