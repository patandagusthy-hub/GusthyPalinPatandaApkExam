import React from 'react';
import { X, Smartphone, Apple, Download, ExternalLink, ShieldCheck } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Panduan Install Aplikasi di HP</h2>
              <p className="text-xs text-slate-400">PWA (Progressive Web App) & Modul APK Android / iOS</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          
          {/* Method 1: Android Chrome */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <span>📲 Untuk HP Android (Google Chrome / Brave / Edge)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
              <li>Buka link web aplikasi ini di browser <strong>Google Chrome</strong> pada HP Anda.</li>
              <li>Klik tombol <strong>"Install di HP"</strong> yang ada di pojok kanan atas aplikasi.</li>
              <li>Atau klik ikon 3 titik vertikal (<strong>⋮</strong>) di sudut kanan atas browser Chrome.</li>
              <li>Pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).</li>
              <li>Konfirmasi pemasangan. Aplikasi akan langsung terpasang di Homescreen HP Anda dengan ikon sendiri.</li>
            </ol>
          </div>

          {/* Method 2: iOS Safari */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Apple className="w-5 h-5 text-amber-400" />
              <span>🍏 Untuk iPhone / iPad (Safari Browser)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
              <li>Buka link web aplikasi ini menggunakan browser <strong>Safari</strong> di iPhone/iPad.</li>
              <li>Klik tombol <strong>Share (Bagikan)</strong> di bagian bawah layar (ikon kotak dengan panah ke atas ⎋).</li>
              <li>Gulir ke bawah lalu pilih menu <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).</li>
              <li>Klik <strong>"Tambah"</strong> di sudut kanan atas.</li>
              <li>Ikon aplikasi akan muncul di layar utama iPhone Anda dan dapat dibuka secara fullscreen.</li>
            </ol>
          </div>

          {/* Method 3: PWABuilder for standalone APK */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
              <Download className="w-5 h-5 text-sky-400" />
              <span>🤖 Cara 2: Membuat File Instalan .APK Murni (Android)</span>
            </div>
            <p className="text-xs leading-relaxed">
              Jika Anda memerlukan file .APK murni untuk dibagikan secara offline ke HP siswa:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 pl-1">
              <li>Buka <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-semibold">pwabuilder.com <ExternalLink className="w-3 h-3 inline" /></a> di laptop/PC.</li>
              <li>Masukkan link URL aplikasi ini di kolom URL lalu klik <strong>Start</strong>.</li>
              <li>Klik <strong>Package for Store / Download APK</strong> untuk mendownload file .apk.</li>
              <li>Bagikan file .apk tersebut ke siswa untuk diinstall secara langsung.</li>
            </ol>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
};
