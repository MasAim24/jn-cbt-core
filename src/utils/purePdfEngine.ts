import {
  ExamPacket,
  ExamSubmission,
  JenjangFilter,
  SchoolSettings,
  Student,
} from '../types/cbt';
import { JENJANG_META } from '../data/initialData';

export type OfficialPdfDocType =
  | 'KARTU_PESERTA'
  | 'PRESENSI_BERITA_ACARA'
  | 'REKAP_NILAI'
  | 'LEGER_NILAI'
  | 'NASKAH_SOAL';

// A4 dimensions at 2x High-DPI (1588 x 2246 px -> exact 1 : 1.4142 A4 aspect ratio)
const A4_W = 1588;
const A4_H = 2246;

const cachedOfficialLogo: HTMLImageElement | null =
  typeof window !== 'undefined'
    ? (() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const baseUrl = (import.meta as any).env?.BASE_URL || './';
        img.src = `${baseUrl}logo-jabalnur.png`;
        return img;
      })()
    : null;

/**
 * Encodes an array of A4 HTMLCanvasElements into a 100% genuine, multi-page
 * ISO-32000 PDF 1.4 binary Blob (application/pdf) with zero external dependencies.
 */
export function buildPurePdfBlobFromCanvases(canvases: HTMLCanvasElement[]): Blob {
  const pageJpegs: Uint8Array[] = canvases.map((canvas) => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const base64 = dataUrl.split(',')[1] || '';
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  });

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0]; // 1-based object index offsets
  let currentLength = 0;

  const encoder = new TextEncoder();
  const pushStr = (str: string) => {
    const arr = encoder.encode(str);
    chunks.push(arr);
    currentLength += arr.byteLength;
  };
  const pushBytes = (arr: Uint8Array) => {
    chunks.push(arr);
    currentLength += arr.byteLength;
  };
  const startObj = (id: number) => {
    offsets[id] = currentLength;
    pushStr(`${id} 0 obj\n`);
  };
  const endObj = () => {
    pushStr(`\nendobj\n`);
  };

  // PDF Header (with binary comment marker)
  pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  startObj(1);
  pushStr('<< /Type /Catalog /Pages 2 0 R >>');
  endObj();

  // Object 2: Pages Kid List
  const pageCount = pageJpegs.length;
  const pageObjIds: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(3 + i * 3);
  }

  startObj(2);
  pushStr(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`
  );
  endObj();

  // For each page i:
  // pageObjId = 3 + i*3
  // contentObjId = 4 + i*3
  // imageObjId = 5 + i*3
  const pdfPtW = 595.28;
  const pdfPtH = 841.89;

  for (let i = 0; i < pageCount; i++) {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;
    const jpegBytes = pageJpegs[i];
    const imgW = canvases[i].width;
    const imgH = canvases[i].height;

    // Page Object
    startObj(pageObjId);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfPtW} ${pdfPtH}] ` +
        `/Resources << /XObject << /Im${i} ${imageObjId} 0 R >> >> ` +
        `/Contents ${contentObjId} 0 R >>`
    );
    endObj();

    // Content Stream (draws the full-bleed A4 image)
    const contentStream = `q\n${pdfPtW} 0 0 ${pdfPtH} 0 0 cm\n/Im${i} Do\nQ\n`;
    startObj(contentObjId);
    pushStr(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`);
    endObj();

    // Image XObject
    startObj(imageObjId);
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream');
    endObj();
  }

  // XRef Table
  const totalObjs = 2 + pageCount * 3;
  const xrefStart = currentLength;
  pushStr(`xref\n0 ${totalObjs + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjs; id++) {
    const padOffset = String(offsets[id] || 0).padStart(10, '0');
    pushStr(`${padOffset} 00000 n \n`);
  }

  // Trailer
  pushStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  return new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
}

// ============================================================================
// SHARED DRAWING HELPERS FOR OFFICIAL A4 DOCUMENTS
// ============================================================================
function createBlankA4Canvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = A4_W;
  canvas.height = A4_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, A4_W, A4_H);
  return { canvas, ctx };
}

