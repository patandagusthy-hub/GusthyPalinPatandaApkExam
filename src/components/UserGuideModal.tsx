import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Users,
  FileQuestion,
  Calendar,
  Smartphone,
  Activity,
  FileSpreadsheet,
  LogIn,
  KeyRound,
  Camera,
  Check,
  Copy,
  Printer,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'admin' | 'student';
  onNavigateToTab?: (tab: string) => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'admin',
  onNavigateToTab,
}) => {
  const [activeRole, setActiveRole] = useState<'admin' | 'student'>(defaultRole);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'stepper' | 'all'>('stepper');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleCompleteStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((i) => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  // TEACHER / ADMIN STEPS IN STRICT CHRONOLOGICAL ORDER
  const teacherSteps = [
    {
      stepNumber: 1,
      title: 'Input & Kelola Data Siswa dan Kelas',
      icon: Users,
      badge: 'Tahap 1: Persiapan Peserta',
      color: 'from-blue-600 to-indigo-600',
      actionTab: 'students',
      actionLabel: 'Buka Menu Data Siswa',
      summary: 'Daftarkan seluruh siswa yang akan mengikuti ujian ke dalam sistem.',
      details: [
        'Buka menu **Data Siswa & Kelas** di Dashboard Admin.',
        'Tambahkan kelas terlebih dahulu (contoh: X-IPA 1, XI-IPS 2, XII-MIPA).',
        'Tambah siswa satu per satu, atau gunakan fitur **Import Excel / CSV** agar cepat.',
        'Atur **NISN / Username** dan **PIN Login** unik untuk tiap siswa (PIN default: `123`).',
        'Anda juga dapat mencetak **Kartu Peserta Ujian** ber-QR Code untuk dibagikan ke siswa.'
      ],
      proTip: 'Pastikan data NISN siswa tidak ganda agar riwayat nilai terekam akurat di laporan.'
    },
    {
      stepNumber: 2,
      title: 'Buat & Susun Bank Soal Ujian',
      icon: FileQuestion,
      badge: 'Tahap 2: Materi Ujian',
      color: 'from-indigo-600 to-violet-600',
      actionTab: 'questions',
      actionLabel: 'Buka Bank Soal',
      summary: 'Siapkan soal pilihan ganda, essay, atau gunakan asisten AI Gemini.',
      details: [
        'Buka menu **Bank Soal** di Dashboard Admin.',
        'Pilih mata pelajaran & jenjang kelas.',
        'Gunakan opsi pembuatan soal:',
        '  • **Manual**: Ketik pertanyaan, pilihan A/B/C/D/E, kunci jawaban, dan pembahasan.',
        '  • **Upload Gambar / Rumus**: Masukkan gambar soal matematika/sains jika ada.',
        '  • **AI Question Generator**: Masukkan topik materi, AI akan membuatkan paket soal lengkap beserta kunci dalam hitungan detik.',
        '  • **Import Excel/Word**: Upload file template soal jika sudah memiliki naskah soal.'
      ],
      proTip: 'Aktifkan fitur pengacakan urutan soal dan opsi jawaban saat mengatur jadwal agar siswa tidak bisa saling contek.'
    },
    {
      stepNumber: 3,
      title: 'Atur Jadwal, Durasi, & Keamanan Ujian',
      icon: Calendar,
      badge: 'Tahap 3: Jadwal & Token',
      color: 'from-violet-600 to-purple-600',
      actionTab: 'schedules',
      actionLabel: 'Buka Jadwal Ujian',
      summary: 'Tentukan tanggal pelaksanaan, alokasi waktu menit, dan token aktivasi.',
      details: [
        'Buka menu **Jadwal & Sesi Ujian**.',
        'Klik **+ Buat Jadwal Ujian Baru**.',
        'Tentukan Nama Ujian, Mata Pelajaran, Kelas Sasaran, dan Tanggal & Jam Mulai.',
        'Atur **Durasi Waktu** (misal: 60 menit atau 90 menit).',
        'Buat **Token Ujian** (misal: `PAS2026` atau `UTS-IPA`) yang wajib diinput siswa sebelum mulai.',
        'Centang fitur keamanan: **Kamera Pengawas (AI Proctoring)**, **Acak Soal**, dan **Batas Maksimal Pelanggaran**.'
      ],
      proTip: 'Token ujian hanya dibagikan kepada siswa saat ujian tepat dimulai di dalam kelas.'
    },
    {
      stepNumber: 4,
      title: 'Bagikan Link / Tampilkan QR Code ke Siswa',
      icon: Smartphone,
      badge: 'Tahap 4: Pembagian Akses',
      color: 'from-purple-600 to-pink-600',
      actionTab: 'share',
      actionLabel: 'Buka Menu Bagikan Siswa',
      summary: 'Bagikan link khusus siswa atau tampilkan QR Code di proyektor kelas.',
      details: [
        'Klik tombol **"Bagikan Aplikasi & QR Siswa"** di bagian atas layar.',
        'Tampilkan gambar **QR Code** di layar Infocus/Proyektor kelas agar siswa dapat langsung scan menggunakan HP mereka.',
        'Atau salin **Tautan Aplikasi Khusus Siswa** lalu kirimkan ke grup WhatsApp kelas.',
        'Siswa yang membuka link tersebut akan langsung diarahkan ke layar login tanpa bisa mengakses menu Admin guru.'
      ],
      proTip: 'Siswa dapat menekan tombol "Install di HP" di browser Chrome mereka untuk menjalankan ujian dalam mode layar penuh (PWA).'
    },
    {
      stepNumber: 5,
      title: 'Pantau Jalannya Ujian (Live Monitoring & Anti-Cheat)',
      icon: Activity,
      badge: 'Tahap 5: Pengawasan Real-Time',
      color: 'from-amber-600 to-emerald-600',
      actionTab: 'monitoring',
      actionLabel: 'Buka Live Monitoring',
      summary: 'Awasi status pengerjaan, peringatan tab beralih, dan snapshot kamera siswa.',
      details: [
        'Buka tab **Live Monitoring** di Dashboard Admin saat ujian berlangsung.',
        'Lihat status tiap siswa: **Belum Masuk**, **Sedang Mengerjakan (No. Soal X)**, atau **Selesai**.',
        'Sistem akan otomatis mendeteksi jika siswa mencoba membuka tab baru, keluar aplikasi, atau screenshot:',
        '  • Sistem mengeluarkan bunyi alarm peringatan di HP siswa.',
        '  • Jumlah pelanggaran tercatat dan muncul badge merah di layar pengawas.',
        '  • Jika melebihi batas, akun siswa akan terkunci (**BLOCKED**) dan membutuhkan reset dari Pengawas.'
      ],
      proTip: 'Anda dapat mengklik nama siswa di tabel monitoring untuk melihat foto snapshot kamera dan waktu tersisa siswa.'
    },
    {
      stepNumber: 6,
      title: 'Rekap Hasil Nilai & Sinkronisasi ke Spreadsheet',
      icon: FileSpreadsheet,
      badge: 'Tahap 6: Evaluasi & Laporan',
      color: 'from-emerald-600 to-teal-600',
      actionTab: 'results',
      actionLabel: 'Buka Rekap Nilai',
      summary: 'Unduh rekap nilai per kelas, analisis butir soal, dan kirim ke Google Sheets.',
      details: [
        'Setelah ujian berakhir, buka menu **Rekap Nilai & Analisis**.',
        'Lihat perolehan nilai, jumlah benar/salah, serta nilai rata-rata kelas.',
        'Untuk soal essay, lakukan penilaian manual melalui form koreksi essay yang tersedia.',
        'Klik **Export Excel / PDF** untuk mencetak daftar nilai resmi sekolah.',
        'Jika menghubungkan ke **Google Spreadsheet**, seluruh nilai siswa akan terkirim secara instan dan otomatis tanpa perlu entri ulang.'
      ],
      proTip: 'Nilai ujian tersimpan aman di server dan database lokal browser sehingga tidak akan hilang saat koneksi terputus.'
    }
  ];

  // STUDENT STEPS IN STRICT CHRONOLOGICAL ORDER
  const studentSteps = [
    {
      stepNumber: 1,
      title: 'Buka Aplikasi / Scan QR Code Ujian',
      icon: Smartphone,
      badge: 'Langkah 1',
      color: 'from-blue-600 to-indigo-600',
      summary: 'Buka tautan ujian yang diberikan guru di Google Chrome HP atau Laptop.',
      details: [
        'Buka browser **Google Chrome** di HP atau Laptop Anda.',
        'Arahkan kamera HP ke **QR Code Ujian** yang ditampilkan di layar proyektor kelas, atau klik tautan yang dibagikan guru.',
        'Pastikan HP Anda terhubung ke jaringan internet/WiFi sekolah yang stabil.',
        'Sangat disarankan menekan tombol **"Install di HP"** di bagian atas layar agar aplikasi berjalan dalam mode layar penuh tanpa gangguan notifikasi.'
      ],
      proTip: 'Pastikan baterai HP di atas 50% dan aktifkan mode Jangan Ganggu (Do Not Disturb) sebelum memulai.'
    },
    {
      stepNumber: 2,
      title: 'Login dengan NISN / Username & PIN',
      icon: LogIn,
      badge: 'Langkah 2',
      color: 'from-indigo-600 to-violet-600',
      summary: 'Masukkan kredensial akun peserta ujian yang tertera pada Kartu Ujian.',
      details: [
        'Pada halaman login, masukkan **Username atau Nomor NISN** Anda.',
        'Masukkan **PIN / Password** (Default: `123`, atau sesuai yang diberikan proktor).',
        'Atau klik tombol **"Scan QR Kartu Ujian"** jika kartu peserta Anda memiliki barcode login.',
        'Klik tombol **"Masuk ke Portal Ujian"**.'
      ],
      proTip: 'Jika lupa PIN atau akun bermasalah, segera hubungi Pengawas Ruang untuk direset.'
    },
    {
      stepNumber: 3,
      title: 'Pilih Jadwal Ujian & Masukkan Token',
      icon: KeyRound,
      badge: 'Langkah 3',
      color: 'from-violet-600 to-purple-600',
      summary: 'Pilih mata pelajaran yang sedang diujikan dan masukkan token aktivasi.',
      details: [
        'Di halaman beranda siswa, cari mata pelajaran yang dijadwalkan hari ini.',
        'Periksa informasi: **Nama Pelajaran**, **Jumlah Soal**, dan **Alokasi Waktu (Menit)**.',
        'Masukkan **Token Ujian** yang diumumkan oleh Pengawas Ruang di papan tulis.',
        'Izinkan akses **Kamera** jika ujian menerapkan pengawasan foto.',
        'Klik **"Mulai Ujian Sekarang"**.'
      ],
      proTip: 'Waktu ujian akan mulai berjalan mundur segera setelah Anda menekan tombol Mulai.'
    },
    {
      stepNumber: 4,
      title: 'Kerjakan Soal & Patuhi Aturan Anti-Nyontek',
      icon: Camera,
      badge: 'Langkah 4',
      color: 'from-amber-600 to-orange-600',
      summary: 'Jawab seluruh pertanyaan dengan teliti tanpa berpindah aplikasi.',
      details: [
        'Pilih opsi jawaban yang benar (A, B, C, D, atau E) untuk soal pilihan ganda.',
        'Gunakan tombol **Ragu-ragu (Kuning)** jika ingin meninjau kembali jawaban nanti.',
        'Navigasi nomor soal melalui panel kisi-kisi nomor di bagian atas/bawah.',
        '**DILARANG KERAS (SISTEM ANTI-CURANG KIOSK AKTIF):**',
        '  🚫 Membuka aplikasi kloning / ganda (Dual Apps / Parallel Space / Clone App).',
        '  🚫 Menggunakan fitur Split Screen (Layar Terbelah) atau Floating Window (Jendela Mengambang).',
        '  🚫 Membuka tab browser lain, Google, catatan PDF, AI, atau aplikasi chatting.',
        '  🚫 Melakukan Screenshot / Tangkapan Layar / Rekam Layar.',
        '  🚫 Menekan tombol Home / Keluar dari Mode Layar Penuh (Fullscreen).',
        'Setiap pelanggaran akan memicu SIRINE ALARM, mengambil foto pengawas, dan pelanggaran ke-2 akan otomatis MEMBLOKIR AKUN!'
      ],
      proTip: 'Semua jawaban otomatis tersimpan ke memori setiap detik, dan nama/NISN Anda tercetak sebagai watermark pengaman di seluruh layar.'
    },
    {
      stepNumber: 5,
      title: 'Periksa Ulang & Selesaikan Ujian',
      icon: CheckCircle2,
      badge: 'Langkah 5',
      color: 'from-emerald-600 to-teal-600',
      summary: 'Pastikan seluruh nomor telah terjawab lalu klik tombol Selesai Ujian.',
      details: [
        'Buka daftar nomor soal untuk memastikan tidak ada nomor yang masih berwarna abu-abu (belum dijawab).',
        'Pada nomor terakhir, klik tombol hijau **"Selesai & Kumpulkan Ujian"**.',
        'Konfirmasi pengumpulan naskah pada kotak dialog yang muncul.',
        'Hasil nilai akhir dan rincian evaluasi akan langsung tampil di layar (sesuai pengaturan guru).'
      ],
      proTip: 'Setelah selesai, letakkan HP Anda dengan tenang dan tunggu instruksi pengawas sebelum meninggalkan ruangan.'
    }
  ];

  const currentSteps = activeRole === 'admin' ? teacherSteps : studentSteps;
  const currentStep = currentSteps[currentStepIndex] || currentSteps[0];

  const handleCopyGuideText = () => {
    let text = `📖 PANDUAN LENGKAP PENGGUNAAN APLIKASI UJIAN (${activeRole === 'admin' ? 'GURU / ADMIN' : 'SISWA'})\n\n`;
    currentSteps.forEach((s) => {
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📌 ${s.stepNumber}. ${s.title}\n`;
      text += `Ringkasan: ${s.summary}\n`;
      text += `Langkah-langkah:\n`;
      s.details.forEach((d) => {
        text += ` • ${d.replace(/\*\*/g, '')}\n`;
      });
      text += `💡 Tips: ${s.proTip}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Panduan & Tata Cara Penggunaan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Urutan Lengkap
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Panduan praktis langkah demi langkah menyelenggarakan & mengikuti ujian CBT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher & View Mode Toolbar */}
        <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Role Tabs */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => {
                setActiveRole('admin');
                setCurrentStepIndex(0);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Panduan Guru / Proktor</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300">
                6 Tahap
              </span>
            </button>

            <button
              onClick={() => {
                setActiveRole('student');
                setCurrentStepIndex(0);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeRole === 'student'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Panduan Siswa</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300">
                5 Langkah
              </span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'stepper' ? 'all' : 'stepper')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {viewMode === 'stepper' ? 'Tampilkan Semua Langkah' : 'Mode Per Langkah'}
            </button>

            <button
              onClick={handleCopyGuideText}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Salin teks panduan untuk dibagikan ke WhatsApp"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Tersalin!' : 'Salin WA'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 items-center gap-1.5 transition-colors"
              title="Cetak Panduan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>

        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP PROGRESS BAR / CHIP NAVIGATION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>URUTAN LANGKAH:</span>
              <span className="text-indigo-400">
                Langkah {currentStepIndex + 1} dari {currentSteps.length}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {currentSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCurrent = idx === currentStepIndex;
                const isCompleted = completedSteps.includes(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      setViewMode('stepper');
                    }}
                    className={`p-2 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      isCurrent
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md scale-[1.02]'
                        : isCompleted
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-400'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{step.stepNumber}
                      </span>
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 line-clamp-1">
                      {step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW MODE 1: STEPPER (INTERACTIVE FOCUS VIEW) */}
          {viewMode === 'stepper' && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-6 animate-fadeIn">
              
              {/* Step Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center text-white shadow-xl shrink-0`}>
                    {React.createElement(currentStep.icon, { className: 'w-7 h-7' })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {currentStep.badge}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Langkah Ke-{currentStep.stepNumber}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      {currentStep.summary}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <button
                    onClick={() => toggleCompleteStep(currentStepIndex)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      completedSteps.includes(currentStepIndex)
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${completedSteps.includes(currentStepIndex) ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{completedSteps.includes(currentStepIndex) ? 'Selesai Dilakukan' : 'Tandai Selesai'}</span>
                  </button>

                  {/* Optional Quick Action Shortcut for Teachers */}
                  {activeRole === 'admin' && (currentStep as any).actionTab && onNavigateToTab && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTab((currentStep as any).actionTab);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <span>{(currentStep as any).actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step Detailed Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Petunjuk Rinci & Langkah Teknis:</span>
                </h4>
                
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm text-slate-200">
                  {currentStep.details.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 leading-relaxed">
                        {line.startsWith('  • ') || line.startsWith('  🚫 ') ? (
                          <div className="pl-2 font-mono text-xs text-indigo-200 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 my-1">
                            {line.trim()}
                          </div>
                        ) : (
                          <span dangerouslySetInnerHTML={{
                            __html: line
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                              .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-slate-800 rounded text-amber-300 font-mono text-xs">$1</code>')
                          }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip Box */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90">
                  <span className="font-bold text-amber-300">Tips Sukses: </span>
                  {currentStep.proTip}
                </div>
              </div>

              {/* Navigation Bottom Controls */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
                <button
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Langkah Sebelumnya</span>
                </button>

                <div className="text-xs text-slate-400 font-medium hidden sm:block">
                  Langkah {currentStepIndex + 1} dari {currentSteps.length}
                </div>

                {currentStepIndex < currentSteps.length - 1 ? (
                  <button
                    onClick={() => {
                      if (!completedSteps.includes(currentStepIndex)) {
                        setCompletedSteps([...completedSteps, currentStepIndex]);
                      }
                      setCurrentStepIndex((prev) => Math.min(currentSteps.length - 1, prev + 1));
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all"
                  >
                    <span>Lanjut Langkah Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesai Membaca Panduan</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* VIEW MODE 2: ALL STEPS (TIMELINE OVERVIEW) */}
          {viewMode === 'all' && (
            <div className="space-y-4 animate-fadeIn">
              {currentSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isDone = completedSteps.includes(idx);

                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-3xl border transition-all ${
                      isDone
                        ? 'bg-slate-950/80 border-emerald-800/60'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shrink-0`}>
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-indigo-400">
                              TAHAP #{step.stepNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">
                              {step.badge}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">
                            {step.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {step.summary}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleCompleteStep(idx)}
                        className={`p-2 rounded-xl transition-colors ${
                          isDone
                            ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/60'
                            : 'text-slate-500 hover:text-slate-300 bg-slate-900'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-3 pl-13 pt-3 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      {step.details.slice(0, 3).map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          <span className="truncate">{d.replace(/\*\*/g, '').replace(/`(.*?)`/g, '$1')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sistem Ujian Terintegrasi • CBT Anti-Nyontek</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyGuideText}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Salin Panduan</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
