import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Film,
  Pause,
  Play,
  RotateCcw,
  Video,
  X,
} from 'lucide-react';

interface MotionGraphicsShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SceneMeta {
  id: number;
  title: string;
  subtitle: string;
  startSec: number;
  endSec: number;
  accent: string;
}

const SCENES: SceneMeta[] = [
  {
    id: 0,
    title: '01 • Intro & Identitas Sistem',
    subtitle: 'JN ExamCBTCore — Multi-Jenjang Islamic Academic CBT',
    startSec: 0,
    endSec: 5,
    accent: '#F8B478',
  },
  {
    id: 1,
    title: '02 • Arsitektur 4 Jenjang / Marhalah',
    subtitle: 'MTs • Madrasah Aliyah • PDF Wustho • Ma’had ’Ulya',
    startSec: 5,
    endSec: 10.5,
    accent: '#55E5C7',
  },
  {
    id: 2,
    title: '03 • Bank Soal Bilingual & Kitab RTL',
    subtitle: 'PG, PG Kompleks, Benar/Salah, Esai Tarkib & Virtual Harakat',
    startSec: 10.5,
    endSec: 16,
    accent: '#8362FF',
  },
  {
    id: 3,
    title: '04 • Token Kriptografi & Live Proctoring',
    subtitle: 'Radar Pengawas Real-Time, Anti-Cheat & Broadcast Layar Siswa',
    startSec: 16,
    endSec: 21.5,
    accent: '#14B894',
  },
  {
    id: 4,
    title: '05 • Portal Simulasi Ujian Santri',
    subtitle: 'Navigasi Matriks Soal, Skala Huruf Arab A+ & Timer Presisi',
    startSec: 21.5,
    endSec: 26.5,
    accent: '#F59E0B',
  },
  {
    id: 5,
    title: '06 • Kartu QR Peserta & Analitik Nilai',
    subtitle: 'Cetak Kartu PIN A4, Berita Acara & Grafik Daya Serap KKM',
    startSec: 26.5,
    endSec: 31.5,
    accent: '#F0544F',
  },
  {
    id: 6,
    title: '07 • Modular Clean Architecture & Community',
    subtitle: '34 Modul TypeScript • github.com/MasAim24/jn-cbt-core',
    startSec: 31.5,
    endSec: 36,
    accent: '#F8B478',
  },
];

const TOTAL_DURATION = 36; // seconds