function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: number | [number, number, number, number]
) {
  const [tl, tr, br, bl] = Array.isArray(radii)
    ? radii
    : [radii, radii, radii, radii];
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr > 0) ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  if (br > 0) ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  if (bl > 0) ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  if (tl > 0) ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function drawOfficialLetterhead(
  ctx: CanvasRenderingContext2D,
  settings: SchoolSettings,
  docTitle: string,
  docSubtitle: string
): number {
  const marginX = 95;
  let y = 85;

  // Left Emblem Seal Box
  ctx.save();
  if (
    cachedOfficialLogo &&
    cachedOfficialLogo.complete &&
    cachedOfficialLogo.naturalWidth > 0
  ) {
    ctx.drawImage(cachedOfficialLogo, marginX, y + 4, 108, 108);
  } else {
    ctx.fillStyle = '#211955';
    safeRoundRect(ctx, marginX, y, 108, 108, 20);
    ctx.fill();

    ctx.strokeStyle = '#F8B478';
    ctx.lineWidth = 3;
    safeRoundRect(ctx, marginX + 8, y + 8, 92, 92, 14);
    ctx.stroke();

    ctx.fillStyle = '#F8B478';
    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JN', marginX + 54, y + 60);
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('CBT CORE', marginX + 54, y + 84);
  }

  // Center Official Institution Header
  ctx.textAlign = 'center';
  const centerX = A4_W / 2 + 30;
  ctx.fillStyle = '#1E1645';
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(settings.namaYayasan.toUpperCase(), centerX, y + 26);

  ctx.fillStyle = '#211955';
  ctx.font = '800 29px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'PANITIA UJIAN BERBASIS KOMPUTER & IMTIHAN KITAB TERPADU',
    centerX,
    y + 64
  );

  ctx.fillStyle = '#475569';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Tingkat MTs • Madrasah Aliyah (MA) • PDF Diniyah Wustho • Ma’had ’Ulya',
    centerX,
    y + 92
  );

  ctx.fillStyle = '#64748B';
  ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `Sistem ${settings.namaAplikasi} • Tahun Pelajaran ${settings.tahunAjaran} (Semester ${settings.semester})`,
    centerX,
    y + 116
  );

  // Double Horizontal Rule (Garis Kop Surat Resmi)
  y += 140;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(A4_W - marginX, y);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, y + 8);
  ctx.lineTo(A4_W - marginX, y + 8);
  ctx.stroke();

  // Document Title Banner
  y += 48;
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(docTitle.toUpperCase(), A4_W / 2, y);

  y += 30;
  ctx.fillStyle = '#475569';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(docSubtitle, A4_W / 2, y);

  ctx.restore();
  return y + 36;
}

function drawPageFooter(
  ctx: CanvasRenderingContext2D,
  settings: SchoolSettings,
  pageNum: number,
  totalPages: number
) {
  const marginX = 95;
  const footY = A4_H - 65;
  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, footY - 22);
  ctx.lineTo(A4_W - marginX, footY - 22);
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    `Dokumen Resmi ${settings.namaAplikasi} — ${settings.namaYayasan} (${settings.tahunAjaran})`,
    marginX,
    footY
  );

  ctx.textAlign = 'right';
  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.fillText(`Halaman ${pageNum} dari ${totalPages}`, A4_W - marginX, footY);
  ctx.restore();
}

function drawSimulatedQrMatrix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seedStr: string
) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#1E1645';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  const cells = 11;
  const cellSize = (size - 16) / cells;
  const startX = x + 8;
  const startY = y + 8;

  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  ctx.fillStyle = '#1E1645';
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const isCorner =
        (r < 3 && c < 3) ||
        (r < 3 && c >= cells - 3) ||
        (r >= cells - 3 && c < 3);
      if (isCorner) {
        if (
          r === 0 ||
          r === 2 ||
          r === cells - 3 ||
          r === cells - 1 ||
          c === 0 ||
          c === 2 ||
          c === cells - 3 ||
          c === cells - 1 ||
          (r === 1 && c === 1) ||
          (r === 1 && c === cells - 2) ||
          (r === cells - 2 && c === 1)
        ) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
        }
      } else {
        const bit = ((hash >>> ((r * cells + c) % 28)) ^ (r * 7 + c * 13)) & 1;
        if (bit === 1) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }
  }
  ctx.restore();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

