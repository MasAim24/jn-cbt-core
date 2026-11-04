import React, { useEffect, useRef, useState } from 'react';
import {
  Headphones,
  Image as ImageIcon,
  Maximize2,
  Play,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import {
  AUDIO_ISTIMA_PRESETS,
  playSynthIstimaPreset,
} from '../../utils/questionMediaHelper';

interface QuestionMediaAttachmentProps {
  mediaImageUrl?: string;
  mediaAudioUrl?: string;
  mediaCaption?: string;
  compact?: boolean;
}

export const QuestionMediaAttachment: React.FC<QuestionMediaAttachmentProps> = ({
  mediaImageUrl,
  mediaAudioUrl,
  mediaCaption,
  compact = false,
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
  const [synthProgress, setSynthProgress] = useState(0);
  const stopSynthRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopSynthRef.current) {
        stopSynthRef.current();
      }
    };
  }, [mediaAudioUrl]);

  if (!mediaImageUrl && !mediaAudioUrl) return null;

  const synthPreset = mediaAudioUrl?.startsWith('SYNTH_ISTIMA_')
    ? AUDIO_ISTIMA_PRESETS.find((p) => p.id === mediaAudioUrl) || AUDIO_ISTIMA_PRESETS[0]
    : null;

  const handleToggleSynth = () => {
    if (isPlayingSynth) {
      stopSynthRef.current?.();
      stopSynthRef.current = null;
      setIsPlayingSynth(false);
      setSynthProgress(0);
      return;
    }
    if (!synthPreset) return;
    setIsPlayingSynth(true);
    setSynthProgress(0);
    stopSynthRef.current = playSynthIstimaPreset(
      synthPreset.id,
      (ratio) => setSynthProgress(ratio),
      () => {
        setIsPlayingSynth(false);
        setSynthProgress(1);
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Image / Diagram Attachment */}
      {mediaImageUrl && (
        <div className="rounded-2xl bg-surface/90 border border-border-subtle p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-text-muted">
            <span className="inline-flex items-center gap-1.5 text-[var(--brand-text-accent)] font-extrabold">
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Lampiran Gambar / Bagan Ilustrasi Soal</span>
            </span>
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-elevated hover:bg-indigo-50 text-text-main border border-border-subtle transition"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Perbesar Gambar</span>
            </button>
          </div>

          <div
            onClick={() => setZoomOpen(true)}
            className="relative group cursor-zoom-in rounded-xl overflow-hidden bg-white border border-border-subtle/80 flex items-center justify-center p-2"
          >
            <img
              src={mediaImageUrl}
              alt={mediaCaption || 'Ilustrasi Soal CBT'}
              className={`${
                compact ? 'max-h-48' : 'max-h-72'
              } w-auto object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.01]`}
            />
          </div>

          {mediaCaption && (
            <p className="text-xs text-text-muted italic text-center px-2">
              {mediaCaption}
            </p>
          )}
        </div>
      )}

      {/* Audio Istima' / Listening Attachment */}
      {mediaAudioUrl && (
        <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#211955] dark:text-amber-200">
              <Headphones className="w-4 h-4 text-[#14B894] shrink-0" />
              <span>
                {synthPreset
                  ? synthPreset.label
                  : 'Rekaman Audio Soal (Istima’ / Listening CBT)'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#087963] text-[10px] font-extrabold">
              AUDIO AKTIF
            </span>
          </div>

          {synthPreset ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-elevated p-3 rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={handleToggleSynth}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 ${
                  isPlayingSynth
                    ? 'bg-[#D93834] text-white'
                    : 'bg-[#211955] hover:bg-[#2d2270] text-white'
                }`}
              >
                {isPlayingSynth ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Hentikan Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current translate-x-[1.5px]" />
                    <span>Putar Audio Istima&apos; ({synthPreset.durationLabel})</span>
                  </>
                )}
              </button>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#14B894]" />
                    <span>
                      {isPlayingSynth
                        ? 'Sedang memutar pelafalan Istima’...'
                        : 'Klik tombol Putar untuk mendengarkan'}
                    </span>
                  </span>
                  <span className="font-mono">
                    {Math.round(synthProgress * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full bg-[#14B894] transition-all duration-100 rounded-full"
                    style={{ width: `${Math.round(synthProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <audio
              controls
              src={mediaAudioUrl}
              className="w-full h-10 rounded-xl"
              preload="metadata"
            >
              Browser Anda tidak mendukung pemutar audio HTML5.
            </audio>
          )}

          {mediaCaption && !mediaImageUrl && (
            <p className="text-xs text-text-muted italic">{mediaCaption}</p>
          )}
        </div>
      )}

      {/* Lightbox Modal for Zooming Image */}
      {zoomOpen && mediaImageUrl && (
        <div
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-elevated rounded-[24px] max-w-4xl w-full p-4 sm:p-5 shadow-floating border border-border-subtle space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-text-main">
                {mediaCaption || 'Pratinjau Penuh Gambar / Bagan Soal'}
              </h4>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="p-1.5 rounded-xl hover:bg-surface text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center max-h-[75vh] overflow-auto border border-slate-200">
              <img
                src={mediaImageUrl}
                alt={mediaCaption || 'Ilustrasi Soal'}
                className="max-w-full max-h-[68vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
