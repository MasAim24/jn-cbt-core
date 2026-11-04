# JN ExamCBTCore — Sistem Ujian Berbasis Komputer (CBT) & Imtihan Kitab

Aplikasi **Computer-Based Test (CBT)** terpadu yang dirancang khusus untuk **Madrasah Tsanawiyah (MTs)**, **Madrasah Aliyah (MA)**, **Pendidikan Diniyah Formal (PDF) Wustho**, dan **Ma'had 'Ulya**.

## Fitur Utama
- **Multi-Jenjang & Marhalah**: Mendukung 4 jenjang (`MTs`, `MA`, `Wustho`, dan `'Ulya`) dengan pengaturan opsi jawaban otomatis (`A–D` maupun `A–E`) serta ambang batas KKM per paket.
- **Bank Soal Bilingual (Indonesia & Arab/Kitab RTL) + Media & Import/Export Kolektif**:
  - Mendukung 4 tipe soal: Pilihan Ganda (`PG`), Pilihan Ganda Kompleks (`PG_KOMPLEKS`), Pernyataan Benar/Salah (`BENAR_SALAH`), dan Uraian/Tarkib Kitab (`ESAI`).
  - Dilengkapi **Virtual Harakat Bar**, pemisahan blok *BiDi* (`dir="rtl"` untuk matan Arab & `dir="ltr"` untuk teks Latin), **Lampiran Gambar/Bagan Ilustrasi & Audio Istima' (Listening CBT)**, serta **Import/Export Kolektif berformat CSV & JSON**.
- **Jadwal, Token & Live Proctoring Antar-Tab (`BroadcastChannel` Real-Time Sync)**:
  - Sinkronisasi *real-time* lintas tab browser antara **Portal Ujian Santri** dan **Meja Pengawas CBT**: progres soal, sisa waktu, deteksi pindah tab (*anti-cheat lock*), siaran pengumuman langsung (*broadcast*), buka kunci jarak jauh, dan tambah waktu `+15m`.
- **Administrasi Peserta & Engine PDF Murni A4 (ISO-32000)**:
  - Kelola data santri & dewan guru/asatidz, *import* kolektif, cetak **Kartu Peserta Ujian ber-QR Code**, **Daftar Hadir & Berita Acara CBT**, **Naskah Soal Bilingual**, **Rekap Nilai Resmi**, serta **Leger Nilai & Peringkat Paralel (A4)**.
- **Rekapitulasi Nilai, Analisis Butir Soal (CTT) & Koreksi Esai**:
  - Penilaian objektif otomatis, rubrik koreksi jawaban esai/tarkib, **Analisis Butir Soal Psikometrik** (Indeks Tingkat Kesukaran $P$, Daya Pembeda $D$, dan Efektivitas Opsi/Pengecoh), analisis daya serap per marhalah, serta *export* ke CSV/Excel dan PDF A4.
- **Portal Simulasi Ujian Siswa**:
  - Pengalaman ujian langsung dengan pengatur ukuran huruf Arab/Latin (`A-`, `A`, `A+`), penanda *Ragu-ragu*, matriks nomor soal, dan pembahasan pasca-ujian.

## Menjalankan Aplikasi Secara Lokal

```bash
npm install
npm run dev
```

Untuk membuat *build* produksi:

```bash
npm run build
```