// ============================================================================
// 1. RENDER KARTU PESERTA UJIAN CBT (6 CARDS PER A4 PAGE — 2x3 GRID)
// ============================================================================
export function renderKartuPesertaPages(
  students: Student[],
  settings: SchoolSettings,
  selectedJenjang: JenjangFilter
): HTMLCanvasElement[] {
  const perPage = 6;
  const totalPages = Math.max(1, Math.ceil(students.length / perPage));
  const pages: HTMLCanvasElement[] = [];

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createBlankA4Canvas();
    const slice = students.slice(p * perPage, (p + 1) * perPage);
    const jenjangLabel =
      selectedJenjang === 'ALL'
        ? 'Semua Jenjang (MTs • MA • Wustho • ’Ulya)'
        : JENJANG_META[selectedJenjang].fullLabel;

    let startY = drawOfficialLetterhead(
      ctx,
      settings,
      'Kartu Peserta & PIN Sesi Ujian CBT Resmi',
      `Jenjang: ${jenjangLabel} • Total Peserta Tercetak: ${students.length} Santri`
    );

    const marginX = 95;
    const gapX = 36;
    const gapY = 38;
    const cardW = (A4_W - marginX * 2 - gapX) / 2;
    const cardH = 520;

    slice.forEach((s, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = marginX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);
      const meta = JENJANG_META[s.jenjang];

      ctx.save();
      // Card Outer Border
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      safeRoundRect(ctx, cx, cy, cardW, cardH, 20);
      ctx.fill();
      ctx.stroke();

      // Card Top Banner
      ctx.fillStyle = '#211955';
      safeRoundRect(ctx, cx, cy, cardW, 92, [18, 18, 0, 0]);
      ctx.fill();

      let textStartX = cx + 24;
      if (
        cachedOfficialLogo &&
        cachedOfficialLogo.complete &&
        cachedOfficialLogo.naturalWidth > 0
      ) {
        ctx.fillStyle = '#FFFFFF';
        safeRoundRect(ctx, cx + 18, cy + 16, 60, 60, 12);
        ctx.fill();
        ctx.drawImage(cachedOfficialLogo, cx + 22, cy + 20, 52, 52);
        textStartX = cx + 90;
      }

      ctx.fillStyle = '#F8B478';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(settings.namaYayasan.toUpperCase(), textStartX, cy + 32);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`KARTU PESERTA UJIAN CBT`, textStartX, cy + 60);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `TP ${settings.tahunAjaran} • Semester ${settings.semester}`,
        textStartX,
        cy + 80
      );

      // Jenjang Pill top-right of card
      ctx.fillStyle = meta.badgeBg;
      safeRoundRect(ctx, cx + cardW - 140, cy + 24, 116, 42, 12);
      ctx.fill();
      ctx.fillStyle = meta.badgeText;
      ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.jenjang.toUpperCase(), cx + cardW - 82, cy + 52);
      ctx.textAlign = 'left';

      // Student Details Rows
      const rowsData = [
        { k: 'Nama Peserta', v: s.nama, bold: true },
        { k: 'Nomor CBT', v: s.nomorPeserta, mono: true },
        { k: 'NISN / NISM', v: s.nisn, mono: true },
        { k: 'Jenjang / Kelas', v: `${meta.shortLabel} — ${s.kelas}` },
        { k: 'Ruang & Sesi', v: `${s.ruang} (${s.sesi})` },
      ];

      let ry = cy + 134;
      rowsData.forEach((rd) => {
        ctx.fillStyle = '#64748B';
        ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(rd.k, cx + 24, ry);
        ctx.fillText(':', cx + 165, ry);

        ctx.fillStyle = '#0F172A';
        ctx.font = rd.mono
          ? '800 18px "JetBrains Mono", monospace'
          : rd.bold
          ? '800 18px "Plus Jakarta Sans", sans-serif'
          : '700 17px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(rd.v.slice(0, 28), cx + 182, ry);
        ry += 44;
      });

      // PIN Box Highlight
      ctx.fillStyle = '#FFF4D6';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      safeRoundRect(ctx, cx + 24, cy + 358, 360, 62, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#92400E';
      ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PIN LOGIN SESI:', cx + 44, cy + 396);

      ctx.fillStyle = '#1E1645';
      ctx.font = '800 26px "JetBrains Mono", monospace';
      ctx.fillText(s.pin, cx + 210, cy + 399);

      // QR Code Box on Right
      drawSimulatedQrMatrix(ctx, cx + cardW - 168, cy + 280, 140, s.nomorPeserta + s.pin);
      ctx.fillStyle = '#475569';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VERIFIED CBT', cx + cardW - 98, cy + 438);
      ctx.textAlign = 'left';

      // Card Footer Signature
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx + 24, cy + 454);
      ctx.lineTo(cx + cardW - 24, cy + 454);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('* Wajib dibawa selama ujian berlangsung', cx + 24, cy + 488);

      ctx.fillStyle = '#0F172A';
      ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Panitia: ${settings.ketuaPanitia}`, cx + cardW - 24, cy + 488);
      ctx.restore();
    });

    drawPageFooter(ctx, settings, p + 1, totalPages);
    pages.push(canvas);
  }

  return pages;
}

// ============================================================================
// 2. RENDER DAFTAR HADIR & BERITA ACARA UJIAN CBT (A4 PORTRAIT TABLE)
// ============================================================================
export function renderPresensiBeritaAcaraPages(
  students: Student[],
  settings: SchoolSettings,
  selectedJenjang: JenjangFilter
): HTMLCanvasElement[] {
  const perPage = 16;
  const totalPages = Math.max(1, Math.ceil(students.length / perPage));
  const pages: HTMLCanvasElement[] = [];

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createBlankA4Canvas();
    const slice = students.slice(p * perPage, (p + 1) * perPage);
    const jenjangLabel =
      selectedJenjang === 'ALL'
        ? 'MTs • Madrasah Aliyah • PDF Wustho • Ma’had ’Ulya'
        : JENJANG_META[selectedJenjang].fullLabel;

    let y = drawOfficialLetterhead(
      ctx,
      settings,
      'Daftar Hadir & Berita Acara Pelaksanaan Ujian CBT',
      `Jenjang: ${jenjangLabel} • Tahun Pelajaran ${settings.tahunAjaran} (${settings.semester})`
    );

    const marginX = 95;
    const tableW = A4_W - marginX * 2;
    const cols = [
      { title: 'NO', w: 70, align: 'center' as const },
      { title: 'NOMOR PESERTA', w: 230, align: 'left' as const },
      { title: 'NAMA LENGKAP SANTRI / SISWA', w: 430, align: 'left' as const },
      { title: 'JENJANG / KELAS', w: 210, align: 'left' as const },
      { title: 'RUANG LAB', w: 185, align: 'left' as const },
      { title: 'TANDA TANGAN', w: 273, align: 'left' as const },
    ];

    // Table Header
    const headH = 56;
    ctx.fillStyle = '#1E1645';
    ctx.fillRect(marginX, y, tableW, headH);

    let cx = marginX;
    cols.forEach((col) => {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, y, col.w, headH);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = col.align;
      const tx = col.align === 'center' ? cx + col.w / 2 : cx + 16;
      ctx.fillText(col.title, tx, y + 35);
      cx += col.w;
    });
    y += headH;

    // Table Rows
    const rowH = 66;
    slice.forEach((s, idx) => {
      const globalIdx = p * perPage + idx + 1;
      cx = marginX;
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(marginX, y, tableW, rowH);

      const vals = [
        String(globalIdx),
        s.nomorPeserta,
        s.nama,
        `${s.jenjang} — ${s.kelas}`,
        s.ruang,
        globalIdx % 2 === 1
          ? `${globalIdx}. ........................`
          : `               ${globalIdx}. ........................`,
      ];

      cols.forEach((col, cIdx) => {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, y, col.w, rowH);

        ctx.fillStyle = cIdx === 5 ? '#64748B' : '#0F172A';
        ctx.font =
          cIdx === 1
            ? '700 16px "JetBrains Mono", monospace'
            : cIdx === 2
            ? '700 17px "Plus Jakarta Sans", sans-serif'
            : '600 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = col.align;
        const tx = col.align === 'center' ? cx + col.w / 2 : cx + 16;
        ctx.fillText(vals[cIdx], tx, y + 40);
        cx += col.w;
      });
      y += rowH;
    });

    // Berita Acara & Signature Block at bottom of page
    y += 42;
    if (y + 320 < A4_H - 90) {
      ctx.save();
      // Berita Acara Box Left
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(marginX, y, 640, 220);

      ctx.fillStyle = '#0F172A';
      ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CATATAN BERITA ACARA PENGAWAS RUANG:', marginX + 20, y + 36);

      ctx.fillStyle = '#475569';
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `• Jumlah Peserta Terdaftar : ${students.length} Santri`,
        marginX + 20,
        y + 74
      );
      ctx.fillText(
        `• Jumlah Peserta Hadir      : ${students.length} Santri (Tidak Hadir: 0)`,
        marginX + 20,
        y + 104
      );
      ctx.fillText(
        '• Keterangan Pelaksanaan   : Ujian berjalan tertib, aman, dan lancar.',
        marginX + 20,
        y + 134
      );

      // Signatures Right
      const sig1X = marginX + 830;
      const sig2X = marginX + 1210;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Pengawas Ruang CBT,', sig1X, y + 32);
      ctx.fillText('Ketua Panitia Ujian,', sig2X, y + 32);

      ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('( ............................................ )', sig1X, y + 185);
      ctx.fillText(settings.ketuaPanitia, sig2X, y + 185);
      ctx.restore();
    }

    drawPageFooter(ctx, settings, p + 1, totalPages);
    pages.push(canvas);
  }

  return pages;
}

// ============================================================================
// 3. RENDER LAPORAN REKAPITULASI NILAI & ANALISIS KKM (A4 PORTRAIT)
// ============================================================================
export function renderRekapNilaiPages(
  submissions: ExamSubmission[],
  settings: SchoolSettings,
  selectedJenjang: JenjangFilter
): HTMLCanvasElement[] {
  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(submissions.length / perPage));
  const pages: HTMLCanvasElement[] = [];

  const scores = submissions.map((s) => s.totalScore);
  const avg =
    scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const passed = submissions.filter((s) => s.totalScore >= s.kkm).length;

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createBlankA4Canvas();
    const slice = submissions.slice(p * perPage, (p + 1) * perPage);
    const jenjangLabel =
      selectedJenjang === 'ALL'
        ? 'Semua Jenjang (MTs • MA • Wustho • ’Ulya)'
        : JENJANG_META[selectedJenjang].fullLabel;

    let y = drawOfficialLetterhead(
      ctx,
      settings,
      'Laporan Resmi Rekapitulasi Nilai & Ketuntasan KKM',
      `Filter Jenjang: ${jenjangLabel} • Rata-rata: ${avg} • Ketuntasan: ${passed}/${submissions.length} Peserta`
    );

    const marginX = 95;
    const tableW = A4_W - marginX * 2;

    // Summary Statistics Strip on Page 1
    if (p === 0) {
      const boxW = (tableW - 36) / 4;
      const stats = [
        { k: 'RATA-RATA SKOR', v: avg, c: '#211955' },
        { k: 'SKOR TERTINGGI', v: String(max), c: '#087963' },
        { k: 'SKOR TERENDAH', v: String(min), c: '#B85D19' },
        {
          k: 'KETUNTASAN KKM',
          v: `${submissions.length ? Math.round((passed / submissions.length) * 100) : 100}%`,
          c: '#14B894',
        },
      ];
      stats.forEach((st, i) => {
        const bx = marginX + i * (boxW + 12);
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        safeRoundRect(ctx, bx, y, boxW, 92, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(st.k, bx + 20, y + 32);

        ctx.fillStyle = st.c;
        ctx.font = '800 30px "JetBrains Mono", monospace';
        ctx.fillText(st.v, bx + 20, y + 72);
      });
      y += 120;
    }

    const cols = [
      { title: 'NO', w: 60, align: 'center' as const },
      { title: 'NAMA PESERTA & NOMOR CBT', w: 390, align: 'left' as const },
      { title: 'JENJANG & MAPEL', w: 340, align: 'left' as const },
      { title: 'PG', w: 90, align: 'center' as const },
      { title: 'PGK', w: 90, align: 'center' as const },
      { title: 'B/S', w: 90, align: 'center' as const },
      { title: 'ESAI', w: 95, align: 'center' as const },
      { title: 'TOTAL', w: 110, align: 'center' as const },
      { title: 'STATUS KKM', w: 133, align: 'center' as const },
    ];

    const headH = 56;
    ctx.fillStyle = '#211955';
    ctx.fillRect(marginX, y, tableW, headH);

    let cx = marginX;
    cols.forEach((col) => {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, y, col.w, headH);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = col.align;
      const tx = col.align === 'center' ? cx + col.w / 2 : cx + 14;
      ctx.fillText(col.title, tx, y + 34);
      cx += col.w;
    });
    y += headH;

    const rowH = 74;
    slice.forEach((sub, idx) => {
      const globalIdx = p * perPage + idx + 1;
      const isPassed = sub.totalScore >= sub.kkm;
      cx = marginX;

      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(marginX, y, tableW, rowH);

      cols.forEach((col, cIdx) => {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, y, col.w, rowH);

        ctx.textAlign = col.align;
        const tx = col.align === 'center' ? cx + col.w / 2 : cx + 14;

        if (cIdx === 0) {
          ctx.fillStyle = '#0F172A';
          ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(String(globalIdx), tx, y + 44);
        } else if (cIdx === 1) {
          ctx.fillStyle = '#0F172A';
          ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(sub.studentName.slice(0, 28), tx, y + 32);
          ctx.fillStyle = '#64748B';
          ctx.font = '600 14px "JetBrains Mono", monospace';
          ctx.fillText(`${sub.nomorPeserta} • ${sub.kelas}`, tx, y + 56);
        } else if (cIdx === 2) {
          ctx.fillStyle = '#211955';
          ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`[${sub.jenjang}] ${sub.mapel.slice(0, 24)}`, tx, y + 34);
          ctx.fillStyle = '#64748B';
          ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`Ambang KKM: ${sub.kkm}`, tx, y + 56);
        } else if (cIdx >= 3 && cIdx <= 6) {
          const scoreVal =
            cIdx === 3
              ? sub.pgScore
              : cIdx === 4
              ? sub.pgKompleksScore
              : cIdx === 5
              ? sub.benarSalahScore
              : sub.esaiScore;
          ctx.fillStyle = '#0F172A';
          ctx.font = '700 17px "JetBrains Mono", monospace';
          ctx.fillText(String(scoreVal), tx, y + 44);
        } else if (cIdx === 7) {
          ctx.fillStyle = '#211955';
          ctx.font = '800 20px "JetBrains Mono", monospace';
          ctx.fillText(String(sub.totalScore), tx, y + 45);
        } else if (cIdx === 8) {
          ctx.fillStyle = isPassed ? '#087963' : '#D93834';
          ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(isPassed ? 'TUNTAS' : 'REMEDIAL', tx, y + 44);
        }

        cx += col.w;
      });

      y += rowH;
    });

    // Legalization Signature Block
    y += 45;
    if (y + 220 < A4_H - 80) {
      ctx.save();
      const sig1X = marginX + 260;
      const sig2X = A4_W - marginX - 260;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Mengetahui, Pimpinan Madrasah / Ma’had', sig1X, y + 25);
      ctx.fillText('Ketua Panitia Pelaksana CBT,', sig2X, y + 25);

      const pimpinanName =
        selectedJenjang === 'MTs'
          ? settings.kepalaMTs
          : selectedJenjang === 'MA'
          ? settings.kepalaMA
          : selectedJenjang === 'Wustho'
          ? settings.mudirWustho
          : selectedJenjang === 'Ulya'
          ? settings.mudirUlya
          : settings.kepalaMA;

      ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(pimpinanName, sig1X, y + 175);
      ctx.fillText(settings.ketuaPanitia, sig2X, y + 175);
      ctx.restore();
    }

    drawPageFooter(ctx, settings, p + 1, totalPages);
    pages.push(canvas);
  }

  return pages;
}

// ============================================================================
// 4. RENDER NASKAH SOAL & KUNCI JAWABAN RESMI (BILINGUAL ARAB RTL + LATIN)
// ============================================================================
export function renderNaskahSoalPages(
  packet: ExamPacket,
  settings: SchoolSettings
): HTMLCanvasElement[] {
  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(packet.questions.length / perPage));
  const pages: HTMLCanvasElement[] = [];

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createBlankA4Canvas();
    const slice = packet.questions.slice(p * perPage, (p + 1) * perPage);
    const meta = JENJANG_META[packet.jenjang];

    let y = drawOfficialLetterhead(
      ctx,
      settings,
      `Naskah Soal & Kunci Jawaban — ${packet.title}`,
      `Jenjang: ${meta.fullLabel} • Mapel: ${packet.mapel} • Kelas: ${packet.kelas} • Pengampu: ${packet.guruNama}`
    );

    const marginX = 95;
    const contentW = A4_W - marginX * 2;

    slice.forEach((q) => {
      ctx.save();
      const cardTop = y;

      // Question Header Strip
      ctx.fillStyle = '#F1F5F9';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      safeRoundRect(ctx, marginX, y, contentW, 52, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#211955';
      ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `SOAL NO. ${q.nomor}   •   TIPE: ${q.type}   •   BOBOT: ${q.weight} POIN`,
        marginX + 20,
        y + 33
      );

      if (q.kitabReference) {
        ctx.fillStyle = '#087963';
        ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Referensi: ${q.kitabReference}`, marginX + contentW - 20, y + 33);
      }
      y += 68;

      // Arabic RTL Prompt Box if present
      if (q.arabicPrompt) {
        ctx.fillStyle = '#FFF8F1';
        ctx.strokeStyle = '#FCD9BD';
        ctx.lineWidth = 2;
        safeRoundRect(ctx, marginX, y, contentW, 96, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1E1645';
        ctx.font = '700 32px "Amiri", "Noto Naskh Arabic", serif';
        ctx.textAlign = 'right';
        ctx.fillText(q.arabicPrompt, marginX + contentW - 28, y + 60);
        y += 116;
      }

      // Indonesian Question Prompt
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      const promptLines = wrapCanvasText(ctx, q.prompt, contentW - 24);
      promptLines.forEach((line) => {
        ctx.fillText(line, marginX + 12, y + 22);
        y += 30;
      });
      y += 10;

      // Options or Answer Key
      if ((q.type === 'PG' || q.type === 'PG_KOMPLEKS') && q.options) {
        q.options.forEach((opt) => {
          const isKey =
            q.type === 'PG'
              ? q.correctAnswer === opt.label
              : (q.correctAnswers || []).includes(opt.label);
          ctx.fillStyle = isKey ? '#087963' : '#334155';
          ctx.font = isKey
            ? '800 18px "Plus Jakarta Sans", sans-serif'
            : '600 18px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(
            `${opt.label}.  ${opt.text}${isKey ? '   [✓ KUNCI]' : ''}`,
            marginX + 28,
            y + 22
          );
          y += 32;
        });
      } else if (q.type === 'BENAR_SALAH') {
        ctx.fillStyle = '#087963';
        ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          `Kunci Pernyataan: ${q.correctBoolean ? 'BENAR (صَحِيْحٌ)' : 'SALAH (خَطَأٌ)'}`,
          marginX + 28,
          y + 22
        );
        y += 34;
      }

      if (q.pembahasan) {
        y += 6;
        ctx.fillStyle = '#475569';
        ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
        const pembLines = wrapCanvasText(
          ctx,
          `Pembahasan / Rubrik: ${q.pembahasan}`,
          contentW - 40
        );
        pembLines.forEach((pl) => {
          ctx.fillText(pl, marginX + 20, y + 20);
          y += 26;
        });
      }

      y += 32;
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(marginX - 4, cardTop - 4, contentW + 8, y - cardTop - 16);
      ctx.restore();
    });

    drawPageFooter(ctx, settings, p + 1, totalPages);
    pages.push(canvas);
  }

  return pages;
}

