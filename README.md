# JN ExamCBTCore — Sistem Ujian Berbasis Komputer (CBT) & Imtihan Kitab

Aplikasi **Computer-Based Test (CBT)** terpadu yang dirancang khusus untuk **Madrasah Tsanawiyah (MTs)**, **Madrasah Aliyah (MA)**, **Pendidikan Diniyah Formal (PDF) Wustho**, dan **Ma'had 'Ulya**.

## Fitur Utama
- **Multi-Jenjang & Marhalah**: Mendukung 4 jenjang (`MTs`, `MA`, `Wustho`, dan `'Ulya`) dengan pengaturan opsi jawaban otomatis (`A–D` maupun `A–E`) serta ambang batas KKM per paket.
- **Bank Soal Bilingual (Indonesia & Arab/Kitab RTL)**:
  - Mendukung 4 tipe soal: Pilihan Ganda (`PG`), Pilihan Ganda Kompleks (`PG_KOMPLEKS`), Pernyataan Benar/Salah (`BENAR_SALAH`), dan Uraian/Tarkib Kitab (`ESAI`).
  - Dilengkapi **Virtual Harakat Bar** dan pemisahan blok *BiDi* (`dir="rtl"` untuk matan Arab & `dir="ltr"` untuk teks Latin).
- **Jadwal, Token & Live Proctoring**:
  - Rotasi token ujian, pemantauan kehadiran & progres santri secara *real-time*, deteksi pelanggaran pindah tab (*anti-cheat*), siaran pengumuman langsung (*broadcast*) ke layar peserta, serta aksi buka kunci/tambah waktu.
- **Administrasi Peserta & Cetak A4**:
  - Kelola data santri & dewan guru/asatidz, *import* kolektif, cetak **Kartu Peserta Ujian ber-QR Code**, serta cetak **Daftar Hadir & Berita Acara Pelaksanaan CBT**.
- **Rekapitulasi Nilai, Analisis Daya Serap & Koreksi Esai**:
  - Penilaian objektif otomatis, rubrik koreksi jawaban esai/tarkib, analisis daya serap per marhalah, serta *export* ke format CSV/Excel dan cetak PDF resmi.
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
