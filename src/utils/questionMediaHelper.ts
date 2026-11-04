export interface MediaDiagramPreset {
  id: string;
  label: string;
  caption: string;
  dataUrl: string;
}

export interface AudioIstimaPreset {
  id: string;
  label: string;
  caption: string;
  arabicScript: string;
  durationLabel: string;
}

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const DIAGRAM_PRESETS: MediaDiagramPreset[] = [
  {
    id: 'nahwu-kalimat',
    label: 'Bagan Pembagian Kalimat Nahwu (Isim • Fi’il • Harf)',
    caption: 'Bagan Struktur Pembagian Al-Kalimah dalam Matan Al-Ajurrumiyah',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 320" width="760" height="320">
        <rect width="760" height="320" rx="20" fill="#FFF8F1" stroke="#FCD9BD" stroke-width="3"/>
        <rect x="250" y="24" width="260" height="58" rx="14" fill="#211955"/>
        <text x="380" y="50" text-anchor="middle" fill="#F8B478" font-family="sans-serif" font-size="15" font-weight="bold">أَقْسَامُ الْكَلِمَةِ (PEMBAGIAN KALIMAT)</text>
        <text x="380" y="70" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11">Bab Kalam — Matan Al-Ajurrumiyah</text>

        <path d="M380 82 L380 120 M145 120 L615 120 M145 120 L145 152 M380 120 L380 152 M615 120 L615 152" stroke="#211955" stroke-width="3" fill="none"/>

        <rect x="45" y="152" width="200" height="130" rx="16" fill="#FFFFFF" stroke="#14B894" stroke-width="2.5"/>
        <rect x="45" y="152" width="200" height="38" rx="14" fill="#14B894"/>
        <text x="145" y="176" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">١. اِسْمٌ (ISIM / KATA BENDA)</text>
        <text x="145" y="212" text-anchor="middle" fill="#1E1645" font-family="sans-serif" font-size="12" font-weight="bold">Tanda: Tanwin, Alif-Lam, Khafadh</text>
        <text x="145" y="240" text-anchor="middle" fill="#087963" font-family="sans-serif" font-size="13" font-weight="bold">Contoh: زَيْدٌ ، الْمَسْجِدِ</text>
        <text x="145" y="265" text-anchor="middle" fill="#64748B" font-family="sans-serif" font-size="11">Tidak terikat waktu</text>

        <rect x="280" y="152" width="200" height="130" rx="16" fill="#FFFFFF" stroke="#3B28CC" stroke-width="2.5"/>
        <rect x="280" y="152" width="200" height="38" rx="14" fill="#3B28CC"/>
        <text x="380" y="176" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">٢. فِعْلٌ (FI'IL / KATA KERJA)</text>
        <text x="380" y="212" text-anchor="middle" fill="#1E1645" font-family="sans-serif" font-size="12" font-weight="bold">Tanda: Qad, Sin, Saufa, Ta' Ta'nits</text>
        <text x="380" y="240" text-anchor="middle" fill="#3B28CC" font-family="sans-serif" font-size="13" font-weight="bold">Contoh: قَدْ قَامَ ، يَكْتُبُ</text>
        <text x="380" y="265" text-anchor="middle" fill="#64748B" font-family="sans-serif" font-size="11">Madhi • Mudhari' • Amr</text>

        <rect x="515" y="152" width="200" height="130" rx="16" fill="#FFFFFF" stroke="#D97706" stroke-width="2.5"/>
        <rect x="515" y="152" width="200" height="38" rx="14" fill="#D97706"/>
        <text x="615" y="176" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold">٣. حَرْفٌ (HARF / HURUF)</text>
        <text x="615" y="212" text-anchor="middle" fill="#1E1645" font-family="sans-serif" font-size="12" font-weight="bold">Tidak menerima tanda Isim &amp; Fi'il</text>
        <text x="615" y="240" text-anchor="middle" fill="#B85D19" font-family="sans-serif" font-size="13" font-weight="bold">Contoh: مِنْ ، إِلَى ، هَلْ ، لَمْ</text>
        <text x="615" y="265" text-anchor="middle" fill="#64748B" font-family="sans-serif" font-size="11">Bermakna bersama kata lain</text>
      </svg>
    `),
  },
  {
    id: 'fiqih-air',
    label: 'Skema Klasifikasi Hukum Air (Fiqih Thaharah)',
    caption: 'Bagan Klasifikasi Hukum Air dalam Kitab Taqrib / Fathul Qarib',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 300" width="760" height="300">
        <rect width="760" height="300" rx="20" fill="#F0FDF9" stroke="#99F6E4" stroke-width="3"/>
        <rect x="220" y="20" width="320" height="52" rx="14" fill="#064D42"/>
        <text x="380" y="45" text-anchor="middle" fill="#55E5C7" font-family="sans-serif" font-size="15" font-weight="bold">أَقْسَامُ الْمِيَاهِ فِي الْفِقْهِ الشَّافِعِيِّ</text>
        <text x="380" y="63" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11">Klasifikasi Hukum Air dalam Thaharah (Bersuci)</text>

        <rect x="28" y="102" width="165" height="165" rx="14" fill="#FFFFFF" stroke="#14B894" stroke-width="2"/>
        <text x="110" y="132" text-anchor="middle" fill="#087963" font-family="sans-serif" font-size="13" font-weight="bold">1. Air Muthlaq</text>
        <text x="110" y="156" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">Suci &amp; Menyucikan</text>
        <text x="110" y="182" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">Tidak makruh digunakan</text>
        <text x="110" y="204" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">untuk mengangkat hadats</text>
        <rect x="48" y="222" width="125" height="28" rx="8" fill="#CCFBF1"/>
        <text x="110" y="240" text-anchor="middle" fill="#064D42" font-family="sans-serif" font-size="11" font-weight="bold">طَاهِرٌ مُطَهِّرٌ</text>

        <rect x="208" y="102" width="165" height="165" rx="14" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2"/>
        <text x="290" y="132" text-anchor="middle" fill="#B45309" font-family="sans-serif" font-size="13" font-weight="bold">2. Air Musyammas</text>
        <text x="290" y="156" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">Suci Menyucikan</text>
        <text x="290" y="182" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">Makruh dipakai pada</text>
        <text x="290" y="204" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">badan (panas matahari)</text>
        <rect x="228" y="222" width="125" height="28" rx="8" fill="#FEF3C7"/>
        <text x="290" y="240" text-anchor="middle" fill="#92400E" font-family="sans-serif" font-size="11" font-weight="bold">مَكْرُوْهٌ تَنْزِيْهًا</text>

        <rect x="388" y="102" width="165" height="165" rx="14" fill="#FFFFFF" stroke="#6366F1" stroke-width="2"/>
        <text x="470" y="132" text-anchor="middle" fill="#3730A3" font-family="sans-serif" font-size="13" font-weight="bold">3. Air Musta'mal</text>
        <text x="470" y="156" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">Suci, Tak Menyucikan</text>
        <text x="470" y="182" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">Bekas basuhan wajib</text>
        <text x="470" y="204" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">(&lt; 2 Qullah) / Mutaghayyir</text>
        <rect x="408" y="222" width="125" height="28" rx="8" fill="#E0E7FF"/>
        <text x="470" y="240" text-anchor="middle" fill="#1E1645" font-family="sans-serif" font-size="11" font-weight="bold">طَاهِرٌ غَيْرُ مُطَهِّرٍ</text>

        <rect x="568" y="102" width="165" height="165" rx="14" fill="#FFFFFF" stroke="#EF4444" stroke-width="2"/>
        <text x="650" y="132" text-anchor="middle" fill="#B91C1C" font-family="sans-serif" font-size="13" font-weight="bold">4. Air Mutanajjis</text>
        <text x="650" y="156" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">Terkena Najis</text>
        <text x="650" y="182" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">&lt; 2 Qullah atau berubah</text>
        <text x="650" y="204" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="11">bau, rasa, maupun warna</text>
        <rect x="588" y="222" width="125" height="28" rx="8" fill="#FEE2E2"/>
        <text x="650" y="240" text-anchor="middle" fill="#991B1B" font-family="sans-serif" font-size="11" font-weight="bold">مَاءٌ مُتَنَجِّسٌ</text>
      </svg>
    `),
  },
  {
    id: 'geometri-sains',
    label: 'Diagram Geometri & Sudut Lingkaran (Matematika MTs/MA)',
    caption: 'Perhatikan gambar sudut pusat ∠AOB dan sudut keliling ∠ACB pada lingkaran berpusat di titik O',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 300" width="760" height="300">
        <rect width="760" height="300" rx="20" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/>
        <circle cx="240" cy="155" r="105" fill="#FFFFFF" stroke="#211955" stroke-width="3.5"/>
        <polygon points="240,50 155,216 325,216" fill="rgba(20,184,148,0.12)" stroke="#14B894" stroke-width="2.5"/>
        <line x1="240" y1="155" x2="155" y2="216" stroke="#211955" stroke-width="3"/>
        <line x1="240" y1="155" x2="325" y2="216" stroke="#211955" stroke-width="3"/>
        <circle cx="240" cy="155" r="5" fill="#D93834"/>
        <circle cx="240" cy="50" r="5" fill="#211955"/>
        <circle cx="155" cy="216" r="5" fill="#211955"/>
        <circle cx="325" cy="216" r="5" fill="#211955"/>
        <text x="240" y="38" text-anchor="middle" fill="#211955" font-family="sans-serif" font-size="15" font-weight="bold">C (Sudut Keliling)</text>
        <text x="255" y="150" fill="#D93834" font-family="sans-serif" font-size="14" font-weight="bold">O (110°)</text>
        <text x="135" y="232" fill="#211955" font-family="sans-serif" font-size="15" font-weight="bold">A</text>
        <text x="340" y="232" fill="#211955" font-family="sans-serif" font-size="15" font-weight="bold">B</text>

        <rect x="410" y="48" width="310" height="204" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
        <text x="434" y="84" fill="#211955" font-family="sans-serif" font-size="16" font-weight="bold">Data Geometri Lingkaran:</text>
        <text x="434" y="118" fill="#334155" font-family="sans-serif" font-size="13">• Titik O adalah pusat lingkaran</text>
        <text x="434" y="146" fill="#334155" font-family="sans-serif" font-size="13">• Besar Sudut Pusat ∠AOB = 110°</text>
        <text x="434" y="174" fill="#334155" font-family="sans-serif" font-size="13">• Menghadap busur minor AB yang sama</text>
        <rect x="434" y="196" width="262" height="36" rx="10" fill="#FEF3C7"/>
        <text x="565" y="219" text-anchor="middle" fill="#92400E" font-family="sans-serif" font-size="13" font-weight="bold">Rumus: ∠ACB = ½ × ∠AOB</text>
      </svg>
    `),
  },
];

export const AUDIO_ISTIMA_PRESETS: AudioIstimaPreset[] = [
  {
    id: 'SYNTH_ISTIMA_HIWAR',
    label: 'Audio Istima’ Bahasa Arab — Hiwar Fil Madrasah (MA / MTs)',
    caption: 'Simak audio percakapan (Istima’) Bahasa Arab berikut sebelum menjawab soal',
    arabicScript:
      'السَّلَامُ عَلَيْكُمْ يَا أَحْمَدُ، أَيْنَ تَذْهَبُ الْآنَ؟ أَذْهَبُ إِلَى الْمَكْتَبَةِ لِقِرَاءَةِ كِتَابِ الْفِقْهِ وَالنَّحْوِ.',
    durationLabel: '00:14',
  },
  {
    id: 'SYNTH_ISTIMA_TAJWID',
    label: 'Audio Tilawah & Hukum Tajwid — Nun Mati / Tanwin',
    caption: 'Perhatikan bacaan dengung (Ghunnah) dan Idgham pada potongan ayat berikut',
    arabicScript: 'مَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ ۞ وَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ',
    durationLabel: '00:12',
  },
  {
    id: 'SYNTH_ISTIMA_QIRAAH',
    label: 'Audio Qira’atul Kutub — Matan Al-Ajurrumiyah Bab Kalam',
    caption: 'Simak pembacaan matan kitab berikut dengan saksama',
    arabicScript: 'الْكَلَامُ هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ، وَأَقْسَامُهُ ثَلَاثَةٌ: اِسْمٌ وَفِعْلٌ وَحَرْفٌ جَاءَ لِمَعْنًى.',
    durationLabel: '00:15',
  },
];

/**
 * Compresses an uploaded image File into a lightweight DataURL (max width 900px)
 * so it can be persisted safely in localStorage.
 */
export function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const result = reader.result as string;
      if (file.type === 'image/svg+xml') {
        resolve(result);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const maxW = 860;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Synthesizes and plays a clean Arabic speech / Web Audio recitation cue
 * for built-in Istima' presets so Listening comprehension works 100% offline.
 */
export function playSynthIstimaPreset(
  presetId: string,
  onProgress?: (ratio: number) => void,
  onEnded?: () => void
): () => void {
  const preset =
    AUDIO_ISTIMA_PRESETS.find((p) => p.id === presetId) || AUDIO_ISTIMA_PRESETS[0];

  let stopped = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let audioCtx: AudioContext | null = null;

  // Attempt native Arabic SpeechSynthesis if available in browser
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(preset.arabicScript);
      utter.lang = 'ar-SA';
      utter.rate = 0.88;
      window.speechSynthesis.speak(utter);
    } catch {
      // Fallback to Web Audio API harmonic cadence
    }
  }

  // Play gentle harmonic recitation cadence notes via Web Audio API
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtx();
    const notes = [293.66, 329.63, 349.23, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66];
    notes.forEach((freq, idx) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.65);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime + idx * 0.65);
      gain.gain.exponentialRampToValueAtTime(0.11, audioCtx.currentTime + idx * 0.65 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.65 + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.65);
      osc.stop(audioCtx.currentTime + idx * 0.65 + 0.62);
    });
  } catch {
    // Ignore audio context restriction
  }

  const totalMs = 6000;
  const start = Date.now();
  intervalId = setInterval(() => {
    if (stopped) return;
    const elapsed = Date.now() - start;
    const ratio = Math.min(1, elapsed / totalMs);
    onProgress?.(ratio);
    if (ratio >= 1) {
      if (intervalId) clearInterval(intervalId);
      onEnded?.();
    }
  }, 80);

  return () => {
    stopped = true;
    if (intervalId) clearInterval(intervalId);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
    }
  };
}
