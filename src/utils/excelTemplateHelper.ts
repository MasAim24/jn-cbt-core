/**
 * Pure TypeScript Excel (.xlsx OpenXML) & CSV / Tab-Separated helper for JN ExamCBTCore.
 * - Generates real Microsoft Excel (.xlsx) workbooks (ZIP + OpenXML with styled header row & column widths)
 *   without external dependencies.
 * - Reads uploaded .xlsx files in the browser using Web API DecompressionStream('deflate-raw'),
 *   as well as .csv, .txt, and direct Tab-separated copy-paste from Excel / Google Sheets.
 */

import { Jenjang, NavTab, Teacher, TeacherPeran } from '../types/cbt';

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colIndexToLetter(index0: number): string {
  let n = index0 + 1;
  let s = '';
  while (n > 0) {
    const mod = (n - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    n = Math.floor((n - mod) / 26);
  }
  return s;
}

function colLetterToIndex(letters: string): number {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    const code = letters.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      col = col * 26 + (code - 64);
    } else if (code >= 97 && code <= 122) {
      col = col * 26 + (code - 96);
    }
  }
  return Math.max(0, col - 1);
}

interface ZipEntryInput {
  name: string;
  data: Uint8Array;
}

function createStoredZip(entries: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = entry.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // compression method: 0 (stored)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x5421, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // compression method: 0
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const c of centralParts) centralSize += c.length;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLen = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of localParts) {
    out.set(p, pos);
    pos += p.length;
  }
  for (const p of centralParts) {
    out.set(p, pos);
    pos += p.length;
  }
  out.set(eocd, pos);
  return out;
}

export interface ExcelWorkbookSheetSpec {
  sheetName: string;
  headers: string[];
  rows: string[][];
  colWidths?: number[];
}

/**
 * Generates a binary .xlsx workbook (Uint8Array) with one or more sheets.
 */
