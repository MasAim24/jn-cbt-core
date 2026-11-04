import { Student } from '../types/cbt';

interface RawRdmStudent {
  no: number;
  nama: string;
  nisn: string;
  tempatLahir: string;
  tanggalLahir: string;
  gender: 'L' | 'P';
}

function buildPinFromNisn(nisn: string, fallbackSeq: number): string {
  const digits = nisn.replace(/\D/g, '');
  const tail = digits.slice(-6).padStart(6, '4');
  if (tail.startsWith('0')) {
    return `${((fallbackSeq % 8) + 2)}${tail.slice(1)}`;
  }
  return tail;
}

/**
 * Data Real Santri MA Kelas XI (63 Santri) — Rapor Digital Madrasah (RDM)
 * Sumber: kelas XI.pdf (4-11-2026)
 */
const RAW_MA_KELAS_XI: RawRdmStudent[] = [
  { no: 1, nama: 'AGHA ASYRAF FIKRI', nisn: '0094885558', tempatLahir: 'KANDIS', tanggalLahir: '2009-12-21', gender: 'L' },
  { no: 2, nama: 'AHMAD HAMSANI AJID', nisn: '0108513466', tempatLahir: 'SIALANG GATAP', tanggalLahir: '2010-05-19', gender: 'L' },
  { no: 3, nama: 'ALDI PRATAMA', nisn: '0092014709', tempatLahir: 'TASIK SERAI TIMUR', tanggalLahir: '2009-09-01', gender: 'L' },
  { no: 4, nama: 'BAGUS PRAYOGA', nisn: '0102478402', tempatLahir: 'TASIK SERAI TIMUR', tanggalLahir: '2010-06-07', gender: 'L' },
  { no: 5, nama: 'EJI BAGUS PRADANA', nisn: '0098213270', tempatLahir: 'DUSUN GARUT', tanggalLahir: '2009-12-26', gender: 'L' },
  { no: 6, nama: 'FAIRUZ AKMAL QUINSYAH', nisn: '0091460013', tempatLahir: 'PEKANBARU', tanggalLahir: '2009-10-14', gender: 'L' },
  { no: 7, nama: 'FEBRI ANUGRAHA', nisn: '0109180222', tempatLahir: 'PARMANUKAN PASAR III', tanggalLahir: '2010-02-26', gender: 'L' },
  { no: 8, nama: 'GILANG VISABILILAH', nisn: '0105410601', tempatLahir: 'PINGGIR', tanggalLahir: '2010-06-12', gender: 'L' },
  { no: 9, nama: 'HARIS PERMAYUDA', nisn: '0095232924', tempatLahir: 'TASIK SERAI TIMUR', tanggalLahir: '2009-11-09', gender: 'L' },
  { no: 10, nama: 'LUCKY ANANTA', nisn: '0103848997', tempatLahir: 'SIDOMULYO', tanggalLahir: '2010-02-23', gender: 'L' },
  { no: 11, nama: 'M. FARHAN BAHORI', nisn: '0102039275', tempatLahir: 'BERINGIN', tanggalLahir: '2010-10-07', gender: 'L' },
  { no: 12, nama: 'M.RAZIQ RINALDI', nisn: '0109285931', tempatLahir: 'BALAI JAYA', tanggalLahir: '2010-08-06', gender: 'L' },
  { no: 13, nama: 'MUHAMMAD ALPADIL SYAH', nisn: '0107211510', tempatLahir: 'SUNGAI PINANG', tanggalLahir: '2010-07-31', gender: 'L' },
  { no: 14, nama: 'MUHAMMAD ARIF', nisn: '0091544019', tempatLahir: 'DUSUN AIR JAMBAI', tanggalLahir: '2009-12-11', gender: 'L' },
  { no: 15, nama: 'MUHAMMAD HADI ARRASYID', nisn: '0101078640', tempatLahir: 'DURI', tanggalLahir: '2010-07-26', gender: 'L' },
  { no: 16, nama: 'MUHAMMAD WAHYUDI', nisn: '0097567223', tempatLahir: 'PINGGIR', tanggalLahir: '2009-07-24', gender: 'L' },
  { no: 17, nama: 'PASYA ANNURIA', nisn: '0093279839', tempatLahir: 'KOTA GARO', tanggalLahir: '2009-12-10', gender: 'L' },
  { no: 18, nama: 'RAHMAN ARDIANSYAH', nisn: '3103550586', tempatLahir: 'RAWANG', tanggalLahir: '2010-04-30', gender: 'L' },
  { no: 19, nama: 'ZAINUL ARIFIN', nisn: '0098096024', tempatLahir: 'PEKANBARU', tanggalLahir: '2009-10-31', gender: 'L' },
  { no: 20, nama: 'ZIKRI ASSIDDIQ', nisn: '0109723679', tempatLahir: 'DURI', tanggalLahir: '2010-01-20', gender: 'L' },
  { no: 21, nama: 'ABEL AMELIYA SAPUTRI', nisn: '0103964107', tempatLahir: 'TASIK SERAI', tanggalLahir: '2010-03-30', gender: 'P' },
  { no: 22, nama: 'AFIFAH NAILA ARKANA', nisn: '0103354701', tempatLahir: 'SENGON SARI', tanggalLahir: '2010-04-10', gender: 'P' },
  { no: 23, nama: "AFIFAH QURRATU'AINI", nisn: '0097416460', tempatLahir: 'DUMAI', tanggalLahir: '2009-10-16', gender: 'P' },
  { no: 24, nama: 'ALIYA JULIANTI', nisn: '0106856886', tempatLahir: 'AEK KANOPAN', tanggalLahir: '2010-07-18', gender: 'P' },
  { no: 25, nama: 'ALYA IZZATY ZAKIYAH', nisn: '0102623077', tempatLahir: 'KANDIS', tanggalLahir: '2010-02-18', gender: 'P' },
  { no: 26, nama: 'ASYIRA UZLIFATIL JANNAH', nisn: '0103756937', tempatLahir: 'PERAWANG', tanggalLahir: '2010-02-19', gender: 'P' },
  { no: 27, nama: 'AULIA KHOLILAH', nisn: '0109407038', tempatLahir: 'SAMBIREJO TIMUR', tanggalLahir: '2010-07-11', gender: 'P' },
  { no: 28, nama: 'AVIVA DESTIANI', nisn: '0098388946', tempatLahir: 'DURI', tanggalLahir: '2009-12-18', gender: 'P' },
  { no: 29, nama: 'BUNGA MIFTAHUL JANAH', nisn: '0107413833', tempatLahir: 'SERANG', tanggalLahir: '2010-05-24', gender: 'P' },
  { no: 30, nama: 'CHERLI NEYZIA KAYSAWATI', nisn: '0103471860', tempatLahir: 'KAMPAR', tanggalLahir: '2010-02-12', gender: 'P' },
  { no: 31, nama: 'DEBBY AIDILLA', nisn: '0092217711', tempatLahir: 'TANDAN SARI', tanggalLahir: '2009-09-24', gender: 'P' },
  { no: 32, nama: 'DZAKIYYAH KUSUMO NINGDYAH', nisn: '0096270043', tempatLahir: 'DURI', tanggalLahir: '2009-08-29', gender: 'P' },
  { no: 33, nama: 'EKA ZAINIAH FITRI', nisn: '0094496340', tempatLahir: 'PEKANBARU', tanggalLahir: '2009-09-21', gender: 'P' },
  { no: 34, nama: 'FANNY FRISKA JAYANTI', nisn: '0103146194', tempatLahir: 'SELAYANG', tanggalLahir: '2010-05-14', gender: 'P' },
  { no: 35, nama: 'FITRI SRI RAHAYU', nisn: '0096530159', tempatLahir: 'PEKANBARU', tanggalLahir: '2009-10-20', gender: 'P' },
  { no: 36, nama: 'FITRIANA BR HASIBUAN', nisn: '0106429631', tempatLahir: 'KAMPAR', tanggalLahir: '2010-02-24', gender: 'P' },
  { no: 37, nama: 'GHALEA DIENNA AMANINA', nisn: '0095438801', tempatLahir: 'SERAI WAGI', tanggalLahir: '2009-09-18', gender: 'P' },
  { no: 38, nama: 'HAFIZAH LISANA WARUWU NIAS', nisn: '0101850229', tempatLahir: 'ASAHAN', tanggalLahir: '2010-01-30', gender: 'P' },
  { no: 39, nama: 'JUWITA', nisn: '0103360004', tempatLahir: 'DANAU LANCANG', tanggalLahir: '2010-08-25', gender: 'P' },
  { no: 40, nama: 'KIASATINA FAHANA', nisn: '0102364925', tempatLahir: 'TASIK SERAI TIMUR', tanggalLahir: '2010-01-17', gender: 'P' },
  { no: 41, nama: 'LIANA PUSPA PRABANDANI', nisn: '0106461011', tempatLahir: 'TANDAN SARI', tanggalLahir: '2010-03-25', gender: 'P' },
  { no: 42, nama: 'MAGHFIRATUL AYFAH WAHIDAH', nisn: '0092828179', tempatLahir: 'PEKANBARU', tanggalLahir: '2009-12-19', gender: 'P' },
  { no: 43, nama: 'NABILA FEBRIA NINGRUM', nisn: '3106133241', tempatLahir: 'KAMPAR', tanggalLahir: '2010-02-04', gender: 'P' },
  { no: 44, nama: 'NADYA SHAFWAH', nisn: '0094429073', tempatLahir: 'KOTA GARO', tanggalLahir: '2009-12-05', gender: 'P' },
  { no: 45, nama: 'NAZIFA ADILAH FILDZAHRA', nisn: '0109203254', tempatLahir: 'KAMPAR', tanggalLahir: '2010-10-08', gender: 'P' },
  { no: 46, nama: 'NUR INDAH MELYANA', nisn: '0103478772', tempatLahir: 'SERAI WANGI', tanggalLahir: '2010-08-05', gender: 'P' },
  { no: 47, nama: 'PUTRI NATASYA', nisn: '0105782345', tempatLahir: 'DUMAI', tanggalLahir: '2010-09-08', gender: 'P' },
  { no: 48, nama: "ROFI'AH NUR AISYAH", nisn: '0103241541', tempatLahir: 'SRAGEN', tanggalLahir: '2010-04-10', gender: 'P' },
  { no: 49, nama: 'SEKAR WANGI', nisn: '0098387459', tempatLahir: 'RANTAU PRAPAT', tanggalLahir: '2009-08-04', gender: 'P' },
  { no: 50, nama: 'AULIA NILAM CAHYA', nisn: '0107952713', tempatLahir: 'PULAU RAKYAT SEI PIRING', tanggalLahir: '2010-07-05', gender: 'P' },
  { no: 51, nama: 'DIRA NABILA ROZAN', nisn: '0106339797', tempatLahir: 'SIAK', tanggalLahir: '2010-05-16', gender: 'P' },
  { no: 52, nama: 'KHUSNUL NAILA', nisn: '0102402821', tempatLahir: 'SIAK', tanggalLahir: '2010-09-09', gender: 'P' },
  { no: 53, nama: 'LUTHFI AL-HAFIDZ', nisn: '0092433656', tempatLahir: 'KP LALANG', tanggalLahir: '2006-05-26', gender: 'L' },
  { no: 54, nama: 'M. FATAHILLAH DIYAULHAQ', nisn: '0104272793', tempatLahir: 'BENGKALIS', tanggalLahir: '2010-04-09', gender: 'L' },
  { no: 55, nama: 'MUHAMMAD FARIS', nisn: '0106432647', tempatLahir: 'BENGKALIS', tanggalLahir: '2010-01-31', gender: 'L' },
  { no: 56, nama: 'NOVIA RIYENDI', nisn: '0091813769', tempatLahir: 'BENGKALIS', tanggalLahir: '2009-11-10', gender: 'P' },
  { no: 57, nama: 'NUR SHYFA RAHMADANI SINAGA', nisn: '0101498264', tempatLahir: 'DUSUN GARUT', tanggalLahir: '2010-08-15', gender: 'P' },
  { no: 58, nama: 'OLIVIA RIFATHUL SHAFWA', nisn: '0114042110', tempatLahir: 'GERBANG SARI', tanggalLahir: '2011-03-23', gender: 'P' },
  { no: 59, nama: 'PATASYA AZAHRA BR SILAEN', nisn: '0098797350', tempatLahir: 'BANDAR DURIAN', tanggalLahir: '2009-12-02', gender: 'P' },
  { no: 60, nama: 'RAFA MAULANA', nisn: '3099314789', tempatLahir: 'DARUL AMAN', tanggalLahir: '2009-11-09', gender: 'L' },
  { no: 61, nama: 'RATISYA NURFAINI', nisn: '0106218018', tempatLahir: 'BENGKALIS', tanggalLahir: '2010-06-27', gender: 'P' },
  { no: 62, nama: 'SUSANTI', nisn: '3091465730', tempatLahir: 'PANDEGLANG', tanggalLahir: '2010-05-16', gender: 'P' },
  { no: 63, nama: 'TASYA SYAPUTRI BR. LUBIS', nisn: '0105928909', tempatLahir: 'PINGGIR', tanggalLahir: '2010-03-17', gender: 'P' },
];

