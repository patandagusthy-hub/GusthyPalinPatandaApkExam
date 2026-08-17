import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Camera, CheckCircle2, AlertCircle, Upload, Search } from 'lucide-react';
import jsQR from 'jsqr';
import { Student } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onQrLogin: (student: Student) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  onQrLogin,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Helper to match student from scanned text (NISN, username, or JSON)
  const processQrRawText = (rawText: string) => {
    setErrorMessage('');
    const cleaned = rawText.trim();
    if (!cleaned) return;

    let targetQuery = cleaned.toLowerCase();

    // Parse JSON if e.g. {"nisn":"0051234567"}
    try {
      if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        const parsed = JSON.parse(cleaned);
        if (parsed.nisn) targetQuery = String(parsed.nisn).trim().toLowerCase();
        else if (parsed.username) targetQuery = String(parsed.username).trim().toLowerCase();
        else if (parsed.id) targetQuery = String(parsed.id).trim().toLowerCase();
      }
    } catch {
      // Ignore JSON parse error, treat as raw text
    }

    if (targetQuery.includes(':')) {
      targetQuery = targetQuery.split(':').pop()?.trim() || targetQuery;
    }

    const student = students.find((s) => {
      const u = (s.username || '').trim().toLowerCase();
      const n = (s.nisn || '').trim().toLowerCase();
      const id = (s.id || '').trim().toLowerCase();
      const name = (s.name || '').trim().toLowerCase();
      return u === targetQuery || n === targetQuery || id === targetQuery || name === targetQuery;
    });

    if (!student) {
      setErrorMessage(`QR Code ("${cleaned}") terdeteksi, tetapi tidak ada siswa yang cocok di database.`);
      return;
    }

    if (student.isBlocked) {
      setErrorMessage(`AKUN DIBLOKIR: Siswa ${student.name} tidak dapat login karena diblokir oleh pengawas.`);
      return;
    }

    stopCamera();
    setScanStatus(`✔ QR Code Valid! Login sebagai ${student.name} (${student.className})...`);
    
    setTimeout(() => {
      onQrLogin(student);
      onClose();
    }, 1000);
  };

  const startCamera = async () => {
    setCameraError('');
    setErrorMessage('');
    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err: any) {
        setCameraError('Gagal mengakses kamera HP/Laptop. Pastikan memberikan izin kamera (Permission) di browser Anda atau gunakan pilihan foto QR Gallery / pilih kartu siswa.');
        setIsCameraActive(false);
        return;
      }
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch {
        // play error ignore
      }
    }
    setIsCameraActive(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let lastScanTime = 0;

    const scanLoop = (time: number) => {
      if (videoRef.current && videoRef.current.readyState === 4 && ctx) {
        if (time - lastScanTime > 80) { // Scan every ~80ms
          lastScanTime = time;
          const video = videoRef.current;
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 480;

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);

          try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              processQrRawText(code.data);
              return;
            }
          } catch {
            // Frame scan error ignore
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(scanLoop);
    };

    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanStatus('');
      setErrorMessage('');
      setManualInput('');
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setScanStatus('Membaca QR Code dari foto...');

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            processQrRawText(code.data);
            return;
          }
        } catch {
          // fallback
        }
      }
      setScanStatus('');
      setErrorMessage('QR Code tidak terdeteksi pada foto ini. Pastikan foto jernih atau pilih kartu siswa secara manual.');
    };
    img.src = URL.createObjectURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processQrRawText(manualInput);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span className="text-sm">Pindai QR Code Kartu Ujian</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-center">
          
          {scanStatus && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{scanStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-medium flex items-start text-left gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs text-left leading-relaxed">
              {cameraError}
            </div>
          )}

          {/* Camera Box */}
          <div className="relative bg-slate-950 rounded-2xl border-2 border-dashed border-indigo-500/50 p-3 overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
            {isCameraActive ? (
              <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 border-2 border-amber-400 rounded-2xl relative animate-pulse shadow-2xl">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1"></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-2 right-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg shadow"
                >
                  Matikan Kamera
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <div className="text-xs font-bold text-white">Buka Kamera HP untuk Scan QR</div>
                  <p className="text-[11px] text-slate-400">
                    Arahkan kamera ke QR Code pada Kartu Ujian Siswa untuk login otomatis.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Nyalakan Kamera Scanner</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            <label className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-amber-300 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Scan Foto QR Gallery</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <form onSubmit={handleManualSubmit} className="flex gap-1">
              <input
                type="text"
                placeholder="Ketik NISN/QR..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Select Student */}
          <div className="text-left space-y-2 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Pilih Kartu Siswa (Login Instan 1-Klik):</label>
              <span className="text-[10px] text-slate-500 font-mono">{students.length} Siswa</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-800/60 rounded-2xl p-1 bg-slate-950/60">
              {students.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 italic">Belum ada data siswa terdaftar.</div>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => processQrRawText(s.username || s.nisn)}
                    className="w-full text-left p-2 rounded-xl bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <div className="font-bold text-white text-[11px] flex items-center gap-1">
                        <span>{s.name}</span>
                        {s.isBlocked && <span className="text-[9px] px-1 bg-rose-500/20 text-rose-400 rounded">Diblokir</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        NISN: {s.nisn} | User: {s.username} | Kelas: {s.className}
                      </div>
                    </div>
                    <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