export function buildXlsxBinary(sheets: ExcelWorkbookSheetSpec[]): Uint8Array {
  const encoder = new TextEncoder();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets
  .map(
    (_, idx) =>
      `  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )
  .join('\n')}
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheets
  .map(
    (sh, idx) =>
      `    <sheet name="${escapeXml(sh.sheetName.slice(0, 31))}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`
  )
  .join('\n')}
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets
  .map(
    (_, idx) =>
      `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
  )
  .join('\n')}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  // Style 0 = normal cell, Style 1 = header cell (Royal Indigo #211955 background, white bold text), Style 2 = data cell with thin border
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11"/>
      <color rgb="FF1E1645"/>
      <name val="Calibri"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF211955"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD8D4EC"/></left>
      <right style="thin"><color rgb="FFD8D4EC"/></right>
      <top style="thin"><color rgb="FFD8D4EC"/></top>
      <bottom style="thin"><color rgb="FFD8D4EC"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  const entries: ZipEntryInput[] = [
    { name: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { name: '_rels/.rels', data: encoder.encode(rootRelsXml) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRelsXml) },
    { name: 'xl/styles.xml', data: encoder.encode(stylesXml) },
  ];

  sheets.forEach((sh, sheetIdx) => {
    const allRows = [sh.headers, ...sh.rows];
    const colsXml =
      sh.colWidths && sh.colWidths.length > 0
        ? `  <cols>\n${sh.colWidths
            .map(
              (w, i) =>
                `    <col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
            )
            .join('\n')}\n  </cols>\n`
        : '';

    const rowsXml = allRows
      .map((row, rIdx) => {
        const rowNum = rIdx + 1;
        const isHeader = rIdx === 0;
        const styleIdx = isHeader ? 1 : 2;
        const rowHeightAttr = isHeader ? ' ht="26" customHeight="1"' : ' ht="20" customHeight="1"';
        const cellsXml = row
          .map((cellVal, cIdx) => {
            const ref = `${colIndexToLetter(cIdx)}${rowNum}`;
            return `      <c r="${ref}" s="${styleIdx}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
              cellVal ?? ''
            )}</t></is></c>`;
          })
          .join('\n');
        return `    <row r="${rowNum}"${rowHeightAttr}>\n${cellsXml}\n    </row>`;
      })
      .join('\n');

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${colsXml}  <sheetData>
${rowsXml}
  </sheetData>
</worksheet>`;

    entries.push({
      name: `xl/worksheets/sheet${sheetIdx + 1}.xml`,
      data: encoder.encode(sheetXml),
    });
  });

  return createStoredZip(entries);
}

export function triggerXlsxDownload(filename: string, sheets: ExcelWorkbookSheetSpec[]): void {
  const bytes = buildXlsxBinary(sheets);
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads the official Excel (.xlsx) template for Bulk Teacher / Staff Import.
 */
export function downloadTeacherExcelTemplate(): void {
  const headers = [
    'Nama Lengkap Guru',
    'Jenjang (MTs/MA/Wustho/Ulya)',
    'Username Login',
    'Password Login',
    'Mata Pelajaran / Kitab (Opsional)',
    'Jabatan / Peran (Opsional)',
    'NIP / NIY (Opsional)',
    'No. WhatsApp (Opsional)',
    'Kelas Binaan (Opsional - Wali Kelas)',
  ];

  const sampleRows = [
    [
      'Ust. H. Abdurrahman, Lc., M.Ag.',
      'MA',
      'guru_fiqih_ma',
      'guru123',
      'Fiqih & Ushul Fiqih',
      'Guru Mapel',
      '198504122015031001',
      '0812-3456-7801',
      '',
    ],
    [
      'Ustadzah Siti Aisyah, S.Pd.',
      'MA',
      'guru_bio_ma',
      'guru123',
      'Biologi (MIPA)',
      'Guru Mapel',
      '199008172019032004',
      '0813-4567-8902',
      'XI MIPA',
    ],
    [
      'Ust. Muhammad Syauqi, S.Pd.I.',
      'MTs, MA',
      'guru_b_arab',
      'guru123',
      '',
      'Guru Mapel',
      '',
      '0852-1122-3344',
      '',
    ],
    [
      'KH. Ahmad Fauzan, M.Pd.',
      'Wustho, Ulya',
      'guru_nahwu',
      'guru123',
      'Nahwu & Shorof (Alfiyah)',
      'Guru Mapel',
      '',
      '',
      '',
    ],
  ];

  const guideHeaders = ['Kolom', 'Nama Kolom', 'Status', 'Keterangan & Contoh Pengisian'];
  const guideRows = [
    [
      'Kolom A',
      'Nama Lengkap Guru',
      'WAJIB DIISI',
      'Tuliskan nama lengkap beserta gelar depan/belakang. Contoh: Ust. Ahmad Fauzan, S.Pd.I.',
    ],
    [
      'Kolom B',
      'Jenjang (MTs/MA/Wustho/Ulya)',
      'UTAMA',
      'Isi MTs, MA, Wustho, atau Ulya. Jika mengajar di lebih dari 1 jenjang, pisahkan dengan koma (contoh: MTs, MA). Jika dikosongkan oleh Kamad, otomatis mengikuti jenjang Kamad.',
    ],
    [
      'Kolom C',
      'Username Login',
      'UTAMA (Otomatis jika kosong)',
      'Username untuk login ke portal CBT (contoh: guru_fiqih). Jika dikosongkan, sistem otomatis membuatkan username dari nama guru.',
    ],
    [
      'Kolom D',
      'Password Login',
      'UTAMA (Otomatis jika kosong)',
      'Password login guru. Jika dikosongkan, otomatis diisi: guru123',
    ],
    [
      'Kolom E',
      'Mata Pelajaran / Kitab (Opsional)',
      'OPSIONAL',
      'Boleh dikosongkan. Jika dikosongkan, status mapel menjadi Fleksibel dan guru bebas mengisi mapel saat membuat Paket Soal.',
    ],
    [
      'Kolom F',
      'Jabatan / Peran (Opsional)',
      'OPSIONAL',
      'Jika dikosongkan otomatis menjadi Guru Mapel. Pilihan lain: Wali Kelas, Pengawas CBT, Kepala Madrasah / Mudir, Koordinator Kurikulum.',
    ],
    [
      'Kolom G',
      'NIP / NIY (Opsional)',
      'OPSIONAL',
      'Boleh dikosongkan jika belum ada.',
    ],
    [
      'Kolom H',
      'No. WhatsApp (Opsional)',
      'OPSIONAL',
      'Nomor HP/WA aktif guru (boleh dikosongkan).',
    ],
    [
      'Kolom I',
      'Kelas Binaan (Opsional)',
      'OPSIONAL',
      'Hanya diisi jika berperan sebagai Wali Kelas (contoh: VIII-A atau XI MIPA).',
    ],
  ];

  triggerXlsxDownload('Template_Import_Guru_Mapel_JN_CBT.xlsx', [
    {
      sheetName: 'Data Guru Mapel',
      headers,
      rows: sampleRows,
      colWidths: [34, 26, 20, 18, 30, 22, 22, 20, 26],
    },
    {
      sheetName: 'Petunjuk Pengisian',
      headers: guideHeaders,
      rows: guideRows,
      colWidths: [14, 30, 26, 75],
    },
  ]);
}

/**
 * Downloads the official Excel (.xlsx) template for Bulk Student Import.
 */
export function downloadStudentExcelTemplate(): void {
  const headers = [
    'Nama Lengkap',
    'Jenjang (MTs/MA/Wustho/Ulya)',
    'Kelas',
    'Ruang',
    'NISN',
    'Gender (L/P)',
    'Sesi (Sesi 1 (Pagi)/Sesi 2 (Siang))',
  ];
  const sampleRows = [
    [
      'Muhammad Naufal Al-Ghifari',
      'MTs',
      'VIII-A',
      'Lab CBT 1',
      '0098412001',
      'L',
      'Sesi 1 (Pagi)',
    ],
    [
      'Siti Aisyah Humaira',
      'MA',
      'XI MIPA',
      'Lab CBT 2',
      '0071928301',
      'P',
      'Sesi 1 (Pagi)',
    ],
    [
      'Ahmad Syauqi Al-Banjari',
      'Wustho',
      'II Wustho A',
      'Lab Turats 1',
      '3120098401',
      'L',
      'Sesi 1 (Pagi)',
    ],
    [
      'Fatimah Az-Zahra',
      'Ulya',
      "III 'Ulya",
      "Aula Ma'had 'Ulya",
      '5019283701',
      'P',
      'Sesi 2 (Siang)',
    ],
  ];

  triggerXlsxDownload('Template_Database_Santri_Real_JN_CBT.xlsx', [
    {
      sheetName: 'Database Santri',
      headers,
      rows: sampleRows,
      colWidths: [34, 26, 18, 22, 18, 14, 28],
    },
  ]);
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressed as unknown as BufferSource);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Extracts files from an .xlsx (ZIP) ArrayBuffer using Central Directory headers.
 */
async function unzipXlsxEntries(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8');
  const files = new Map<string, string>();

  // Locate End of Central Directory (0x06054b50)
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('File bukan format Excel (.xlsx) yang valid.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);

  for (let e = 0; e < totalEntries; e++) {
    if (cdOffset + 46 > bytes.length || view.getUint32(cdOffset, true) !== 0x02014b50) {
      break;
    }
    const method = view.getUint16(cdOffset + 10, true);
    const compSize = view.getUint32(cdOffset + 20, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);

    const name = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
    cdOffset += 46 + nameLen + extraLen + commentLen;

    if (
      name === 'xl/sharedStrings.xml' ||
      name.startsWith('xl/worksheets/sheet')
    ) {
      const lNameLen = view.getUint16(localHeaderOffset + 26, true);
      const lExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
      const rawData = bytes.subarray(dataStart, dataStart + compSize);

      let uncompressed: Uint8Array;
      if (method === 0) {
        uncompressed = rawData;
      } else if (method === 8) {
        uncompressed = await inflateRawBytes(rawData);
      } else {
        continue;
      }
      files.set(name, decoder.decode(uncompressed));
    }
  }

  return files;
}

/**
 * Parses an uploaded .xlsx ArrayBuffer and returns rows of string arrays from the first worksheet.
 */
export async function parseXlsxArrayBuffer(buffer: ArrayBuffer): Promise<string[][]> {
  const entries = await unzipXlsxEntries(buffer);
  const parser = new DOMParser();

  // 1. Parse sharedStrings.xml if present
  const sharedStrings: string[] = [];
  const sharedXml = entries.get('xl/sharedStrings.xml');
  if (sharedXml) {
    const doc = parser.parseFromString(sharedXml, 'application/xml');
    const siNodes = Array.from(doc.getElementsByTagName('si'));
    for (const si of siNodes) {
      const tNodes = Array.from(si.getElementsByTagName('t'));
      sharedStrings.push(tNodes.map((n) => n.textContent || '').join(''));
    }
  }

  // 2. Find first worksheet (prefer xl/worksheets/sheet1.xml)
  const sheetKey =
    entries.has('xl/worksheets/sheet1.xml')
      ? 'xl/worksheets/sheet1.xml'
      : Array.from(entries.keys())
          .filter((k) => k.startsWith('xl/worksheets/sheet'))
          .sort()[0];

  if (!sheetKey) {
    throw new Error('Lembar kerja (worksheet) tidak ditemukan di dalam file Excel.');
  }

  const sheetXml = entries.get(sheetKey)!;
  const doc = parser.parseFromString(sheetXml, 'application/xml');
  const rowNodes = Array.from(doc.getElementsByTagName('row'));
  const rows: string[][] = [];

  for (const rowNode of rowNodes) {
    const cellNodes = Array.from(rowNode.getElementsByTagName('c'));
    const rowValues: string[] = [];
    let maxCol = -1;

    for (const cNode of cellNodes) {
      const ref = cNode.getAttribute('r') || '';
      const colMatch = ref.match(/^[A-Za-z]+/);
      const colIdx = colMatch ? colLetterToIndex(colMatch[0]) : maxCol + 1;
      maxCol = Math.max(maxCol, colIdx);

      const cellType = cNode.getAttribute('t') || '';
      let val = '';
      if (cellType === 's') {
        const vNode = cNode.getElementsByTagName('v')[0];
        const sIdx = parseInt(vNode?.textContent || '0', 10);
        val = sharedStrings[sIdx] ?? '';
      } else if (cellType === 'inlineStr') {
        const tNodes = Array.from(cNode.getElementsByTagName('t'));
        val = tNodes.map((n) => n.textContent || '').join('');
      } else {
        const vNode = cNode.getElementsByTagName('v')[0];
        val = vNode?.textContent || '';
      }

      while (rowValues.length <= colIdx) {
        rowValues.push('');
      }
      rowValues[colIdx] = val.trim();
    }

    if (rowValues.some((v) => v !== '')) {
      rows.push(rowValues);
    }
  }

  return rows;
}

/**
 * Normalizes raw text (from CSV, TXT, or direct Excel Tab-Separated copy-paste)
 * into pipe-separated lines (`col1 | col2 | col3`), skipping header rows.
 */
export function normalizeSpreadsheetTextToPipeLines(
  rawText: string,
  expectedColumnCount: number,
  headerKeyword: string = 'nama'
): string {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.trim().length > 0);

  const normalizedLines: string[] = [];

  lines.forEach((line, idx) => {
    let cols: string[];
    if (line.includes('\t')) {
      // Direct copy-paste from Excel / Google Sheets (Tab-separated)
      cols = line.split('\t').map((c) => c.trim());
    } else if (line.includes('|')) {
      cols = line.split('|').map((c) => c.trim());
    } else if (line.includes(';')) {
      cols = line.split(';').map((c) => c.trim());
    } else {
      cols = line.split(',').map((c) => c.trim());
    }

    // Skip header row if first row contains headerKeyword + 'jenjang' or 'username'
    const firstColLower = (cols[0] || '').toLowerCase();
    const joinedLower = line.toLowerCase();
    if (
      idx === 0 &&
      firstColLower.includes(headerKeyword) &&
      (joinedLower.includes('jenjang') || joinedLower.includes('username'))
    ) {
      return;
    }

    // Skip empty rows where first column is blank
    if (!cols[0]) return;

    while (cols.length < expectedColumnCount) {
      cols.push('');
    }
    // Trim trailing empty columns while keeping at least the filled ones
    while (cols.length > 1 && cols[cols.length - 1] === '') {
      cols.pop();
    }

    normalizedLines.push(cols.join(' | '));
  });

  return normalizedLines.join('\n');
}

/**
 * Reads an uploaded File (.xlsx, .csv, or .txt) and converts its rows into pipe-separated text.
 */
export async function readUploadedSpreadsheetFile(
  file: File,
  expectedColumnCount: number,
  headerKeyword: string = 'nama'
): Promise<string> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx')) {
    const buf = await file.arrayBuffer();
    const rows = await parseXlsxArrayBuffer(buf);
    const bodyRows = rows.filter((row, idx) => {
      if (row.every((c) => !c.trim())) return false;
      const rowJoined = row.join(' ').toLowerCase();
      if (
        idx === 0 &&
        rowJoined.includes(headerKeyword) &&
        (rowJoined.includes('jenjang') || rowJoined.includes('username'))
      ) {
        return false;
      }
      return Boolean((row[0] || '').trim());
    });

    return bodyRows
      .map((row) => {
        const cols = [...row];
        while (cols.length < expectedColumnCount) cols.push('');
        while (cols.length > 1 && cols[cols.length - 1] === '') cols.pop();
        return cols.join(' | ');
      })
      .join('\n');
  }

  // Fallback for .csv / .txt
  const text = await file.text();
  return normalizeSpreadsheetTextToPipeLines(text, expectedColumnCount, headerKeyword);
}

export function downloadTeacherCsvTemplate(): void {
  const csvHeader =
    'Nama Lengkap Guru|Jenjang (MTs/MA/Wustho/Ulya)|Username Login|Password Login|Mata Pelajaran / Kitab (Opsional)|Jabatan / Peran (Opsional)|NIP / NIY (Opsional)|No. WhatsApp (Opsional)|Kelas Binaan (Opsional)\n';
  const sampleRows = [
    'Ust. H. Abdurrahman, Lc., M.Ag.|MA|guru_fiqih_ma|guru123|Fiqih & Ushul Fiqih|Guru Mapel|198504122015031001|0812-3456-7801|',
    'Ustadzah Siti Aisyah, S.Pd.|MA|guru_bio_ma|guru123|Biologi (MIPA)|Guru Mapel|199008172019032004|0813-4567-8902|XI MIPA',
    'Ust. Muhammad Syauqi, S.Pd.I.|MTs, MA|guru_b_arab|guru123||Guru Mapel||0852-1122-3344|',
    'KH. Ahmad Fauzan, M.Pd.|Wustho, Ulya|guru_nahwu|guru123|Nahwu & Shorof (Alfiyah)|Guru Mapel|||',
  ].join('\n');
  const blob = new Blob([csvHeader + sampleRows], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Guru_Mapel_JN_CBT.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_ROLE_TABS: Record<TeacherPeran, NavTab[]> = {
  'Kepala Madrasah / Mudir': [
    'dashboard',
    'bank-soal',
    'jadwal-live',
    'peserta-kartu',
    'rekap-nilai',
  ],
  'Wali Kelas': ['dashboard', 'peserta-kartu', 'rekap-nilai'],
  'Guru Mapel': ['dashboard', 'bank-soal', 'rekap-nilai'],
  'Pengawas CBT': ['dashboard', 'jadwal-live', 'peserta-kartu'],
  'Koordinator Kurikulum': [
    'dashboard',
    'bank-soal',
    'jadwal-live',
    'peserta-kartu',
    'rekap-nilai',
    'pengaturan',
  ],
};

function parseJenjangTokens(raw: string, fallback: Jenjang): Jenjang[] {
  if (!raw || !raw.trim()) return [fallback];
  const lower = raw.toLowerCase();
  const result: Jenjang[] = [];
  if (/\bmts\b/.test(lower) || lower.includes('tsanawiyah')) result.push('MTs');
  if (/\bma\b/.test(lower) || lower.includes('aliyah')) result.push('MA');
  if (lower.includes('wustho') || lower.includes('wustha')) result.push('Wustho');
  if (lower.includes('ulya')) result.push('Ulya');
  return result.length > 0 ? result : [fallback];
}

function parsePeranToken(raw: string): TeacherPeran {
  const lower = (raw || '').trim().toLowerCase();
  if (!lower) return 'Guru Mapel';
  if (lower.includes('kepala') || lower.includes('mudir') || lower.includes('kamad')) {
    return 'Kepala Madrasah / Mudir';
  }
  if (lower.includes('wali')) return 'Wali Kelas';
  if (lower.includes('pengawas') || lower.includes('proktor')) return 'Pengawas CBT';
  if (lower.includes('koordinator') || lower.includes('kurikulum')) {
    return 'Koordinator Kurikulum';
  }
  return 'Guru Mapel';
}

function deriveCleanUsername(nama: string, seqIndex: number, usedSet: Set<string>): string {
  const withoutAcademicTitles = nama
    .split(',')[0]
    .replace(/\b(kh|ust|ustadz|ustadzah|drs|dra|ir|prof|h|hj|nyai|kyai)\b\.?/gi, ' ')
    .trim();
  const words = withoutAcademicTitles
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const slug = words.slice(0, 2).join('_') || `guru_${seqIndex}`;
  let candidate = slug.startsWith('guru_') ? slug : `guru_${slug}`;
  let counter = 2;
  while (usedSet.has(candidate)) {
    candidate = `guru_${slug}_${counter}`;
    counter++;
  }
  usedSet.add(candidate);
  return candidate;
}

export function parseBulkTeacherText(
  rawText: string,
  defaultJenjang: Jenjang = 'MTs',
  existingCount: number = 0
): Teacher[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const usedUsernames = new Set<string>();
  const parsedList: Teacher[] = [];

  lines.forEach((line, idx) => {
    let parts: string[];
    if (line.includes('|')) {
      parts = line.split('|').map((p) => p.trim());
    } else if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes(';')) {
      parts = line.split(';').map((p) => p.trim());
    } else {
      parts = line.split(',').map((p) => p.trim());
    }

    const firstLower = (parts[0] || '').toLowerCase();
    const lineLower = line.toLowerCase();
    if (
      idx === 0 &&
      firstLower.includes('nama') &&
      (lineLower.includes('jenjang') || lineLower.includes('username'))
    ) {
      return;
    }

    const rawNama = (parts[0] || '').trim();
    if (!rawNama) return;

    const jenjangList = parseJenjangTokens(parts[1] || '', defaultJenjang);
    const rawUsername = (parts[2] || '').trim().replace(/\s+/g, '_').toLowerCase();
    const username =
      rawUsername || deriveCleanUsername(rawNama, existingCount + parsedList.length + 1, usedUsernames);
    usedUsernames.add(username);

    const password = (parts[3] || '').trim() || 'guru123';
    const peran = parsePeranToken(parts[5] || '');
    const rawMapel = (parts[4] || '').trim();
    const mapelAmpu =
      rawMapel ||
      (peran === 'Guru Mapel'
        ? 'Fleksibel (Sesuai Paket Soal)'
        : peran === 'Kepala Madrasah / Mudir'
        ? 'Pimpinan / Kepala Lembaga'
        : peran === 'Wali Kelas'
        ? 'Wali Kelas / Pembina Rombel'
        : peran === 'Pengawas CBT'
        ? 'Proktor & Pengawas Ruang CBT'
        : peran);

    const seq = String(existingCount + parsedList.length + 1).padStart(3, '0');
    const nip = (parts[6] || '').trim() || `198901012020011${seq}`;
    const noHp = (parts[7] || '').trim() || '-';
    const kelasBinaan = (parts[8] || '').trim() || undefined;

    parsedList.push({
      id: `tch-imp-${Date.now()}-${parsedList.length}`,
      nip,
      username,
      password,
      nama: rawNama,
      gelar: '',
      mapelAmpu,
      kelasBinaan,
      jenjangAmpu: jenjangList,
      peran,
      hakAkses: DEFAULT_ROLE_TABS[peran],
      noHp,
      statusAktif: true,
    });
  });

  return parsedList;
}