/**
 * Data Real Santri MA Kelas XII (84 Santri) — Rapor Digital Madrasah (RDM)
 * Sumber: Kelas XII.pdf (4-11-2026)
 */
const RAW_MA_KELAS_XII: RawRdmStudent[] = [
  { no: 1, nama: 'ADRIAN AJI BISMA', nisn: '0091603095', tempatLahir: 'DADI MULYO', tanggalLahir: '2009-06-14', gender: 'L' },
  { no: 2, nama: 'ALFANDI AGUSTIAWAN', nisn: '0081512413', tempatLahir: 'BERINGIN LESTARI', tanggalLahir: '2008-08-17', gender: 'L' },
  { no: 3, nama: 'DIO PRANATA', nisn: '0081178042', tempatLahir: 'T HILIR I', tanggalLahir: '2008-11-18', gender: 'L' },
  { no: 4, nama: 'FAKHRI NAZHIR AGILAN', nisn: '0081802026', tempatLahir: 'DURI', tanggalLahir: '2008-12-25', gender: 'L' },
  { no: 5, nama: 'FARIZ RAFA AZMI', nisn: '0096713467', tempatLahir: 'KANDIS', tanggalLahir: '2009-03-02', gender: 'L' },
  { no: 6, nama: 'FIKRI SANDIKA', nisn: '0092081526', tempatLahir: 'DURI', tanggalLahir: '2009-04-26', gender: 'L' },
  { no: 7, nama: 'JOVAN FAHREJI ALWI', nisn: '0086365939', tempatLahir: 'BAGAN BATU', tanggalLahir: '2008-11-11', gender: 'L' },
  { no: 8, nama: 'M. RIZKY AL HABIL', nisn: '0099913738', tempatLahir: 'DURI', tanggalLahir: '2009-03-09', gender: 'L' },
  { no: 9, nama: 'M.PRADIKA', nisn: '0096223954', tempatLahir: 'DURI', tanggalLahir: '2009-06-11', gender: 'L' },
  { no: 10, nama: 'M.ZAKY ABQORY', nisn: '0091937780', tempatLahir: 'BALAI PUNGUT', tanggalLahir: '2009-06-01', gender: 'L' },
  { no: 11, nama: 'MUHAMMAD FAREL', nisn: '0084528362', tempatLahir: 'KANDIS', tanggalLahir: '2008-09-05', gender: 'L' },
  { no: 12, nama: 'NANANG KURNIAWAN CHOVA', nisn: '0095215537', tempatLahir: 'SERAI WANGI', tanggalLahir: '2009-11-23', gender: 'L' },
  { no: 13, nama: 'RAYHAN AKBAR RAMADHAN', nisn: '0092620124', tempatLahir: 'KANDIS', tanggalLahir: '2009-09-14', gender: 'L' },
  { no: 14, nama: 'RIZKI ALIANSYAH', nisn: '0083302744', tempatLahir: 'BOGOR', tanggalLahir: '2008-03-23', gender: 'L' },
  { no: 15, nama: 'ROBY ANDRIAN MIFTAHUL', nisn: '0082961745', tempatLahir: 'KANDIS', tanggalLahir: '2008-05-03', gender: 'L' },
  { no: 16, nama: 'WILDAN BAGUS SETIAWAN', nisn: '0085517251', tempatLahir: 'SERANG', tanggalLahir: '2008-11-14', gender: 'L' },
  { no: 17, nama: 'ZAIDAN AMALI RABBANI', nisn: '0068481178', tempatLahir: 'PEKANBARU', tanggalLahir: '2008-05-08', gender: 'L' },
  { no: 18, nama: 'ADINDA NOVIANA', nisn: '0085989966', tempatLahir: 'KAMP BANTAN', tanggalLahir: '2008-11-03', gender: 'P' },
  { no: 19, nama: 'AFIKA SALSABILA', nisn: '0084304433', tempatLahir: 'DURI', tanggalLahir: '2008-10-27', gender: 'P' },
  { no: 20, nama: 'AMANDA DWI APRIANTI', nisn: '0094975197', tempatLahir: 'SIAK', tanggalLahir: '2009-04-08', gender: 'P' },
  { no: 21, nama: 'ANGGI MUSLIMAH NASUTION', nisn: '0082943522', tempatLahir: 'DURI', tanggalLahir: '2008-12-15', gender: 'P' },
  { no: 22, nama: 'ANISAH PUTRI SIAHAAN', nisn: '0096513323', tempatLahir: 'KANDIS', tanggalLahir: '2009-07-05', gender: 'P' },
  { no: 23, nama: 'ARISKA NAILA JANNAH', nisn: '0093338945', tempatLahir: 'DURI', tanggalLahir: '2009-05-19', gender: 'P' },
  { no: 24, nama: 'AZAHRO ARSYA PUTRI', nisn: '3096986500', tempatLahir: 'BALAM SEMPURNA', tanggalLahir: '2009-08-17', gender: 'P' },
  { no: 25, nama: 'AZRA SYAFWANI SUHAIMI', nisn: '0099798434', tempatLahir: 'BALAI PUNGUT', tanggalLahir: '2009-10-14', gender: 'P' },
  { no: 26, nama: 'CHARINA PUTRI', nisn: '0098031367', tempatLahir: 'BANGKO SEMPURNA', tanggalLahir: '2009-06-21', gender: 'P' },
  { no: 27, nama: 'CINTA SRI MUTIARA', nisn: '0097522024', tempatLahir: 'BUKIT KERIKIL', tanggalLahir: '2009-05-28', gender: 'P' },
  { no: 28, nama: 'CITRA LESTARI', nisn: '0098710953', tempatLahir: 'DURI', tanggalLahir: '2009-07-06', gender: 'P' },
  { no: 29, nama: 'FAHIRA NAIRA', nisn: '0095722579', tempatLahir: 'SIAK', tanggalLahir: '2009-06-28', gender: 'P' },
  { no: 30, nama: 'FITRI PERMATA SARI', nisn: '0096078894', tempatLahir: 'DURI', tanggalLahir: '2009-06-10', gender: 'P' },
  { no: 31, nama: 'LUNA RAHMAWATI', nisn: '0082367343', tempatLahir: 'BERINGIN LESTARI', tanggalLahir: '2008-12-21', gender: 'P' },
  { no: 32, nama: 'LUQYANA ZAHRA', nisn: '0098875485', tempatLahir: 'BALAI PUNGUT', tanggalLahir: '2009-09-16', gender: 'P' },
  { no: 33, nama: 'NAZZUWA AL MUKAROMAH', nisn: '0094068413', tempatLahir: 'KAMPAR', tanggalLahir: '2009-04-10', gender: 'P' },
  { no: 34, nama: 'NINDIA ZAHRA YOLANDA', nisn: '0093724563', tempatLahir: 'KAMPAR', tanggalLahir: '2009-04-18', gender: 'P' },
  { no: 35, nama: 'NUR HAFIZHAH RAMADHANI', nisn: '0084524610', tempatLahir: 'DURI', tanggalLahir: '2008-09-13', gender: 'P' },
  { no: 36, nama: 'NUR HANIFAH', nisn: '0097042201', tempatLahir: 'KANDIS', tanggalLahir: '2009-01-08', gender: 'P' },
  { no: 37, nama: 'NYARDIA RAMADHANI', nisn: '0089783443', tempatLahir: 'SERAI WANGI', tanggalLahir: '2008-09-26', gender: 'P' },
  { no: 38, nama: 'SITI NURAISYAH BR GURNING', nisn: '0091928442', tempatLahir: 'DANAU LANCANG', tanggalLahir: '2009-06-22', gender: 'P' },
  { no: 39, nama: 'ZALFA AGUSSYAFLINA', nisn: '3083981489', tempatLahir: 'BATAM', tanggalLahir: '2008-08-02', gender: 'P' },
  { no: 40, nama: 'AGIL FAHRI ARMADI', nisn: '0095245343', tempatLahir: 'KANDIS', tanggalLahir: '2009-04-25', gender: 'L' },
  { no: 41, nama: 'AHMAD ROBBY CAHYO RIZKI', nisn: '0099800313', tempatLahir: 'PROBOLINGGO', tanggalLahir: '2009-08-08', gender: 'L' },
  { no: 42, nama: 'ARIES SYAH REZA', nisn: '0097734242', tempatLahir: 'P SIANTAR', tanggalLahir: '2009-02-15', gender: 'L' },
  { no: 43, nama: 'AULIA VELIANI', nisn: '0091216030', tempatLahir: 'SIAK', tanggalLahir: '2009-05-25', gender: 'P' },
  { no: 44, nama: 'BULAN SARI IRAWAN', nisn: '0097092954', tempatLahir: 'BANGKINANG', tanggalLahir: '2009-04-25', gender: 'P' },
  { no: 45, nama: 'DENNIS AGUS SAPUTRA', nisn: '0083731685', tempatLahir: 'DURI', tanggalLahir: '2008-08-17', gender: 'L' },
  { no: 46, nama: 'DISTA RIA ADHANI', nisn: '0086042806', tempatLahir: 'TASIK SERAI', tanggalLahir: '2008-12-05', gender: 'P' },
  { no: 47, nama: 'HABIBAH SIREGAR', nisn: '0098700374', tempatLahir: 'KOTA GARO', tanggalLahir: '2009-02-14', gender: 'P' },
  { no: 48, nama: 'HAFIZHUL RIZKY', nisn: '0094790976', tempatLahir: 'KIJANG MAKMUR', tanggalLahir: '2009-04-28', gender: 'L' },
  { no: 49, nama: 'JAMILAH NUR HIDAYAH SIREGAR', nisn: '0081487516', tempatLahir: 'DURI', tanggalLahir: '2008-10-20', gender: 'P' },
  { no: 50, nama: 'MAHRIZA AMALIYAH', nisn: '0093109010', tempatLahir: 'SIAK', tanggalLahir: '2009-08-21', gender: 'P' },
  { no: 51, nama: 'MUHAMMAD GILANG PRATAMA', nisn: '0087072273', tempatLahir: 'KIJANG JAYA', tanggalLahir: '2008-11-27', gender: 'L' },
  { no: 52, nama: 'MUHAMMAD REHAN MANZAH', nisn: '0084556890', tempatLahir: 'LANGKAT', tanggalLahir: '2008-10-05', gender: 'L' },
  { no: 53, nama: 'NAYLAH ALIFIA AN-NADHIRA', nisn: '0089276963', tempatLahir: 'KAMPAR', tanggalLahir: '2008-11-23', gender: 'P' },
  { no: 54, nama: 'NIRVISA AULIA SUKMA', nisn: '0095464101', tempatLahir: 'KOTA GARO', tanggalLahir: '2009-02-16', gender: 'P' },
  { no: 55, nama: 'NURSYAHFITRI NASUTION', nisn: '0078640646', tempatLahir: 'KANDIS', tanggalLahir: '2007-10-13', gender: 'P' },
  { no: 56, nama: 'PUTRI SYAFA AULIA', nisn: '0092059258', tempatLahir: 'KANDIS', tanggalLahir: '2009-10-06', gender: 'P' },
  { no: 57, nama: 'RAFLI HARTONO', nisn: '0094057010', tempatLahir: 'PEKANBARU', tanggalLahir: '2009-02-11', gender: 'L' },
  { no: 58, nama: 'RIDHO RIZKY ADISSY', nisn: '0076752567', tempatLahir: 'KANDIS', tanggalLahir: '2007-11-16', gender: 'L' },
  { no: 59, nama: 'SAHRUL LAZI', nisn: '0098980178', tempatLahir: 'TASIK SERAI TIMUR', tanggalLahir: '2009-06-07', gender: 'L' },
  { no: 60, nama: 'SUCI ANGREANI SARAGIH', nisn: '0096945286', tempatLahir: 'SILAU MERAWAN', tanggalLahir: '2009-04-05', gender: 'P' },
  { no: 61, nama: 'SUCI AULIA DINI', nisn: '3096213415', tempatLahir: 'DUSUN SUKA MAJU', tanggalLahir: '2009-07-12', gender: 'P' },
  { no: 62, nama: 'SYAHRON AHMADI MAHA', nisn: '0085780278', tempatLahir: 'KANDIS', tanggalLahir: '2008-07-24', gender: 'L' },
  { no: 63, nama: 'ZANY BELLANI', nisn: '0097122790', tempatLahir: 'CINTA DAMAI', tanggalLahir: '2009-05-06', gender: 'P' },
  { no: 64, nama: 'ANSHORUDDIN', nisn: '0095659160', tempatLahir: 'DURI', tanggalLahir: '2009-04-20', gender: 'L' },
  { no: 65, nama: 'AUFA NURHAFIZAH', nisn: '0085494214', tempatLahir: 'KANDIS', tanggalLahir: '2008-12-26', gender: 'P' },
  { no: 66, nama: 'AULIA RAMADHINI', nisn: '3088288265', tempatLahir: 'PASAR VII', tanggalLahir: '2008-09-23', gender: 'P' },
  { no: 67, nama: "FA'IS DWI FADILAH", nisn: '0093729000', tempatLahir: 'RIAU', tanggalLahir: '2009-04-08', gender: 'L' },
  { no: 68, nama: 'FARDAN ARGA RIZKY', nisn: '0098904359', tempatLahir: 'DURI', tanggalLahir: '2009-04-23', gender: 'L' },
  { no: 69, nama: 'ILMI HAYATI', nisn: '0098132562', tempatLahir: 'HADANGKAHAN', tanggalLahir: '2009-06-29', gender: 'P' },
  { no: 70, nama: 'KHANAYA ARDHANI', nisn: '0089691888', tempatLahir: 'BANGUN REJO', tanggalLahir: '2008-02-29', gender: 'P' },
  { no: 71, nama: 'MUHAMMAD ADE ANGGRIYAN', nisn: '0082332262', tempatLahir: 'SIAK', tanggalLahir: '2008-12-30', gender: 'L' },
  { no: 72, nama: 'MUHAMMAD MUNIR', nisn: '0083512845', tempatLahir: 'MUARA BASUNG', tanggalLahir: '2008-12-13', gender: 'L' },
  { no: 73, nama: 'MUHAMMAD ZEAN ALFARIZY', nisn: '0092277752', tempatLahir: 'SUNGAI SELARI', tanggalLahir: '2009-06-01', gender: 'L' },
  { no: 74, nama: 'MUHIBBAH', nisn: '0072225813', tempatLahir: 'HADANGKAHAN', tanggalLahir: '2007-07-06', gender: 'P' },
  { no: 75, nama: 'NADYA NOVIANI', nisn: '0097384903', tempatLahir: 'BASILAM', tanggalLahir: '2009-11-13', gender: 'P' },
  { no: 76, nama: 'NANDA INDRIANI', nisn: '0083193548', tempatLahir: 'TENGGANAU', tanggalLahir: '2008-06-24', gender: 'P' },
  { no: 77, nama: 'NAYYA MELHANIE SALSABILA', nisn: '0092458582', tempatLahir: 'SIAK', tanggalLahir: '2009-01-26', gender: 'P' },
  { no: 78, nama: 'NURAINI', nisn: '0092481234', tempatLahir: 'PINGGIR', tanggalLahir: '2009-05-31', gender: 'P' },
  { no: 79, nama: 'PAJAR PUTRI ALIFVIA', nisn: '0091802521', tempatLahir: 'BANGUN JAYA', tanggalLahir: '2009-01-16', gender: 'P' },
  { no: 80, nama: 'RAFIQ AL ANSHAR', nisn: '0098600799', tempatLahir: 'PEKANBARU', tanggalLahir: '2009-08-05', gender: 'L' },
  { no: 81, nama: 'SAHREL ALFIANES', nisn: '0091896444', tempatLahir: 'MAUR HILIR', tanggalLahir: '2009-06-26', gender: 'L' },
  { no: 82, nama: 'SAKHA BAIHAQI RIYADI', nisn: '0095572646', tempatLahir: 'BENGKALIS', tanggalLahir: '2009-07-07', gender: 'L' },
  { no: 83, nama: 'WILLIS AULIA BATUBARA', nisn: '0098233795', tempatLahir: 'SIAK', tanggalLahir: '2009-09-12', gender: 'P' },
  { no: 84, nama: 'ZAHIRAH RABBANI', nisn: '0085862657', tempatLahir: 'A JUNGKETACEH', tanggalLahir: '2008-01-15', gender: 'P' },
];