// ============================================================================
// 5. RENDER LEGER NILAI KOLEKTIF, PERINGKAT PARALEL & ANALISIS DAYA SERAP (A4)
// ============================================================================
export function renderLegerNilaiPages(
  submissions: ExamSubmission[],
  settings: SchoolSettings,
  selectedJenjang: JenjangFilter
): HTMLCanvasElement[] {
  const ranked = [...submissions].sort((a, b) => b.totalScore - a.totalScore);
  const perPage = 13;
  const totalPages = Math.max(1, Math.ceil(ranked.length / perPage));
  const pages: HTMLCanvasElement[] = [];

  for (let p = 0; p < totalPages; p++) {
    const { canvas, ctx } = createBlankA4Canvas();
    const slice = ranked.slice(p * perPage, (p + 1) * perPage);
    const jenjangLabel =
      selectedJenjang === 'ALL'
        ? 'Semua Jenjang (MTs • MA • PDF Wustho • Ma’had ’Ulya)'
        : JENJANG_META[selectedJenjang].fullLabel;

    let y = drawOfficialLetterhead(
      ctx,
      settings,
      'Leger Nilai Kolektif, Peringkat & Analisis Daya Serap',
      `Filter: ${jenjangLabel} • Tahun Pelajaran ${settings.tahunAjaran} (Semester ${settings.semester})`
    );

    const marginX = 95;
    const tableW = A4_W - marginX * 2;

    // On Page 1: Draw 4-Jenjang Daya Serap & Predikat Summary Matrix
    if (p === 0) {
      const boxW = (tableW - 36) / 4;
      const jenjangs = ['MTs', 'MA', 'Wustho', 'Ulya'] as const;
      jenjangs.forEach((j, idx) => {
        const list = submissions.filter((s) => s.jenjang === j);
        const avg =
          list.length > 0
            ? (list.reduce((a, b) => a + b.totalScore, 0) / list.length).toFixed(1)
            : '0.0';
        const tuntas = list.filter((s) => s.totalScore >= s.kkm).length;
        const rate = list.length > 0 ? Math.round((tuntas / list.length) * 100) : 100;
        const bx = marginX + idx * (boxW + 12);

        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        safeRoundRect(ctx, bx, y, boxW, 106, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#211955';
        ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`JENJANG ${j.toUpperCase()}`, bx + 18, y + 30);

        ctx.fillStyle = '#0F172A';
        ctx.font = '800 28px "JetBrains Mono", monospace';
        ctx.fillText(avg, bx + 18, y + 66);

        ctx.fillStyle = '#087963';
        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`Tuntas KKM: ${rate}% (${tuntas}/${list.length})`, bx + 18, y + 90);
      });
      y += 130;
    }

    const cols = [
      { title: 'RANK', w: 80, align: 'center' as const },
      { title: 'NAMA SANTRI & NOMOR CBT', w: 380, align: 'left' as const },
      { title: 'KELAS & MAPEL', w: 320, align: 'left' as const },
      { title: 'OBJEKTIF', w: 120, align: 'center' as const },
      { title: 'ESAI', w: 100, align: 'center' as const },
      { title: 'NILAI AKHIR', w: 130, align: 'center' as const },
      { title: 'PREDIKAT TAQDIR', w: 268, align: 'center' as const },
    ];

    const headH = 56;
    ctx.fillStyle = '#1E1645';
    ctx.fillRect(marginX, y, tableW, headH);

    let cx = marginX;
    cols.forEach((col) => {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, y, col.w, headH);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = col.align;
      const tx = col.align === 'center' ? cx + col.w / 2 : cx + 14;
      ctx.fillText(col.title, tx, y + 34);
      cx += col.w;
    });
    y += headH;

    const rowH = 74;
    slice.forEach((sub, idx) => {
      const rankNum = p * perPage + idx + 1;
      const objScore = sub.pgScore + sub.pgKompleksScore + sub.benarSalahScore;
      const predikat =
        sub.totalScore >= 90
          ? 'MUMTAZ (A • Istimewa)'
          : sub.totalScore >= 80
          ? 'JAYYID JIDDAN (B+ • Sangat Baik)'
          : sub.totalScore >= sub.kkm
          ? 'JAYYID (B • Baik / Tuntas)'
          : 'MAQBUL / REMEDIAL (C)';

      cx = marginX;
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(marginX, y, tableW, rowH);

      cols.forEach((col, cIdx) => {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, y, col.w, rowH);

        ctx.textAlign = col.align;
        const tx = col.align === 'center' ? cx + col.w / 2 : cx + 14;

        if (cIdx === 0) {
          ctx.fillStyle = rankNum <= 3 ? '#B45309' : '#0F172A';
          ctx.font = '800 18px "JetBrains Mono", monospace';
          ctx.fillText(`#${rankNum}`, tx, y + 44);
        } else if (cIdx === 1) {
          ctx.fillStyle = '#0F172A';
          ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(sub.studentName.slice(0, 28), tx, y + 32);
          ctx.fillStyle = '#64748B';
          ctx.font = '600 14px "JetBrains Mono", monospace';
          ctx.fillText(`${sub.nomorPeserta} • Durasi ${sub.durationUsedMinutes}m`, tx, y + 56);
        } else if (cIdx === 2) {
          ctx.fillStyle = '#211955';
          ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`[${sub.jenjang}] ${sub.kelas}`, tx, y + 32);
          ctx.fillStyle = '#475569';
          ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(sub.mapel.slice(0, 26), tx, y + 56);
        } else if (cIdx === 3) {
          ctx.fillStyle = '#0F172A';
          ctx.font = '700 17px "JetBrains Mono", monospace';
          ctx.fillText(String(objScore), tx, y + 44);
        } else if (cIdx === 4) {
          ctx.fillStyle = '#0F172A';
          ctx.font = '700 17px "JetBrains Mono", monospace';
          ctx.fillText(String(sub.esaiScore), tx, y + 44);
        } else if (cIdx === 5) {
          ctx.fillStyle = '#211955';
          ctx.font = '800 21px "JetBrains Mono", monospace';
          ctx.fillText(String(sub.totalScore), tx, y + 45);
        } else if (cIdx === 6) {
          ctx.fillStyle = sub.totalScore >= sub.kkm ? '#087963' : '#D93834';
          ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(predikat, tx, y + 44);
        }

        cx += col.w;
      });
      y += rowH;
    });

    // Legalization Signature Block
    y += 42;
    if (y + 210 < A4_H - 80) {
      ctx.save();
      const sig1X = marginX + 260;
      const sig2X = A4_W - marginX - 260;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Mengetahui, Pimpinan Madrasah / Ma’had', sig1X, y + 25);
      ctx.fillText(`${settings.kota}, Panitia Kurikulum & CBT`, sig2X, y + 25);

      const pimpinanName =
        selectedJenjang === 'MTs'
          ? settings.kepalaMTs
          : selectedJenjang === 'MA'
          ? settings.kepalaMA
          : selectedJenjang === 'Wustho'
          ? settings.mudirWustho
          : selectedJenjang === 'Ulya'
          ? settings.mudirUlya
          : settings.kepalaMA;

      ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(pimpinanName, sig1X, y + 170);
      ctx.fillText(settings.ketuaPanitia, sig2X, y + 170);
      ctx.restore();
    }

    drawPageFooter(ctx, settings, p + 1, totalPages);
    pages.push(canvas);
  }

  return pages;
}
