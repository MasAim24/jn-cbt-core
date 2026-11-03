import { ExamPacket } from '../types/cbt';

export const INITIAL_PACKETS: ExamPacket[] = [
  {
    id: 'pkt-mts-01',
    code: 'CBT-MTS-FQH-08',
    title: 'Penilaian Akhir Semester — Fiqih Ibadah & Muamalah',
    mapel: 'Fiqih MTs',
    jenjang: 'MTs',
    kelas: 'VIII (Delapan)',
    guruNama: 'Ust. H. Mahfudz Siddiq, S.Pd.I',
    optionCount: 4,
    kkm: 75,
    hasArabicKitab: true,
    updatedAt: '03 Nov 2026, 07:30',
    questions: [
      {
        id: 'q-mts-1',
        nomor: 1,
        type: 'PG',
        prompt:
          'Perhatikan lafaz niat sujud syukur di atas. Hukum melaksanakan sujud syukur ketika seorang muslim mendapatkan nikmat besar atau selamat dari musibah adalah...',
        arabicPrompt: 'نَوَيْتُ سُجُوْدَ الشُّكْرِ سُنَّةً لِلّٰهِ تَعَالَى',
        kitabReference: 'Fiqih MTs Kelas VIII — Bab Sujud Syukur & Tilawah',
        isRtl: true,
        options: [
          { label: 'A', text: 'Fardhu Ain bagi setiap muslim yang mukallaf' },
          {
            label: 'B',
            text: 'Sunnah Muakkadah saat memperoleh nikmat baru atau terhindar dari bencana',
          },
          { label: 'C', text: 'Fardhu Kifayah apabila dilakukan secara berjamaah di masjid' },
          { label: 'D', text: 'Makruh apabila dilakukan di luar waktu shalat fardhu' },
        ],
        correctAnswer: 'B',
        weight: 25,
        pembahasan:
          'Hukum sujud syukur adalah sunnah ketika mendapatkan nikmat yang luar biasa atau selamat dari bencana, dan dilakukan di luar shalat.',
      },
      {
        id: 'q-mts-2',
        nomor: 2,
        type: 'PG_KOMPLEKS',
        prompt:
          'Pilihlah DUA syarat wajib zakat mal (harta benda) yang harus dipenuhi oleh seorang muzakki sebelum berkewajiban mengeluarkan zakatnya!',
        kitabReference: 'Fiqih MTs Kelas VIII — Bab Zakat Fitrah & Zakat Mal',
        options: [
          {
            label: 'A',
            text: 'Kepemilikan harta telah mencapai batas minimal satu nisab sesuai jenis hartanya',
          },
          {
            label: 'B',
            text: 'Telah berlalu masa kepemilikan penuh selama satu haul (satu tahun Qamariyah)',
          },
          {
            label: 'C',
            text: 'Harta tersebut harus diperoleh semata-mata dari harta warisan keluarga',
          },
          {
            label: 'D',
            text: 'Wajib dibayarkan hanya pada malam Hari Raya Idul Fitri sebelum shalat Id',
          },
        ],
        correctAnswers: ['A', 'B'],
        weight: 25,
        pembahasan:
          'Syarat wajib zakat mal meliputi: beragama Islam, merdeka, kepemilikan sempurna (milkul tam), mencapai nisab, dan genap satu haul.',
      },
      {
        id: 'q-mts-3',
        nomor: 3,
        type: 'BENAR_SALAH',
        prompt:
          'Berdasarkan hadits di atas, seseorang yang sedang berpuasa Ramadhan lalu makan atau minum karena benar-benar lupa (tidak sengaja), maka puasanya tetap sah dan wajib dilanjutkan hingga waktu Maghrib.',
        arabicPrompt:
          'مَنْ نَسِيَ وَهُوَ صَائِمٌ فَأَكَلَ أَوْ شَرِبَ فَلْيُتِمَّ صَوْمَهُ، فَإِنَّمَا أَطْعَمَهُ اللّٰهُ وَسَقَاهُ',
        kitabReference: 'Fiqih MTs Kelas VIII — Bab Puasa Ramadhan',
        isRtl: true,
        correctBoolean: true,
        weight: 20,
        pembahasan:
          'Pernyataan Benar (Shahih). Berdasarkan hadits riwayat Bukhari dan Muslim, makan atau minum karena lupa tidak membatalkan puasa.',
      },
      {
        id: 'q-mts-4',
        nomor: 4,
        type: 'ESAI',
        prompt:
          'Jelaskan perbedaan mendasar antara Shalat Jamak Taqdim dan Jamak Takhir beserta syarat sah pelaksanaannya bagi seorang musafir!',
        kitabReference: 'Fiqih MTs Kelas VIII — Bab Shalat Musafir (Jamak & Qashar)',
        essayRubric:
          'Jamak Taqdim dikerjakan pada waktu shalat yang pertama (Dzuhur atau Maghrib) dengan syarat: memulai dengan shalat pemilik waktu pertama (tertib), niat jamak pada shalat pertama, dan berurutan (muwalah). Sedangkan Jamak Takhir dikerjakan pada waktu shalat yang kedua (Ashar atau Isya) dengan syarat berniat jamak takhir ketika masih berada di waktu shalat pertama.',
        weight: 30,
        pembahasan:
          'Penilaian mencakup ketepatan definisi waktu pelaksanaan serta minimal tiga syarat sah Jamak Taqdim dan Jamak Takhir.',
      },
    ],
  },
  {
    id: 'pkt-ma-01',
    code: 'CBT-MA-USH-12',
    title: 'Ujian Madrasah Berbasis Komputer — Ushul Fiqih & Maqashid Syariah',
    mapel: 'Ushul Fiqih MA',
    jenjang: 'MA',
    kelas: 'XII Keagamaan',
    guruNama: 'KH. Dr. Lukman Hakim, M.Ag.',
    optionCount: 5,
    kkm: 78,
    hasArabicKitab: true,
    updatedAt: '03 Nov 2026, 08:15',
    questions: [
      {
        id: 'q-ma-1',
        nomor: 1,
        type: 'PG',
        prompt:
          'Perhatikan kaidah ushuliyah di atas. Makna yang paling tepat dari kaidah tersebut dalam istinbath hukum Islam adalah...',
        arabicPrompt: 'الأَصْلُ فِي الأَمْرِ لِلْوُجُوْبِ إِلَّا مَا دَلَّ الدَّلِيْلُ عَلَى خِلَافِهِ',
        kitabReference: 'Al-Waraqat fi Ushulil Fiqh — Bab Al-Amr wan Nahyu',
        isRtl: true,
        options: [
          {
            label: 'A',
            text: 'Setiap larangan pada dasarnya menunjukkan keharaman mutlak tanpa pengecualian',
          },
          {
            label: 'B',
            text: 'Hukum asal dari suatu kalimat perintah (amr) adalah wajib, kecuali ada dalil atau qarinah yang memalingkannya',
          },
          {
            label: 'C',
            text: 'Setiap perintah di dalam Al-Qur’an hanya berlaku khusus bagi generasi sahabat Nabi',
          },
          {
            label: 'D',
            text: 'Hukum asal segala sesuatu dalam muamalah adalah mubah sampai ada dalil yang mengharamkan',
          },
          {
            label: 'E',
            text: 'Suatu perintah yang disebutkan berulang kali selalu bermakna sunnah muakkadah',
          },
        ],
        correctAnswer: 'B',
        weight: 25,
        pembahasan:
          'Kaidah Al-Ashlu fil amri lil wujub menegaskan bahwa sighat amr (perintah) menunjukkan hukum wajib selama tidak ada indikasi (qarinah) yang mengalihkannya ke hukum sunnah atau mubah.',
      },
      {
        id: 'q-ma-2',
        nomor: 2,
        type: 'PG_KOMPLEKS',
        prompt:
          'Dalam konsep Maqashid al-Syariah (Al-Kulliyyat Al-Khamsah), pilihlah TIGA unsur pokok kemaslahatan yang wajib dipelihara pada tingkatan dharuriyyat!',
        kitabReference: 'Ushul Fiqih MA Kelas XII — Bab Maqashid al-Syariah',
        options: [
          {
            label: 'A',
            text: 'Hifzh al-Din (Memelihara Agama) dan Hifzh al-Nafs (Memelihara Jiwa)',
          },
          {
            label: 'B',
            text: 'Hifzh al-Aql (Memelihara Akal) dan Hifzh al-Nasl (Memelihara Keturunan)',
          },
          {
            label: 'C',
            text: 'Hifzh al-Mal (Memelihara Harta Benda secara halal dan adil)',
          },
          {
            label: 'D',
            text: 'Mengutamakan kemewahan materiil di atas kemaslahatan umat',
          },
          {
            label: 'E',
            text: 'Menghapus seluruh metode qiyas dalam permasalahan kontemporer',
          },
        ],
        correctAnswers: ['A', 'B', 'C'],
        weight: 25,
        pembahasan:
          'Lima pokok kemaslahatan (Al-Dharuriyyat Al-Khams) meliputi penjagaan terhadap Agama (al-Din), Jiwa (al-Nafs), Akal (al-Aql), Keturunan (al-Nasl), dan Harta (al-Mal).',
      },
      {
        id: 'q-ma-3',
        nomor: 3,
        type: 'BENAR_SALAH',
        prompt:
          'Sebagaimana kaidah di atas, Qiyas terdiri atas empat rukun utama, yaitu: Al-Ashlu (pokok tempat mengqiyaskan), Al-Far’u (cabang kasus baru), Hukmu al-Ashl (hukum asal), dan Al-’Illah (sifat penghubung hukum).',
        arabicPrompt: 'أَرْكَانُ الْقِيَاسِ أَرْبَعَةٌ: الأَصْلُ، وَالْفَرْعُ، وَحُكْمُ الأَصْلِ، وَالْعِلَّةُ',
        kitabReference: 'Al-Luma’ fi Ushulil Fiqh — Bab Al-Qiyas',
        isRtl: true,
        correctBoolean: true,
        weight: 20,
        pembahasan:
          'Pernyataan Benar (Shahih). Keempat rukun qiyas tersebut merupakan syarat mutlak sahnya analogi hukum syar’i.',
      },
      {
        id: 'q-ma-4',
        nomor: 4,
        type: 'ESAI',
        prompt:
          'Uraikan bagaimana penerapan metode Maslahah Mursalah dalam menjawab keabsahan hukum transaksi pembayaran digital (seperti QRIS dan dompet elektronik) di era modern!',
        kitabReference: 'Ushul Fiqih Kontemporer — Bab Dalil-Dalil Mukhtalaf Fiha',
        essayRubric:
          'Menjelaskan pengertian Maslahah Mursalah (kemaslahatan umum yang selaras dengan tujuan syariat dan tidak bertentangan dengan nash), keabsahan akad pembayaran digital selama bebas dari unsur riba, gharar (ketidakjelasan), dan maysir, serta mewujudkan kemudahan transaksi (raf’ul haraj) dan penjagaan harta (hifzh al-mal).',
        weight: 30,
        pembahasan:
          'Skor penuh diberikan apabila santri mengaitkan syarat sah akad muamalah dengan prinsip kemaslahatan umum dan ketiadaan unsur riba/gharar.',
      },
    ],
  },
  {
    id: 'pkt-wustho-01',
    code: 'CBT-WST-NHW-02',
    title: 'Imtihan Diniyah Wustho — Ilmu Nahwu (Matan Al-Ajurrumiyah & Imrithi)',
    mapel: 'Nahwu & Shorof (Wustho)',
    jenjang: 'Wustho',
    kelas: 'Marhalah II Wustho',
    guruNama: 'Ust. Muhammad Zidni Ilman, Lc.',
    optionCount: 4,
    kkm: 70,
    hasArabicKitab: true,
    updatedAt: '03 Nov 2026, 08:40',
    questions: [
      {
        id: 'q-wst-1',
        nomor: 1,
        type: 'PG',
        prompt:
          'Perhatikan kutipan Matan Al-Ajurrumiyah di atas. Berdasarkan ibarat kitab tersebut, syarat suatu ucapan dikategorikan sebagai "Al-Kalam" menurut ulama Nahwu ada empat, yaitu...',
        arabicPrompt:
          'الْكَلَامُ: هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيْدُ بِالْوَضْعِ. وَأَقْسَامُهُ ثَلَاثَةٌ: اِسْمٌ، وَفِعْلٌ، وَحَرْفٌ جَاءَ لِمَعْنًى',
        kitabReference: 'Matan Al-Ajurrumiyah — Bab Al-Kalam',
        isRtl: true,
        options: [
          {
            label: 'A',
            text: 'Berupa Lafazh, Murakkab (tersusun), Mufid (memberi faedah sempurna), dan Bil-Wadh’i (disengaja dalam bahasa Arab)',
          },
          {
            label: 'B',
            text: 'Berupa Isim, Fi’il, Huruf, dan Zharaf yang seluruhnya dibaca manshub',
          },
          {
            label: 'C',
            text: 'Terdiri atas Mubtada, Khabar, Fa’il, dan Maf’ul Bih secara bersamaan dalam satu kalimat',
          },
          {
            label: 'D',
            text: 'Berupa tulisan tangan, isyarat anggota tubuh, serta bunyi benda mati',
          },
        ],
        correctAnswer: 'A',
        weight: 25,
        pembahasan:
          'Syarat Kalam menurut Mushannif Ibnu Ajurrum ada empat: harus berupa Lafazh, Murakkab (minimal dua kata), Mufid (memahamkan pendengar), dan Bil-Wadh’i.',
      },
      {
        id: 'q-wst-2',
        nomor: 2,
        type: 'PG_KOMPLEKS',
        prompt:
          'Berdasarkan ibarat Matan Al-Ajurrumiyah di atas, pilihlah DUA pernyataan yang termasuk tanda-tanda pengenal kalimat Isim (Alamatul Ismi)!',
        arabicPrompt:
          'فَالْاِسْمُ يُعْرَفُ بِالْخَفْضِ وَالتَّنْوِيْنِ وَدُخُوْلِ الأَلِفِ وَاللَّامِ وَحُرُوْفِ الْخَفْضِ',
        kitabReference: 'Matan Al-Ajurrumiyah — Bab Alamatul I’rab & Alamatul Ismi',
        isRtl: true,
        options: [
          {
            label: 'A',
            text: 'Menerima i’rab Khafadh (Jar) di akhir kata serta dapat menerima harakat Tanwin',
          },
          {
            label: 'B',
            text: 'Dapat diawali oleh Alif-Lam (Al-Ta’rif) serta dimasuki huruf-huruf Khafadh (seperti Min, Ila, ’An, dan ’Ala)',
          },
          {
            label: 'C',
            text: 'Dapat diawali oleh huruf Sin dan Saufa yang menunjukkan arti masa yang akan datang',
          },
          {
            label: 'D',
            text: 'Dapat bersambung dengan Ta’ Ta’nits Sakinah di bagian akhir katanya',
          },
        ],
        correctAnswers: ['A', 'B'],
        weight: 25,
        pembahasan:
          'Tanda kalimat Isim ada empat: Khafadh (Jar), Tanwin, kemasukan Alif-Lam, dan kemasukan Huruf Jar. Adapun huruf Sin, Saufa, dan Ta’ Ta’nits Sakinah adalah tanda kalimat Fi’il.',
      },
      {
        id: 'q-wst-3',
        nomor: 3,
        type: 'BENAR_SALAH',
        prompt:
          'Sesuai kutipan kitab di atas, Isim Mufrad dan Jamak Taksir ketika berkedudukan pada mahal rafa’ memiliki tanda i’rab rafa’ berupa harakat Dhammah.',
        arabicPrompt:
          'فَأَمَّا الضَّمَّةُ فَتَكُوْنُ عَلَامَةً لِلرَّفْعِ فِي أَرْبَعَةِ مَوَاضِعَ: فِي الْاِسْمِ الْمُفْرَدِ، وَجَمْعِ التَّكْسِيْرِ، وَجَمْعِ الْمُؤَنَّثِ السَّالِمِ، وَالْفِعْلِ الْمُضَارِعِ',
        kitabReference: 'Matan Al-Ajurrumiyah — Bab Ma’rifatu Alamatil I’rab',
        isRtl: true,
        correctBoolean: true,
        weight: 20,
        pembahasan:
          'Pernyataan Benar (Shahih). Dhammah menjadi tanda rafa’ pada empat tempat: Isim Mufrad, Jamak Taksir, Jamak Muannats Salim, dan Fi’il Mudhari’ yang akhirnya tidak bertemu sesuatu.',
      },
      {
        id: 'q-wst-4',
        nomor: 4,
        type: 'ESAI',
        prompt:
          'Tuliskan tarkib dan i’rab lengkap untuk setiap kata pada jumlah mufidah di atas (Jaa’a Zaidun al-’Aalimu)!',
        arabicPrompt: 'أَعْرِبْ مَا يَلِي إِعْرَابًا تَامًّا: جَاءَ زَيْدٌ الْعَالِمُ',
        kitabReference: 'Matan Al-Ajurrumiyah — Bab Al-Fa’il & Bab Al-Na’at',
        isRtl: true,
        essayRubric:
          '1) Lafazh "Jaa’a": Fi’il Madhi mabni fathah. 2) Lafazh "Zaidun": Fa’il marfu’ dengan tanda rafa’ dhammah zhahirah di akhirnya karena berupa isim mufrad. 3) Lafazh "Al-’Aalimu": Na’at (sifat) bagi Zaidun, mengikuti man’ut pada mahal rafa’ dengan tanda dhammah zhahirah.',
        weight: 30,
        pembahasan:
          'Penilaian mencakup ketepatan mengidentifikasi Fi’il Madhi, Fa’il marfu’, serta Na’at (Sifat) yang mengikuti i’rab man’ut-nya.',
      },
    ],
  },
  {
    id: 'pkt-ulya-01',
    code: 'CBT-ULY-ALF-03',
    title: "Imtihan Marhalah 'Ulya — Alfiyah Ibnu Malik & Fiqih Fathul Mu'in",
    mapel: "Alfiyah & Bahtsul Masail ('Ulya)",
    jenjang: 'Ulya',
    kelas: "Marhalah III 'Ulya",
    guruNama: 'Syaikhina KH. Bahauddin Nursalim',
    optionCount: 5,
    kkm: 80,
    hasArabicKitab: true,
    updatedAt: '03 Nov 2026, 09:00',
    questions: [
      {
        id: 'q-uly-1',
        nomor: 1,
        type: 'PG',
        prompt:
          'Perhatikan bait Nadhom Alfiyah Ibnu Malik pada Bab Al-Ibtida di atas. Hukum asal peletakan Khabar dan ketentuan mendahulukan Khabar atas Mubtada menurut bait tersebut adalah...',
        arabicPrompt: 'وَالأَصْلُ فِي الأَخْبَارِ أَنْ تُؤَخَّرَا ۞ وَجَوَّزُوا التَّقْدِيْمَ إِذْ لَا ضَرَرَا',
        kitabReference: 'Nadhom Alfiyah Ibnu Malik — Bab Al-Ibtida (Bait 127)',
        isRtl: true,
        options: [
          {
            label: 'A',
            text: 'Khabar wajib selalu didahulukan di atas Mubtada dalam setiap susunan jumlah ismiyyah',
          },
          {
            label: 'B',
            text: 'Hukum asal Khabar adalah diakhirkan setelah Mubtada, namun boleh didahulukan selama tidak menimbulkan kerancuan makna (iltibas)',
          },
          {
            label: 'C',
            text: 'Mubtada boleh terbuat dari isim nakirah mahdhah tanpa persyaratan musawwigh apapun',
          },
          {
            label: 'D',
            text: 'Khabar yang berbentuk jumlah fi’liyyah tidak memerlukan dhamir rabith ke Mubtada',
          },
          {
            label: 'E',
            text: 'Khabar mufrad wajib selalu berupa isim jamid yang tidak mengandung dhamir mustatir',
          },
        ],
        correctAnswer: 'B',
        weight: 25,
        pembahasan:
          'Ibnu Malik menjelaskan bahwa hukum asal khabar adalah diakhirkan (ta’khir), tetapi ulama Nahwu memperbolehkan taqdimul khabar selama aman dari bahaya kesamaran makna (dharar/iltibas).',
      },
      {
        id: 'q-uly-2',
        nomor: 2,
        type: 'PG_KOMPLEKS',
        prompt:
          'Berdasarkan ibarat Kitab Fathul Mu’in pada Bab Shalat Berjamaah di atas, pilihlah DUA ketentuan syarat sah qudwah (bermakmum) kepada imam!',
        arabicPrompt:
          'وَشُرِطَ لِصِحَّةِ الْقُدْوَةِ عَدَمُ تَقَدُّمِهِ عَلَى إِمَامِهِ فِي الْمَوْقِفِ، وَعِلْمُهُ بِانْتِقَالَاتِ إِمَامِهِ',
        kitabReference: "Fathul Mu'in bi Syarhi Qurratil 'Ain — Fashl fi Shalatil Jama'ah",
        isRtl: true,
        options: [
          {
            label: 'A',
            text: 'Tumit makmum tidak boleh mendahului tumit imam pada posisi tempat berdiri (al-mauqif)',
          },
          {
            label: 'B',
            text: 'Makmum mengetahui perpindahan gerakan rukun imam, baik dengan melihat langsung, melihat sebagian shaf, atau mendengar suara muballigh',
          },
          {
            label: 'C',
            text: 'Makmum wajib memiliki jumlah hafalan surat Al-Qur’an yang lebih banyak daripada imam',
          },
          {
            label: 'D',
            text: 'Jarak antara imam dan makmum di dalam satu bangunan masjid tidak boleh melebihi satu hasta',
          },
          {
            label: 'E',
            text: 'Imam dan makmum harus memiliki mazhab furu’iyyah yang sama persis dalam seluruh perkara sunnah',
          },
        ],
        correctAnswers: ['A', 'B'],
        weight: 25,
        pembahasan:
          'Syarat sah qudwah dalam Fathul Mu’in antara lain tidak mendahului posisi berdiri imam (diukur pada bagian tumit/al-’aqib) serta mengetahui perpindahan rukun (intiqalat) imam.',
      },
      {
        id: 'q-uly-3',
        nomor: 3,
        type: 'BENAR_SALAH',
        prompt:
          'Kaidah fiqhiyyah kubra di atas ("Keyakinan tidak dapat dihapuskan oleh keragu-raguan") menjadi landasan hukum bahwa seseorang yang yakin telah berwudhu lalu ragu apakah sudah berhadats atau belum, maka ia tetap dihukumi suci.',
        arabicPrompt: 'الْقَاعِدَةُ الثَّانِيَةُ الْكُبْرَى: الْيَقِيْنُ لَا يُزَالُ بِالشَّكِّ',
        kitabReference: 'Al-Asybah wan Nazhair — Al-Qawaid Al-Khams Al-Kubra',
        isRtl: true,
        correctBoolean: true,
        weight: 20,
        pembahasan:
          'Pernyataan Benar (Shahih). Ini adalah penerapan istishhab berdasarkan kaidah Al-Yaqinu la yuzalu bis-syakk.',
      },
      {
        id: 'q-uly-4',
        nomor: 4,
        type: 'ESAI',
        prompt:
          'Berikan syarah ringkas serta penjelasan istisyhad (contoh kalimat) atas bait pertama Bab Kalam dalam Nadhom Alfiyah Ibnu Malik di atas!',
        arabicPrompt:
          'اِشْرَحْ بَيْتَ ابْنِ مَالِكٍ الآتِي: كَلَامُنَا لَفْظٌ مُفِيْدٌ كَاسْتَقِمْ ۞ وَاسْمٌ وَفِعْلٌ ثُمَّ حَرْفٌ الْكَلِمْ',
        kitabReference: 'Syarah Ibnu ’Aqil ’ala Alfiyah Ibnu Malik — Bab Al-Kalam',
        isRtl: true,
        essayRubric:
          'Menjelaskan definisi Kalam menurut ulama Nahwu, yaitu lafazh yang memberi faedah sempurna sehingga pendengar tidak menunggu kata lain (yahsunu sukutul mutakallim ’alaihi), sebagaimana contoh lafazh "Istaqim" yang tersusun dari Fi’il Amr dan Fa’il berupa dhamir mustatir wujuban takdirnya "Anta". Adapun Al-Kalim adalah isim jenis yang tersusun dari tiga kalimah atau lebih (Isim, Fi’il, Huruf), baik memberi faedah sempurna maupun belum.',
        weight: 30,
        pembahasan:
          'Penilaian menitikberatkan pada analisis tarkib lafazh "Istaqim" serta pembedaan istilah Kalam, Kalim, Kalimat, dan Qaul.',
      },
    ],
  },
];
