import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode as QrIcon,
  Copy,
  Check,
  ExternalLink,
  Download,
  Share2,
  X,
  Sparkles,
  ShieldCheck,
  Info,
  Layers,
  Users,
  Eye
} from 'lucide-react';
import { Student, AppSettings } from '../types';

interface StudentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  students: Student[];
  onOpenStudentPreview?: () => void;
}

export const StudentShareModal: React.FC<StudentShareModalProps> = ({
  isOpen,
  onClose,
  settings,
  students,
  onOpenStudentPreview,
}) => {
  const [studentUrl, setStudentUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'apk' | 'cards'>('link');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // Dedicated student URL with query parameter & clean path
      const url = `${origin}/?portal=student`;
      setStudentUrl(url);

      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('QR code generation error:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard && studentUrl) {
      navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_Aplikasi_Siswa_${settings.appName || 'GiannaExam'}.png`;
    a.click();
  };

  // Filter students for student cards
  const uniqueClasses = Array.from(new Set(students.map((s) => s.className || 'Tanpa Kelas'))).filter(Boolean);
  const filteredStudents = selectedClassFilter === 'all'
    ? students
    : students.filter((s) => s.className === selectedClassFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Aplikasi & Portal Khusus Siswa
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Terintegrasi
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Siswa langsung masuk ke portal ujian tanpa opsi Admin & terhubung otomatis dengan sistem Anda
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'link'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Tautan / Link Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'qr'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrIcon className="w-4 h-4" />
            <span>QR Code Proyektor</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'apk'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Panduan APK & PWA</span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cards'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kartu Peserta ({filteredStudents.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: Tautan Link Khusus Siswa */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300">
                  <p className="font-semibold text-white mb-1">
                    Fitur Khusus Aplikasi Siswa:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>Siswa <strong>tidak akan melihat tombol Admin</strong> atau form login Guru.</li>
                    <li>Siswa langsung diminta memasukkan <strong>NISN / Username</strong> & <strong>PIN Ujian</strong>.</li>
                    <li>Otomatis terhubung dengan Bank Soal, Jadwal Ujian, dan Kamera Pengawas Anti-Nyontek Anda.</li>
                    <li>Nilai ujian langsung masuk ke <strong>Dashboard Guru</strong> & <strong>Google Spreadsheet</strong> secara real-time!</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Link Aplikasi Khusus Siswa:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={studentUrl}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-indigo-300 font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`shrink-0 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                      copied
                        ? 'bg-emerald-600 text-white shadow-emerald-900/50 shadow-lg'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={studentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px] py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-sky-400" />
                  <span>Buka di Tab Baru (Test Siswa)</span>
                </a>

                {onOpenStudentPreview && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenStudentPreview();
                    }}
                    className="flex-1 min-w-[200px] py-3 px-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Preview Tampilan Siswa</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QR Code Proyektor */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                Tampilkan QR Code ini di <strong>Layar Infocus / Proyektor Kelas</strong> agar siswa dapat langsung memindai dengan kamera HP dan membuka aplikasi ujian tanpa mengetik link:
              </p>

              {qrDataUrl && (
                <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-indigo-600/50 flex flex-col items-center">
                  <img
                    src={qrDataUrl}
                    alt="QR Code Aplikasi Siswa"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                  />
                  <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase mt-2">
                    {settings.appName || 'GiannaExam'} • Portal Siswa
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadQr}
                  className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Gambar QR Code (.PNG)</span>
                </button>
                
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 flex items-center gap-2 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Panduan APK & PWA */}
          {activeTab === 'apk' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Cara 1: Jadikan APK Khusus Siswa via AppsGeyser / WebIntoApp</span>
                </div>
                <p className="text-slate-400 text-xs">
                  Gunakan link khusus siswa ini saat membuat file APK di <strong>AppsGeyser.com</strong> atau <strong>WebIntoApp.com</strong>:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-indigo-300 select-all text-xs break-all">
                  {studentUrl}
                </div>
                <p className="text-slate-400 text-[11px]">
                  💡 <em>Keuntungan: Siswa yang menginstal APK tersebut akan otomatis 100% terkunci di portal siswa tanpa akses ke menu guru.</em>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Download className="w-4 h-4" />
                  <span>Cara 2: Install Langsung dari Google Chrome HP (PWA Tanpa Download APK)</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-400">
                  <li>Siswa membuka link siswa di <strong>Google Chrome HP</strong>.</li>
                  <li>Siswa menekan tombol <strong>"Install di HP"</strong> di bagian atas atau menu Titik Tiga Chrome ➔ <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li>Ikon aplikasi <strong>GiannaExam Siswa</strong> akan langsung terpasang di HP siswa dan berjalan dalam mode layar penuh (Full Screen).</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: Kartu Peserta Ujian Siswa */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400">
                  Cetak atau bagikan kredensial Login Siswa (Username, NISN, PIN Default: <code className="text-amber-300 font-mono">123</code>)
                </div>

                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="all">Semua Kelas ({students.length})</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Kelas {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                {filteredStudents.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[160px]">{s.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                          {s.className || 'Kelas'}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-1 font-mono text-[11px]">
                        NISN: <span className="text-sky-300 font-semibold">{s.nisn || '-'}</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        Username: <span className="text-indigo-300 font-semibold">{s.username || s.nisn}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        PIN: <strong className="text-amber-400 font-mono">{s.password || '123'}</strong>
                      </span>
                      <button
                        onClick={() => {
                          const text = `Halo ${s.name},\nBerikut Kartu Login Ujian GiannaExam:\nLink: ${studentUrl}\nUsername: ${s.username || s.nisn}\nPIN: ${s.password || '123'}\nKelas: ${s.className}`;
                          navigator.clipboard.writeText(text);
                          alert(`Kredensial login untuk ${s.name} telah disalin! Siap dikirim ke WhatsApp.`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium transition-colors"
                      >
                        Salin Info WA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anti-Nyontek & Real-Time Sync Aktif</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