export const MA_KELAS_XI_STUDENTS: Student[] = RAW_MA_KELAS_XI.map((row) => {
  const seq = String(row.no).padStart(3, '0');
  return {
    id: `std-ma-xi-${seq}`,
    nomorPeserta: `26-MA-XI-${seq}`,
    nisn: row.nisn,
    nama: row.nama,
    jenjang: 'MA',
    kelas: 'XI',
    jurusan: '',
    tempatLahir: row.tempatLahir,
    tanggalLahir: row.tanggalLahir,
    ruang: row.no <= 32 ? 'Lab CBT 1' : 'Lab CBT 2',
    sesi: 'Sesi 1 (Pagi)',
    pin: buildPinFromNisn(row.nisn, row.no),
    gender: row.gender,
    statusAktif: true,
  };
});

export const MA_KELAS_XII_STUDENTS: Student[] = RAW_MA_KELAS_XII.map((row) => {
  const seq = String(row.no).padStart(3, '0');
  return {
    id: `std-ma-xii-${seq}`,
    nomorPeserta: `26-MA-XII-${seq}`,
    nisn: row.nisn,
    nama: row.nama,
    jenjang: 'MA',
    kelas: 'XII',
    jurusan: '',
    tempatLahir: row.tempatLahir,
    tanggalLahir: row.tanggalLahir,
    ruang: row.no <= 42 ? 'Lab CBT 1' : 'Lab CBT 2',
    sesi: 'Sesi 2 (Siang)',
    pin: buildPinFromNisn(row.nisn, 100 + row.no),
    gender: row.gender,
    statusAktif: true,
  };
});

export const MA_RDM_REAL_STUDENTS: Student[] = [
  ...MA_KELAS_XI_STUDENTS,
  ...MA_KELAS_XII_STUDENTS,
];
