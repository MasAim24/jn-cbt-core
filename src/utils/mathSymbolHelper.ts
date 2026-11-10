export interface MathSymbolItem {
  char: string;
  display?: string;
  label: string;
}

export interface MathSymbolCategory {
  id: 'pangkat' | 'indeks' | 'aljabar' | 'geometri';
  title: string;
  shortTitle: string;
  items: MathSymbolItem[];
}

export const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  x: 'ˣ',
  y: 'ʸ',
  m: 'ᵐ',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  k: 'ᵏ',
};

export const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  i: 'ᵢ',
  k: 'ₖ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
};

export const MATH_SYMBOL_CATEGORIES: MathSymbolCategory[] = [
  {
    id: 'pangkat',
    title: 'Pangkat & Eksponen (Superscript)',
    shortTitle: 'Pangkat (x²)',
    items: [
      { char: '²', display: 'x²', label: 'Pangkat 2 (Kuadrat)' },
      { char: '³', display: 'x³', label: 'Pangkat 3 (Kubik)' },
      { char: '⁴', display: 'x⁴', label: 'Pangkat 4' },
      { char: '⁵', display: 'x⁵', label: 'Pangkat 5' },
      { char: '⁻¹', display: 'x⁻¹', label: 'Pangkat -1 (Invers)' },
      { char: '⁻²', display: 'x⁻²', label: 'Pangkat -2' },
      { char: '⁻³', display: 'x⁻³', label: 'Pangkat -3' },
      { char: 'ⁿ', display: 'xⁿ', label: 'Pangkat n' },
      { char: 'ˣ', display: 'aˣ', label: 'Pangkat x' },
      { char: 'ʸ', display: 'aʸ', label: 'Pangkat y' },
      { char: '⁰', display: 'x⁰', label: 'Pangkat 0' },
      { char: '¹', display: 'x¹', label: 'Pangkat 1' },
      { char: '⁶', display: 'x⁶', label: 'Pangkat 6' },
      { char: '⁷', display: 'x⁷', label: 'Pangkat 7' },
      { char: '⁸', display: 'x⁸', label: 'Pangkat 8' },
      { char: '⁹', display: 'x⁹', label: 'Pangkat 9' },
      { char: '⁺', display: '⁺', label: 'Tanda Plus Pangkat (+)' },
      { char: '⁻', display: '⁻', label: 'Tanda Minus Pangkat (-)' },
      { char: '⁽', display: '⁽', label: 'Kurung Buka Pangkat' },
      { char: '⁾', display: '⁾', label: 'Kurung Tutup Pangkat' },
      { char: '°', display: '°', label: 'Derajat (°)' },
    ],
  },
  {
    id: 'indeks',
    title: 'Indeks Bawah, Logaritma & Kimia (Subscript)',
    shortTitle: 'Indeks / Log (x₁)',
    items: [
      { char: '₁', display: 'x₁', label: 'Indeks Bawah 1' },
      { char: '₂', display: 'x₂', label: 'Indeks Bawah 2' },
      { char: '₃', display: 'x₃', label: 'Indeks Bawah 3' },
      { char: '₄', display: 'x₄', label: 'Indeks Bawah 4' },
      { char: '₀', display: 'x₀', label: 'Indeks Bawah 0' },
      { char: 'ₙ', display: 'Uₙ', label: 'Indeks Bawah n (Suku ke-n)' },
      { char: '²log ', display: '²log', label: 'Logaritma Basis 2' },
      { char: '³log ', display: '³log', label: 'Logaritma Basis 3' },
      { char: '¹⁰log ', display: '¹⁰log', label: 'Logaritma Basis 10' },
      { char: 'ᵃlog ', display: 'ᵃlog', label: 'Logaritma Basis a' },
      { char: 'log₂(', display: 'log₂', label: 'Logaritma Subscript 2' },
      { char: '₅', display: '₅', label: 'Indeks Bawah 5' },
      { char: '₆', display: '₆', label: 'Indeks Bawah 6' },
      { char: '₇', display: '₇', label: 'Indeks Bawah 7' },
      { char: '₈', display: '₈', label: 'Indeks Bawah 8' },
      { char: '₉', display: '₉', label: 'Indeks Bawah 9' },
      { char: '₊', display: '₊', label: 'Plus Indeks Bawah' },
      { char: '₋', display: '₋', label: 'Minus Indeks Bawah' },
    ],
  },
  {
    id: 'aljabar',
    title: 'Operasi Aljabar, Akar & Kalkulus',
    shortTitle: 'Aljabar & Akar (√, π)',
    items: [
      { char: '×', label: 'Kali (×)' },
      { char: '÷', label: 'Bagi (÷)' },
      { char: '±', label: 'Plus Minus (±)' },
      { char: '√', label: 'Akar Kuadrat (√)' },
      { char: '√(', display: '√(...)', label: 'Akar dengan Kurung' },
      { char: '∛', label: 'Akar Pangkat Tiga (∛)' },
      { char: '∜', label: 'Akar Pangkat Empat (∜)' },
      { char: 'π', label: 'Pi (π)' },
      { char: '≠', label: 'Tidak Sama Dengan (≠)' },
      { char: '≈', label: 'Hampir Sama Dengan (≈)' },
      { char: '≤', label: 'Kurang Dari Sama Dengan (≤)' },
      { char: '≥', label: 'Lebih Dari Sama Dengan (≥)' },
      { char: '∞', label: 'Tak Hingga (∞)' },
      { char: '∑', label: 'Sigma / Penjumlahan (∑)' },
      { char: '∫', label: 'Integral (∫)' },
      { char: '∆', label: 'Delta / Diskriminan (∆)' },
      { char: '∘', display: 'f∘g', label: 'Komposisi Fungsi (∘)' },
      { char: 'f⁻¹(x)', display: 'f⁻¹(x)', label: 'Fungsi Invers' },
    ],
  },
  {
    id: 'geometri',
    title: 'Pecahan, Geometri, Sudut & Himpunan',
    shortTitle: 'Pecahan & Himpunan (½, ∈)',
    items: [
      { char: '½', label: 'Pecahan 1/2' },
      { char: '⅓', label: 'Pecahan 1/3' },
      { char: '⅔', label: 'Pecahan 2/3' },
      { char: '¼', label: 'Pecahan 1/4' },
      { char: '¾', label: 'Pecahan 3/4' },
      { char: '⅕', label: 'Pecahan 1/5' },
      { char: '⅛', label: 'Pecahan 1/8' },
      { char: '∠', label: 'Sudut (∠)' },
      { char: '⊥', label: 'Tegak Lurus (⊥)' },
      { char: '∥', label: 'Sejajar (∥)' },
      { char: '△', label: 'Segitiga (△)' },
      { char: '∈', label: 'Elemen / Anggota Himpunan (∈)' },
      { char: '∉', label: 'Bukan Anggota Himpunan (∉)' },
      { char: '⊂', label: 'Himpunan Bagian (⊂)' },
      { char: '⊆', label: 'Himpunan Bagian / Sama (⊆)' },
      { char: '∪', label: 'Gabungan / Union (∪)' },
      { char: '∩', label: 'Irisan / Intersection (∩)' },
      { char: '∅', label: 'Himpunan Kosong (∅)' },
      { char: '⇒', label: 'Maka / Implikasi (⇒)' },
      { char: '⇔', label: 'Jika dan Hanya Jika / Biimplikasi (⇔)' },
      { char: 'α', label: 'Alfa (α)' },
      { char: 'β', label: 'Beta (β)' },
      { char: 'θ', label: 'Teta (θ)' },
    ],
  },
];

