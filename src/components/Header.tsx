import React from 'react';
import {
  Smartphone,
  Sun,
  Moon,
  MessageCircle,
  Download,
  Wifi,
  WifiOff,
  LogOut,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  X
} from 'lucide-react';
import { getSavedTheme, saveTheme, getSyncQueue, getAppSettings, processSyncQueue } from '../lib/storage';

interface HeaderProps {
  currentTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onOpenPwaModal: () => void;
  currentUser?: { role: 'admin' | 'student'; name: string } | null;
  onLogout?: () => void;
  waNumber?: string;
  logoUrl?: string;
  isStudentOnlyMode?: boolean;
  onOpenShareStudent?: () => void;
  onOpenGuideModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  setTheme,
  onOpenPwaModal,
  currentUser,
  onLogout,
  waNumber = '085240195357',
  logoUrl,
  isStudentOnlyMode = false,
  onOpenShareStudent,
  onOpenGuideModal,
}) => {
  const [isOnline, setIsOnline] = React.useState<boolean>(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = React.useState<number>(0);
  const [showStatusModal, setShowStatusModal] = React.useState<boolean>(false);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = React.useState<string | null>(null);

  const settings = getAppSettings();
  const hasSpreadsheetWebhook = Boolean(settings.googleSheetWebhookUrl && settings.googleSheetWebhookUrl.trim() !== '');

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkQueue = () => {
      const q = getSyncQueue().filter((i) => i.status === 'PENDING');
      setPendingQueueCount(q.length);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await processSyncQueue();
      const remaining = getSyncQueue().filter((i) => i.status === 'PENDING').length;
      setPendingQueueCount(remaining);
      setSyncFeedback(`Sinkronisasi selesai! ${res.processedCount} data berhasil terkirim ke Spreadsheet.`);
    } catch (err) {
      setSyncFeedback('Gagal menyinkronkan data. Pastikan koneksi internet stabil.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTheme = () => {
    const next = currentTheme === 'light' ? 'dark' : 'light';
    saveTheme(next);
    setTheme(next);
  };

  const formattedWa = waNumber.replace(/^0/, '62').replace(/[^0-9]/g, '');

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/90 text-white border-b border-slate-800 shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-amber-400 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo App" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-amber-400" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                {isStudentOnlyMode ? 'GiannaExam Siswa' : 'GiannaExamApk'}
              </h1>
              <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isStudentOnlyMode
                  ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
              }`}>
                {isStudentOnlyMode ? 'PORTAL SISWA' : 'PRO 3D'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden md:block">
              {isStudentOnlyMode
                ? 'Aplikasi Ujian Khusus Siswa • Anti Nyontek Real-Time'
                : 'Portal Ujian SMA Anti Nyontek • GusthyPalinPatandaApkExam'}
            </p>
          </div>
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* User Guide / Cara Pakai Button */}
          {onOpenGuideModal && (
            <button
              type="button"
              onClick={onOpenGuideModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
              title="Lihat Urutan & Cara Menggunakan Aplikasi Lengkap"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Cara Pakai</span>
            </button>
          )}

          {/* Quick Share Student Link (Visible in Teacher / Admin mode) */}
          {!isStudentOnlyMode && onOpenShareStudent && (
            <button
              type="button"
              onClick={onOpenShareStudent}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow-indigo-900/40"
              title="Bagikan Tautan & QR Code Khusus Siswa"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Link Siswa</span>
            </button>
          )}
          
          {/* Online/Offline & Spreadsheet Connection Status Button */}
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            title="Klik untuk melihat detail koneksi & status sinkronisasi spreadsheet"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm hover:scale-[1.02] ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-emerald-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}></span>
            </span>

            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
            )}

            {/* Desktop / Tablet Label */}
            <span className="hidden sm:inline">
              {isOnline ? (hasSpreadsheetWebhook ? 'Online • Sheet Sync' : 'Online') : 'Offline • Lokal'}
            </span>

            {/* Mobile Label */}
            <span className="sm:hidden text-[11px]">
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {pendingQueueCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full animate-pulse">
                {pendingQueueCount}
              </span>
            )}
          </button>

          {/* WA Help Button */}
          <a
            href={`https://wa.me/${formattedWa}?text=Halo%20Admin%20GiannaExamApk,%20saya%20butuh%20bantuan%20mengenai%20portal%20ujian.`}
            target="_blank"
            rel="noopener noreferrer"
            title="Hubungi Admin WhatsApp jika ada kendala"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow-emerald-900/40"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Bantuan WA</span>
          </a>

          {/* PWA Install Button */}
          <button
            type="button"
            onClick={onOpenPwaModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow-indigo-900/40"
            title="Install aplikasi di HP (Android / iOS PWA)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Install di HP</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors border border-slate-700"
            title={`Ganti ke mode ${currentTheme === 'light' ? 'Gelap' : 'Terang'}`}
          >
            {currentTheme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* User Logged In Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
                <span className="text-[10px] text-amber-400 font-semibold uppercase">{currentUser.role}</span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                  title="Keluar / Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Connection & Spreadsheet Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Status Koneksi & Sinkronisasi</h3>
                <p className="text-xs text-slate-400 font-medium">Informasi Ketersambungan Google Spreadsheet</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
              {/* Internet Status Item */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Status Internet</span>
                <span className={`font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  {isOnline ? 'Terhubung (Online)' : 'Terputus (Offline)'}
                </span>
              </div>

              {/* Spreadsheet Integration Status */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Google Spreadsheet</span>
                </span>
                <span className={`font-bold flex items-center gap-1.5 ${
                  hasSpreadsheetWebhook ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {hasSpreadsheetWebhook ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Webhook Terkonfigurasi</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Belum Diatur Webhook</span>
                    </>
                  )}
                </span>
              </div>

              {/* Pending Sync Queue */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Data Menunggu Sinkron (Queue)</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                  pendingQueueCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {pendingQueueCount} Data Pending
                </span>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-3 bg-slate-800/60 rounded-2xl text-[11px] text-slate-300 leading-relaxed border border-slate-700/60 space-y-1">
              <p className="font-semibold text-slate-200">ℹ️ Bagaimana Cara Kerjanya?</p>
              <p>
                Aplikasi menyimpan seluruh data nilai & hasil ujian secara lokal di HP/perangkat. Saat online, data otomatis dikirim ke Google Spreadsheet.
              </p>
            </div>

            {syncFeedback && (
              <div className="p-3 bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs rounded-xl font-medium">
                {syncFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              {isOnline && pendingQueueCount > 0 && (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};