// Smooth easing helpers
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const easeOutBack = (t: number) => {
  const x = clamp(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export const MotionGraphicsShowcaseModal: React.FC<MotionGraphicsShowcaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const timeRef = useRef(0);
  const playingRef = useRef(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stickerImagesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  // Preload the 6 generated sticker images for drawing inside the algorithmic canvas
  useEffect(() => {
    const keys: Record<string, string> = {
      hero: '/stickers/cbt-hero.jpg',
      token: '/stickers/token-live.jpg',
      bank: '/stickers/bank-soal.jpg',
      peserta: '/stickers/peserta-kartu.jpg',
      rekap: '/stickers/rekap-nilai.jpg',
      pengaturan: '/stickers/pengaturan.jpg',
    };
    Object.entries(keys).forEach(([k, url]) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        stickerImagesRef.current[k] = img;
      };
    });
  }, []);

  // Main 60fps Algorithmic Animation Loop
  useEffect(() => {
    if (!isOpen) return;
    let animId = 0;
    let lastTs = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      if (playingRef.current) {
        timeRef.current += dt;
        if (timeRef.current >= TOTAL_DURATION) {
          if (recorderRef.current && recorderRef.current.state === 'recording') {
            recorderRef.current.stop();
          }
          timeRef.current = 0;
        }
        setCurrentTime(timeRef.current);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawAlgorithmicShowcase(ctx, canvas.width, canvas.height, timeRef.current, stickerImagesRef.current);
        }
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  const handleStartRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;
    setRecordedUrl(null);
    chunksRef.current = [];
    timeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
    playingRef.current = true;

    const stream = canvas.captureStream(60);
    const preferredTypes = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm',
    ];
    const mimeType =
      preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 16_000_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setIsRecording(false);

      // Auto-trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `JN-ExamCBTCore-1080p-60fps-${Date.now()}.${ext}`;
      a.click();
    };

    recorderRef.current = recorder;
    recorder.start(200);
    setIsRecording(true);
  };

  const handleStopRecordingEarly = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  if (!isOpen) return null;

  const activeScene =
    SCENES.find((s) => currentTime >= s.startSec && currentTime < s.endSec) || SCENES[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#130E31] text-white rounded-[28px] max-w-6xl w-full p-4 sm:p-6 shadow-floating border border-indigo-500/30 space-y-4">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F8B478] text-[#1E1645] flex items-center justify-center font-extrabold shadow-sm">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-[#F8B478] border border-indigo-400/20">
                  Generative Motion Graphics • 60 FPS Algorithmic Engine
                </span>
                {isRecording && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[11px] font-extrabold border border-red-400/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    REC 1080p60 ({Math.round((currentTime / TOTAL_DURATION) * 100)}%)
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5">
                Video Showcase Komunitas — JN ExamCBTCore
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/JN-ExamCBTCore-Showcase-1080p-60fps.mp4"
              download="JN-ExamCBTCore-Showcase-1080p-60fps.mp4"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8B478] hover:bg-[#f5a45d] text-[#1E1645] text-xs font-extrabold transition shadow-md"
              title="Unduh langsung file video murni MP4 H.264 1920x1080 60.00 FPS Constant Frame Rate"
            >
              <Download className="w-4 h-4" />
              <span>Download Video Murni MP4 (1080p • 60 FPS)</span>
            </a>

            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14B894] hover:bg-[#0ea583] text-white text-xs font-extrabold transition shadow-md"
              >
                <Video className="w-4 h-4" />
                <span>Rekam Ulang Live (1080p60)</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecordingEarly}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F0544F] hover:bg-red-600 text-white text-xs font-extrabold transition shadow-md"
              >
                <span>Selesai &amp; Simpan Rekaman Sekarang</span>
              </button>
            )}

            {recordedUrl && (
              <a
                href={recordedUrl}
                download="JN-ExamCBTCore-Showcase-Live.webm"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Hasil Rekam</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 16:9 Widescreen 1920x1080 Algorithmic Canvas Viewport */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0D0924] border border-indigo-400/25 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full h-full object-contain block"
          />
        </div>

        {/* Timeline Controls & Scene Selector Pills */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                timeRef.current = 0;
                setCurrentTime(0);
              }}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0"
              title="Ulang dari Awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={0}
              max={TOTAL_DURATION}
              step={0.05}
              value={currentTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                timeRef.current = val;
                setCurrentTime(val);
              }}
              className="flex-1 accent-[#F8B478] cursor-pointer"
            />

            <span className="font-mono text-xs font-bold text-indigo-200 w-24 text-right shrink-0">
              {currentTime.toFixed(1)}s / {TOTAL_DURATION}s
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {SCENES.map((sc) => {
              const isActive = activeScene.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    timeRef.current = sc.startSec + 0.05;
                    setCurrentTime(sc.startSec + 0.05);
                  }}
                  className={`p-2.5 rounded-xl text-left transition border ${
                    isActive
                      ? 'bg-white/15 border-[#F8B478] shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div
                    className="text-[10px] font-extrabold truncate"
                    style={{ color: sc.accent }}
                  >
                    {sc.title}
                  </div>
                  <div className="text-[10px] text-indigo-200 truncate mt-0.5">
                    {sc.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Pure Algorithmic 60fps Canvas Renderer (1920x1080)
 * Renders all 7 scenes of JN ExamCBTCore with procedural Islamic geometry,
 * spring physics, data telemetry, and sticker emblems.
 */
function drawAlgorithmicShowcase(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  stickers: Record<string, HTMLImageElement>
) {
  ctx.save();

  // 1. Deep Royal Indigo & Warm Apricot Dynamic Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#140E36');
  bgGrad.addColorStop(0.55, '#1E164B');
  bgGrad.addColorStop(1, '#110C2D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Ambient Moving Glow Orbs
  const orb1X = W * (0.22 + 0.08 * Math.sin(t * 0.7));
  const orb1Y = H * (0.28 + 0.08 * Math.cos(t * 0.5));
  const g1 = ctx.createRadialGradient(orb1X, orb1Y, 20, orb1X, orb1Y, 540);
  g1.addColorStop(0, 'rgba(248, 180, 120, 0.20)');
  g1.addColorStop(0.5, 'rgba(131, 98, 255, 0.12)');
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const orb2X = W * (0.78 + 0.07 * Math.cos(t * 0.6));
  const orb2Y = H * (0.72 + 0.07 * Math.sin(t * 0.8));
  const g2 = ctx.createRadialGradient(orb2X, orb2Y, 20, orb2X, orb2Y, 560);
  g2.addColorStop(0, 'rgba(20, 184, 148, 0.20)');
  g2.addColorStop(0.5, 'rgba(59, 40, 204, 0.12)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // 3. Algorithmic Sacred Islamic 12-Fold Geometric Rosette (Rotating Polar Curve)
  drawIslamicGeometricMandala(ctx, W * 0.86, H * 0.2, 260, t * 0.22, 'rgba(248, 180, 120, 0.11)');
  drawIslamicGeometricMandala(ctx, W * 0.12, H * 0.82, 220, -t * 0.18, 'rgba(85, 229, 199, 0.09)');

  // 4. Subtle Perspective Grid & Floating Data Particles
  drawAlgorithmicParticles(ctx, W, H, t);

  // 5. Top Persistent Brand Telemetry Header
  drawTopHudHeader(ctx, W, t);

  // 6. Dispatch Active Scene
  if (t < 5) {
    drawScene01Intro(ctx, W, H, t / 5, stickers.hero);
  } else if (t < 10.5) {
    drawScene02FourJenjang(ctx, W, H, (t - 5) / 5.5, stickers.hero);
  } else if (t < 16) {
    drawScene03BankSoalKitab(ctx, W, H, (t - 10.5) / 5.5, stickers.bank);
  } else if (t < 21.5) {
    drawScene04LiveProctoring(ctx, W, H, (t - 16) / 5.5, stickers.token);
  } else if (t < 26.5) {
    drawScene05StudentPortal(ctx, W, H, (t - 21.5) / 5.0);
  } else if (t < 31.5) {
    drawScene06CardsAndRekap(ctx, W, H, (t - 26.5) / 5.0, stickers.peserta, stickers.rekap);
  } else {
    drawScene07ModularArchitecture(ctx, W, H, (t - 31.5) / 4.5, stickers.pengaturan);
  }

  // 7. Bottom Progress Bar & Scene Caption Strip
  drawBottomTimelineHud(ctx, W, H, t);

  ctx.restore();
}

function drawIslamicGeometricMandala(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angleOffset: number,
  strokeStyle: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleOffset);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1.6;

  const petals = 12;
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const rad = (i * Math.PI) / 180;
    const r = radius * (0.72 + 0.28 * Math.cos(petals * rad));
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Inner star polygon
  ctx.beginPath();
  for (let i = 0; i < petals; i++) {
    const a1 = (i * 2 * Math.PI) / petals;
    const a2 = (((i + 5) % petals) * 2 * Math.PI) / petals;
    ctx.moveTo(radius * 0.65 * Math.cos(a1), radius * 0.65 * Math.sin(a1));
    ctx.lineTo(radius * 0.65 * Math.cos(a2), radius * 0.65 * Math.sin(a2));
  }
  ctx.stroke();
  ctx.restore();
}

function drawAlgorithmicParticles(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.save();
  for (let i = 0; i < 28; i++) {
    const seed = i * 137.5;
    const px = ((seed * 19) % W + Math.sin(t * 0.5 + i) * 40 + W) % W;
    const py = ((seed * 31 - t * (18 + (i % 5) * 6)) % H + H) % H;
    const r = 1.8 + (i % 3) * 1.1;
    ctx.fillStyle =
      i % 3 === 0
        ? 'rgba(248, 180, 120, 0.35)'
        : i % 3 === 1
        ? 'rgba(85, 229, 199, 0.30)'
        : 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStickerWithFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  size: number,
  rotRad: number
) {
  if (!img) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotRad);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 14;
  drawRoundedRect(ctx, -size / 2, -size / 2, size, size, 38);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.clip();
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawTopHudHeader(ctx: CanvasRenderingContext2D, W: number, t: number) {
  ctx.save();
  drawRoundedRect(ctx, 72, 42, W - 144, 68, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Brand Badge
  drawRoundedRect(ctx, 92, 54, 44, 44, 12);
  ctx.fillStyle = '#F8B478';
  ctx.fill();
  ctx.fillStyle = '#1E1645';
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('JN', 114, 83);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('JN ExamCBTCore', 152, 76);

  ctx.fillStyle = '#A5B4FC';
  ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Sistem Ujian CBT & Imtihan Kitab — MTs • MA • Wustho • ’Ulya', 152, 96);

  // Live Telemetry Pill Right
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  ctx.beginPath();
  ctx.arc(W - 310, 76, 6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(85, 229, 199, ${0.5 + 0.5 * pulse})`;
  ctx.fill();

  ctx.fillStyle = '#55E5C7';
  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.fillText('ALGORITHMIC SHOWCASE • 1080P', W - 294, 81);
  ctx.restore();
}

function drawBottomTimelineHud(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.save();
  const barX = 72;
  const barY = H - 56;
  const barW = W - 144;

  drawRoundedRect(ctx, barX, barY, barW, 10, 5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();

  const progressW = Math.max(12, (t / TOTAL_DURATION) * barW);
  drawRoundedRect(ctx, barX, barY, progressW, 10, 5);
  const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  grad.addColorStop(0, '#F8B478');
  grad.addColorStop(0.5, '#55E5C7');
  grad.addColorStop(1, '#8362FF');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

// ============================================================================
// SCENE 01: KINETIC BRAND REVEAL & FLOATING UI SHELL
// ============================================================================
function drawScene01Intro(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: number,
  heroImg?: HTMLImageElement
) {
  const enter = easeOutBack(clamp(p * 2.2));
  ctx.save();

  // Left Kinetic Typography
  const leftX = 110;
  const baseY = 270 + (1 - enter) * 60;

  drawRoundedRect(ctx, leftX, baseY, 430, 44, 22);
  ctx.fillStyle = 'rgba(248, 180, 120, 0.16)';
  ctx.fill();
  ctx.fillStyle = '#F8B478';
  ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('✦ PLATFORM CBT MADRASAH & PONDOK PESANTREN', leftX + 22, baseY + 28);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 66px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Satu Pusat Kendali', leftX, baseY + 120);
  ctx.fillStyle = '#F8B478';
  ctx.fillText('Ujian Akademik &', leftX, baseY + 198);
  ctx.fillStyle = '#55E5C7';
  ctx.fillText('Imtihan Kitab Turats.', leftX, baseY + 276);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Dirancang khusus untuk tingkat MTs, Madrasah Aliyah, PDF Wustho, dan Ma’had ’Ulya',
    leftX,
    baseY + 340
  );
  ctx.fillText(
    'dengan dukungan penuh Teks Arab Berharakat (RTL), Anti-Cheat, & Analitik KKM.',
    leftX,
    baseY + 376
  );

  // Feature Chips
  const chips = [
    '✓ 4 Jenjang Terintegrasi',
    '✓ Bank Soal Kitab RTL',
    '✓ Live Proctoring & Token',
    '✓ Kartu QR & Rekap Otomatis',
  ];
  chips.forEach((ch, idx) => {
    const chipEnter = easeOutCubic(clamp((p - 0.15 - idx * 0.08) * 3));
    const cx = leftX + (idx % 2) * 340;
    const cy = baseY + 425 + Math.floor(idx / 2) * 64 + (1 - chipEnter) * 30;
    ctx.globalAlpha = chipEnter;
    drawRoundedRect(ctx, cx, cy, 320, 48, 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(248, 180, 120, 0.35)';
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(ch, cx + 20, cy + 30);
  });
  ctx.globalAlpha = 1;

  // Right 3D Sticker Emblem with Orbital Rings
  const rightCX = W * 0.75;
  const rightCY = H * 0.52;
  ctx.beginPath();
  ctx.arc(rightCX, rightCY, 250 * enter, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(248, 180, 120, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawStickerWithFrame(
    ctx,
    heroImg,
    rightCX,
    rightCY,
    360 * enter,
    -0.08 + Math.sin(p * Math.PI * 2) * 0.04
  );

  ctx.restore();
}

// ============================================================================
// SCENE 02: 4 JENJANG / MARHALAH CARDS & TELEMETRY DONUT
// ============================================================================
function drawScene02FourJenjang(
  ctx: CanvasRenderingContext2D,
  W: number,
  _H: number,
  p: number,
  heroImg?: HTMLImageElement
) {
  ctx.save();
  const titleP = easeOutCubic(clamp(p * 3));
  ctx.fillStyle = '#F8B478';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MULTI-JENJANG & MARHALAH ENGINE', 110, 180);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 46px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('4 Tingkat Pendidikan dalam Satu Ekosistem Terpadu', 110, 235);

  const cards = [
    {
      code: 'MTs',
      title: 'Madrasah Tsanawiyah',
      sub: 'Kurikulum Kemenag • Opsi A–D',
      count: 142,
      cap: 165,
      color: '#8362FF',
      bg: '#EAE6FF',
    },
    {
      code: 'MA',
      title: 'Madrasah Aliyah (MA/MAK)',
      sub: 'Program Keagamaan • Opsi A–E',
      count: 118,
      cap: 145,
      color: '#F59E0B',
      bg: '#FFF4D6',
    },
    {
      code: 'Wustho',
      title: 'PDF / Diniyah Wustho',
      sub: 'Takhassus Nahwu Jurumiyah & Fiqih',
      count: 96,
      cap: 120,
      color: '#14B894',
      bg: '#E0F8F5',
    },
    {
      code: "'Ulya",
      title: "Ma'had 'Ulya",
      sub: 'Alfiyah Ibn Malik & Ushul Fiqih',
      count: 64,
      cap: 80,
      color: '#F0544F',
      bg: '#FFE8E5',
    },
  ];

  cards.forEach((c, idx) => {
    const cp = easeOutBack(clamp((p - idx * 0.08) * 2.5));
    const cardW = 405;
    const cardH = 260;
    const x = 110 + idx * (cardW + 32);
    const y = 300 + (1 - cp) * 80;

    ctx.save();
    drawRoundedRect(ctx, x, y, cardW, cardH, 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Badge
    drawRoundedRect(ctx, x + 28, y + 28, 110, 44, 14);
    ctx.fillStyle = c.bg;
    ctx.fill();
    ctx.fillStyle = '#1E1645';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(c.code, x + 48, y + 57);

    // Title & Subtitle
    ctx.fillStyle = '#1E1645';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(c.title, x + 28, y + 115);

    ctx.fillStyle = '#64748B';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(c.sub, x + 28, y + 145);

    // Animated Counter
    const countNow = Math.round(c.count * easeOutCubic(clamp((p - 0.1) * 1.8)));
    ctx.fillStyle = c.color;
    ctx.font = '800 22px "JetBrains Mono", monospace';
    ctx.fillText(`${countNow} Santri Aktif`, x + 28, y + 200);

    // Progress Bar
    drawRoundedRect(ctx, x + 28, y + 218, cardW - 56, 12, 6);
    ctx.fillStyle = c.bg;
    ctx.fill();

    const fillW = Math.max(12, (cardW - 56) * (countNow / c.cap));
    drawRoundedRect(ctx, x + 28, y + 218, fillW, 12, 6);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.restore();
  });

  // Bottom Summary Banner with Floating Sticker
  const botY = 610;
  drawRoundedRect(ctx, 110, botY, W - 220, 320, 32);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Total 420 Santri Terdaftar • 92% Ketuntasan KKM Nasional & Ma’had', 155, botY + 85);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Filter instan antar-jenjang di seluruh menu: Bank Soal, Jadwal Live, Kartu Peserta, hingga Rekap Nilai.',
    155,
    botY + 135
  );

  // Floating Sidebar Preview Pill
  const pills = ['ALL JENJANG', 'MTs (142)', 'ALIYAH (118)', 'WUSTHO (96)', "’ULYA (64)"];
  pills.forEach((pl, i) => {
    const px = 155 + i * 225;
    const py = botY + 185;
    drawRoundedRect(ctx, px, py, 205, 54, 16);
    ctx.fillStyle = i === Math.floor(p * 5) % 5 ? '#F8B478' : 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.fillStyle = i === Math.floor(p * 5) % 5 ? '#1E1645' : '#FFFFFF';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(pl, px + 26, py + 34);
  });

  drawStickerWithFrame(ctx, heroImg, W - 270, botY + 160, 230 * titleP, 0.08);
  ctx.restore();
}

// ============================================================================
// SCENE 03: BANK SOAL BILINGUAL & KITAB TURATS (RTL + LTR)
// ============================================================================
function drawScene03BankSoalKitab(
  ctx: CanvasRenderingContext2D,
  _W: number,
  _H: number,
  p: number,
  bankImg?: HTMLImageElement
) {
  ctx.save();
  const enter = easeOutCubic(clamp(p * 2.5));

  ctx.fillStyle = '#F8B478';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('BANK SOAL KITAB TURATS & BILINGUAL (RTL + LTR)', 110, 180);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Mendukung Matan Arab Berharakat & 4 Tipe Soal Modern', 110, 235);

  // Main Question Card Simulation
  const cardX = 110;
  const cardY = 285;
  const cardW = 1160;
  const cardH = 650;

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Header Badges inside Question Card
  drawRoundedRect(ctx, cardX + 40, cardY + 36, 150, 42, 12);
  ctx.fillStyle = '#211955';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SOAL NO. 1', cardX + 64, cardY + 63);

  drawRoundedRect(ctx, cardX + 206, cardY + 36, 260, 42, 12);
  ctx.fillStyle = '#E0F8F5';
  ctx.fill();
  ctx.fillStyle = '#087963';
  ctx.fillText('📚 Kitab Fathul Qarib', cardX + 228, cardY + 63);

  // Arabic RTL Box with Harakat
  drawRoundedRect(ctx, cardX + 40, cardY + 102, cardW - 80, 150, 22);
  ctx.fillStyle = '#FFF8F1';
  ctx.fill();
  ctx.strokeStyle = '#FCD9BD';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1E1645';
  ctx.font = '700 42px "Amiri", "Noto Naskh Arabic", serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    'قَالَ الْمُصَنِّفُ رَحِمَهُ اللهُ: وَصَلَاةُ الْجَمَاعَةِ سُنَّةٌ مُؤَكَّدَةٌ أَوْ فَرْضُ كِفَايَةٍ',
    cardX + cardW - 70,
    cardY + 192
  );
  ctx.textAlign = 'left';

  // Question Prompt (LTR)
  ctx.fillStyle = '#1E1645';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Berdasarkan matan Fathul Qarib di atas, apakah hukum shalat berjamaah bagi laki-laki mukim?',
    cardX + 40,
    cardY + 305
  );

  // Options A - D
  const opts = [
    { label: 'A', text: 'Fardhu Kifayah menurut pendapat paling shahih dalam Mazhab Syafi’i', correct: true },
    { label: 'B', text: 'Fardhu ’Ain bagi setiap musafir maupun mukim tanpa terkecuali', correct: false },
    { label: 'C', text: 'Mubah dan tidak memiliki keutamaan derajat dibanding munfarid', correct: false },
    { label: 'D', text: 'Wajib hanya pada pelaksanaan shalat Jumat dan Hari Raya', correct: false },
  ];

  opts.forEach((o, idx) => {
    const oy = cardY + 340 + idx * 72;
    drawRoundedRect(ctx, cardX + 40, oy, cardW - 80, 58, 16);
    ctx.fillStyle = o.correct ? '#E0F8F5' : '#F4F5FA';
    ctx.fill();
    ctx.strokeStyle = o.correct ? '#14B894' : '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = o.correct ? '#064D42' : '#1E1645';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${o.label}.  ${o.text}`, cardX + 68, oy + 36);

    if (o.correct) {
      ctx.fillStyle = '#087963';
      ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('✓ KUNCI JAWABAN', cardX + cardW - 230, oy + 36);
    }
  });

  // Right Panel: 4 Supported Question Types + Bank Soal Sticker
  const rightX = 1310;
  const types = [
    { code: 'PG', name: 'Pilihan Ganda (A–D / A–E)', color: '#8362FF' },
    { code: 'PGK', name: 'Pilihan Ganda Kompleks', color: '#14B894' },
    { code: 'B/S', name: 'Benar / Salah (صحيح / خطأ)', color: '#F59E0B' },
    { code: 'ESAI', name: 'Uraian & Tarkib Kitab', color: '#F0544F' },
  ];

  types.forEach((tp, i) => {
    const ty = 285 + i * 90;
    drawRoundedRect(ctx, rightX, ty, 500, 74, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.fill();
    ctx.strokeStyle = tp.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawRoundedRect(ctx, rightX + 16, ty + 15, 76, 44, 12);
    ctx.fillStyle = tp.color;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 18px "JetBrains Mono", monospace';
    ctx.fillText(tp.code, rightX + 32, ty + 43);

    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(tp.name, rightX + 112, ty + 44);
  });

  drawStickerWithFrame(ctx, bankImg, rightX + 250, 790, 260 * enter, -0.09);
  ctx.restore();
}

// ============================================================================
// SCENE 04: CRYPTOGRAPHIC TOKEN & LIVE PROCTORING RADAR
// ============================================================================
function drawScene04LiveProctoring(
  ctx: CanvasRenderingContext2D,
  _W: number,
  _H: number,
  p: number,
  tokenImg?: HTMLImageElement
) {
  ctx.save();
  ctx.fillStyle = '#55E5C7';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LIVE PROCTORING, ANTI-CHEAT & TOKEN SERVER', 110, 180);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Pemantauan Ruang Ujian Real-Time & Kendali Penuh Pengawas', 110, 235);

  // Left: Live Participant Proctoring Table
  const tx = 110;
  const ty = 285;
  const tw = 1160;
  const th = 640;

  drawRoundedRect(ctx, tx, ty, tw, th, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Broadcast Banner inside Table
  drawRoundedRect(ctx, tx + 36, ty + 32, tw - 72, 64, 16);
  ctx.fillStyle = '#FFF4D6';
  ctx.fill();
  ctx.fillStyle = '#B85D19';
  ctx.font = '800 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    '📢 Siaran Pengawas Live: "Perhatikan harakat akhir pada soal tarkib nomor 4 sebelum submit!"',
    tx + 60,
    ty + 71
  );

  const rows = [
    { name: 'Muhammad Naufal Al-Ghifari', no: '26-MTS-001', status: 'MENGERJAKAN', prog: 0.85, viol: 0 },
    { name: 'Siti Aisyah Humaira', no: '26-MA-014', status: 'SELESAI SUBMIT', prog: 1.0, viol: 0 },
    { name: 'Ahmad Zaki Mubarak', no: '26-WST-008', status: 'TERKUNCI (PINDAH TAB)', prog: 0.5, viol: 2 },
    { name: 'KH. Muda Fathullah', no: '26-ULY-003', status: 'MENGERJAKAN', prog: 0.92, viol: 0 },
    { name: 'Nadia Zahra Al-Qudsi', no: '26-MA-019', status: 'SELESAI SUBMIT', prog: 1.0, viol: 0 },
  ];

  rows.forEach((r, idx) => {
    const ry = ty + 125 + idx * 96;
    drawRoundedRect(ctx, tx + 36, ry, tw - 72, 80, 18);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();

    ctx.fillStyle = '#1E1645';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(r.name, tx + 60, ry + 36);
    ctx.fillStyle = '#64748B';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText(r.no, tx + 60, ry + 62);

    // Status Pill
    const stColor =
      r.status === 'SELESAI SUBMIT'
        ? '#14B894'
        : r.status.includes('TERKUNCI')
        ? '#F0544F'
        : '#F59E0B';
    drawRoundedRect(ctx, tx + 430, ry + 20, 245, 40, 20);
    ctx.fillStyle = stColor;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(r.status, tx + 452, ry + 45);

    // Progress Bar
    drawRoundedRect(ctx, tx + 710, ry + 32, 210, 14, 7);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();
    drawRoundedRect(ctx, tx + 710, ry + 32, 210 * r.prog * easeOutCubic(clamp(p * 2)), 14, 7);
    ctx.fillStyle = '#3B28CC';
    ctx.fill();

    // Action Button
    drawRoundedRect(ctx, tx + 960, ry + 20, 140, 40, 12);
    ctx.fillStyle = '#211955';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Buka Kunci', tx + 986, ry + 45);
  });

  // Right: Token Vault + Radar Pulse + Sticker
  const rx = 1310;
  drawRoundedRect(ctx, rx, 285, 500, 280, 28);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.fill();
  ctx.strokeStyle = '#F8B478';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#F8B478';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('🔑 TOKEN SESI AKTIF (AUTO-ROTATE)', rx + 36, 340);

  drawRoundedRect(ctx, rx + 36, 365, 428, 95, 20);
  ctx.fillStyle = '#FFF4D6';
  ctx.fill();
  ctx.fillStyle = '#1E1645';
  ctx.font = '800 54px "JetBrains Mono", monospace';
  ctx.fillText('J N 8 4 9 K', rx + 82, 432);

  ctx.fillStyle = '#55E5C7';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('✓ Anti-Cheat Fullscreen & Tab Lock Aktif', rx + 36, 515);

  drawStickerWithFrame(ctx, tokenImg, rx + 250, 760, 280, 0.07);
  ctx.restore();
}

// ============================================================================
// SCENE 05: STUDENT EXAM PORTAL SIMULATION
// ============================================================================
function drawScene05StudentPortal(
  ctx: CanvasRenderingContext2D,
  _W: number,
  _H: number,
  p: number
) {
  ctx.save();
  ctx.fillStyle = '#F8B478';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PORTAL SIMULASI & RUANG UJIAN SANTRI / SISWA', 110, 180);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Antarmuka Fokus, Nyaman Dibaca, dengan Matriks Navigasi Soal', 110, 235);

  // Left Canvas (Question View)
  drawRoundedRect(ctx, 110, 285, 1120, 640, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Top Exam Bar inside Student Portal
  drawRoundedRect(ctx, 140, 315, 1060, 74, 20);
  ctx.fillStyle = '#211955';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText("Imtihan Alfiyah Ibn Malik & Ushul Fiqih — Ma'had 'Ulya", 170, 360);

  // Countdown Timer Pill
  drawRoundedRect(ctx, 1010, 330, 165, 44, 12);
  ctx.fillStyle = '#F8B478';
  ctx.fill();
  ctx.fillStyle = '#1E1645';
  ctx.font = '800 22px "JetBrains Mono", monospace';
  const secs = Math.max(0, 59 - Math.floor(p * 25));
  ctx.fillText(`89:${String(secs).padStart(2, '0')}`, 1048, 360);

  // Arabic Bait Poetry inside Student Portal
  drawRoundedRect(ctx, 140, 415, 1060, 160, 22);
  ctx.fillStyle = '#FFF8F1';
  ctx.fill();
  ctx.strokeStyle = '#FCD9BD';
  ctx.stroke();

  ctx.fillStyle = '#1E1645';
  ctx.font = '700 44px "Amiri", serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    'كَلَامُنَا لَفْظٌ مُفِيْدٌ كَاسْتَقِمْ ۞ وَاسْمٌ وَفِعْلٌ ثُمَّ حَرْفٌ الْكَلِمْ',
    1165,
    510
  );
  ctx.textAlign = 'left';

  // Virtual Harakat Bar Preview
  const harakat = ['َ Fathah', 'ِ Kasrah', 'ُ Dhammah', 'ْ Sukun', 'ّ Tasydid', 'A-  A  A+'];
  harakat.forEach((hk, i) => {
    drawRoundedRect(ctx, 140 + i * 175, 600, 160, 48, 12);
    ctx.fillStyle = '#EAE6FF';
    ctx.fill();
    ctx.fillStyle = '#211955';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(hk, 165 + i * 175, 630);
  });

  // Navigation Footer Buttons
  drawRoundedRect(ctx, 140, 825, 220, 62, 16);
  ctx.fillStyle = '#F4F5FA';
  ctx.fill();
  ctx.fillStyle = '#1E1645';
  ctx.fillText('← Sebelumnya', 175, 862);

  drawRoundedRect(ctx, 540, 825, 240, 62, 16);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('⚑ Ditandai Ragu', 575, 862);

  drawRoundedRect(ctx, 940, 825, 260, 62, 16);
  ctx.fillStyle = '#14B894';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Selesai & Kumpulkan ✓', 965, 862);

  // Right Column: Question Number Matrix (4x5 Grid)
  const mx = 1265;
  drawRoundedRect(ctx, mx, 285, 545, 640, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.fillStyle = '#1E1645';
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Navigasi Nomor Soal (18/20)', mx + 36, 342);

  for (let i = 0; i < 20; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const bx = mx + 36 + col * 122;
    const by = 375 + row * 92;
    const isDoubt = i === 6 || i === 13;
    const isDone = i < Math.floor(12 + p * 8);

    drawRoundedRect(ctx, bx, by, 106, 74, 16);
    ctx.fillStyle = isDoubt ? '#F59E0B' : isDone ? '#14B894' : '#F1F5F9';
    ctx.fill();

    ctx.fillStyle = isDoubt || isDone ? '#FFFFFF' : '#1E1645';
    ctx.font = '800 22px "JetBrains Mono", monospace';
    ctx.fillText(String(i + 1), bx + 42, by + 45);
  }

  ctx.restore();
}

// ============================================================================
// SCENE 06: SMART QR EXAM CARDS & AUTOMATED GRADEBOOK ANALYTICS
// ============================================================================
function drawScene06CardsAndRekap(
  ctx: CanvasRenderingContext2D,
  _W: number,
  _H: number,
  p: number,
  pesertaImg?: HTMLImageElement,
  rekapImg?: HTMLImageElement
) {
  ctx.save();
  ctx.fillStyle = '#55E5C7';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KARTU PESERTA QR, PRESENSI A4 & REKAPITULASI NILAI OTOMATIS', 110, 180);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Cetak Administrasi Ujian & Analisis Daya Serap Satu Klik', 110, 235);

  // Left: Exam Card Preview
  drawRoundedRect(ctx, 110, 290, 820, 620, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.fillStyle = '#211955';
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KARTU PESERTA UJIAN CBT — YAYASAN JABAL NUR', 150, 350);

  drawRoundedRect(ctx, 150, 380, 740, 260, 22);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.strokeStyle = '#1E1645';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1E1645';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Nama Santri    :  Muhammad Naufal Al-Ghifari', 180, 430);
  ctx.fillText('Nomor CBT     :  26-MTS-001', 180, 470);
  ctx.fillText('Jenjang / Kelas:  MTs — VIII-A (Lab CBT 1)', 180, 510);
  ctx.fillStyle = '#B85D19';
  ctx.font = '800 22px "JetBrains Mono", monospace';
  ctx.fillText('PIN SESI CBT   :  482910   [VERIFIED QR]', 180, 560);

  drawStickerWithFrame(ctx, pesertaImg, 730, 760, 230, -0.07);

  // Right: Gradebook Analytics & KKM Chart
  const rx = 980;
  drawRoundedRect(ctx, rx, 290, 830, 620, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.fillStyle = '#1E1645';
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ANALISIS DAYA SERAP & KETUNTASAN KKM', rx + 40, 350);

  const bars = [
    { label: 'Tsanawiyah (MTs) — Rata-rata 88.5', pct: 0.89, color: '#3B28CC' },
    { label: 'Madrasah Aliyah (MA) — Rata-rata 91.2', pct: 0.91, color: '#F59E0B' },
    { label: 'PDF Diniyah Wustho — Rata-rata 86.4', pct: 0.86, color: '#14B894' },
    { label: "Ma'had 'Ulya — Rata-rata 94.0", pct: 0.94, color: '#F0544F' },
  ];

  bars.forEach((b, i) => {
    const by = 400 + i * 82;
    ctx.fillStyle = '#1E1645';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(b.label, rx + 40, by);

    drawRoundedRect(ctx, rx + 40, by + 14, 520, 20, 10);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();

    drawRoundedRect(ctx, rx + 40, by + 14, 520 * b.pct * easeOutCubic(clamp(p * 2)), 20, 10);
    ctx.fillStyle = b.color;
    ctx.fill();
  });

  drawStickerWithFrame(ctx, rekapImg, rx + 670, 760, 230, 0.07);
  ctx.restore();
}

// ============================================================================
// SCENE 07: MODULAR CLEAN ARCHITECTURE & COMMUNITY OUTRO
// ============================================================================
function drawScene07ModularArchitecture(
  ctx: CanvasRenderingContext2D,
  W: number,
  _H: number,
  p: number,
  pengaturanImg?: HTMLImageElement
) {
  ctx.save();
  const enter = easeOutBack(clamp(p * 2.2));

  // Center Hero Outro Card
  const cx = 140;
  const cy = 220;
  const cw = W - 280;
  const ch = 680;

  drawRoundedRect(ctx, cx, cy, cw, ch, 40);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(248, 180, 120, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#F8B478';
  ctx.font = '800 20px "JetBrains Mono", monospace';
  ctx.fillText('★ CLEAN MODULAR REACT + TYPESCRIPT + TAILWIND ARCHITECTURE', cx + 60, cy + 75);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('JN ExamCBTCore — Siap Digunakan', cx + 60, cy + 155);
  ctx.fillStyle = '#55E5C7';
  ctx.fillText('& Dikembangkan Bersama Komunitas!', cx + 60, cy + 228);

  const modules = [
    'src/components/layout/ (FloatingSidebar, TopHeaderBar, GuideModal)',
    'src/components/bank-soal/ (PacketList, QuestionCard, EditorModal)',
    'src/components/jadwal/ (ScheduleCardGrid, LiveProctorTable)',
    'src/components/peserta/ (StudentTable, ExamCardPrint, AttendanceA4)',
    'src/components/student-portal/ (Lobby, ActiveCanvas, MatrixSidebar)',
    'src/data/ (jenjangMeta, packetsData, schedulesData, submissions)',
  ];

  modules.forEach((m, i) => {
    const my = cy + 280 + i * 54;
    drawRoundedRect(ctx, cx + 60, my, 920, 44, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillText(`├─ ${m}`, cx + 82, my + 29);
  });

  // GitHub Repo Callout Pill
  drawRoundedRect(ctx, cx + 60, cy + 610, 920, 52, 16);
  ctx.fillStyle = '#F8B478';
  ctx.fill();
  ctx.fillStyle = '#1E1645';
  ctx.font = '800 22px "JetBrains Mono", monospace';
  ctx.fillText('🔗 Repository: https://github.com/MasAim24/jn-cbt-core', cx + 90, cy + 644);

  drawStickerWithFrame(ctx, pengaturanImg, cx + cw - 290, cy + 380, 360 * enter, -0.06);
  ctx.restore();
}