export const MATH_FORMULA_PRESETS: { label: string; formula: string }[] = [
  { label: 'Persamaan Kuadrat', formula: 'x² + bx + c = 0' },
  { label: 'Fungsi Kuadrat', formula: 'f(x) = ax² + bx + c' },
  { label: 'Rumus ABC', formula: 'x₁,₂ = (-b ± √(b² - 4ac)) / 2a' },
  { label: 'Eksponen', formula: '2ˣ⁺¹ = 2³' },
  { label: 'Logaritma', formula: '²log 8 + ²log 4 = 5' },
  { label: 'Barisan Aritmatika', formula: 'Uₙ = a + (n - 1)b' },
  { label: 'Trigonometri', formula: 'sin² α + cos² α = 1' },
  { label: 'Notasi Himpunan', formula: '{x | -2 ≤ x < 5, x ∈ ℝ}' },
];

function toSuperscriptString(raw: string): string {
  return raw
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
    .join('');
}

function toSubscriptString(raw: string): string {
  return raw
    .split('')
    .map((ch) => SUBSCRIPT_MAP[ch] ?? ch)
    .join('');
}

/**
 * Mengonversi penulisan notasi matematika ketik biasa menjadi simbol Unicode rapi:
 * - x^2 -> x², 10^-5 -> 10⁻⁵, 2^(n+1) -> 2⁽ⁿ⁺¹⁾
 * - x_1 -> x₁, U_n -> Uₙ, H_2O -> H₂O
 * - <= -> ≤, >= -> ≥, != -> ≠, +- -> ±, sqrt( -> √(
 */
export function formatMathNotation(input: string): string {
  if (!input) return input;

  let result = input;

  // 1. Konversi pangkat dengan kurung: ^(n+1) atau ^{n+1} -> ⁽ⁿ⁺¹⁾ / ⁿ⁺¹
  result = result.replace(/\^\{([0-9+\-=()nxymabck]+)\}/g, (_, exp: string) =>
    toSuperscriptString(exp)
  );
  result = result.replace(/\^\(([0-9+\-=nxymabck]+)\)/g, (_, exp: string) =>
    toSuperscriptString(`(${exp})`)
  );

  // 2. Konversi pangkat langsung: ^2, ^-3, ^n, ^x, ^2x
  result = result.replace(/\^([0-9+\-=nxymabck]+)/g, (_, exp: string) =>
    toSuperscriptString(exp)
  );

  // 3. Konversi subscript dengan kurung: _{n-1} atau _(n-1)
  result = result.replace(/_\{([0-9+\-=()aeikmnoprstuvx]+)\}/g, (_, sub: string) =>
    toSubscriptString(sub)
  );
  result = result.replace(/_\(([0-9+\-=aeikmnoprstuvx]+)\)/g, (_, sub: string) =>
    toSubscriptString(`(${sub})`)
  );

  // 4. Konversi subscript langsung setelah huruf/kurung: x_1, U_n, log_2, H_2
  result = result.replace(
    /([A-Za-z0-9)])_([0-9+\-=nx]+)/g,
    (_, prefix: string, sub: string) => `${prefix}${toSubscriptString(sub)}`
  );

  // 5. Konversi operator umum
  result = result
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
    .replace(/!=/g, '≠')
    .replace(/\+-/g, '±')
    .replace(/\bsqrt\(/gi, '√(')
    .replace(/\bcbrt\(/gi, '∛(');

  return result;
}
