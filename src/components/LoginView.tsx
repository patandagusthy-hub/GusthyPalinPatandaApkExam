import React, { useState } from 'react';
import { Shield, User, Lock, LogIn, AlertCircle, Eye, EyeOff, QrCode, HelpCircle, KeyRound, Key, Check, X, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { Student, AppSettings, OneTimeAdminLogin } from '../types';
import { PhoneModelBadge } from './PhoneModelBadge';
import { markOneTimeAdminLoginUsed, saveStudent } from '../lib/storage';

interface LoginViewProps {
  students: Student[];
  settings: AppSettings;
  onStudentLogin: (student: Student) => void;
  onAdminLogin: (adminName: string) => void;
  onOpenQrScanner: () => void;
  onResetStudentPassword?: (identifier: string, newPass: string) => Student | undefined;
  isStudentOnlyMode?: boolean;
  onSwitchToAdmin?: () => void;
  onOpenGuideModal?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  students,
  settings,
  onStudentLogin,
  onAdminLogin,
  onOpenQrScanner,
  onResetStudentPassword,
  isStudentOnlyMode = false,
  onSwitchToAdmin,
  onOpenGuideModal,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');

  // Student Login State
  const [studentInput, setStudentInput] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');
  const [showStudentPassword, setShowStudentPassword] = useState<boolean>(false);
  const [studentError, setStudentError] = useState<string>('');
  const [showAccountHelper, setShowAccountHelper] = useState<boolean>(false);

  // Student Reset Password State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');

  // Admin Login State
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');
  const [expiredOtlAccount, setExpiredOtlAccount] = useState<OneTimeAdminLogin | null>(null);

  // Handle Student Login
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const query = studentInput.trim().toLowerCase();
    const pass = studentPassword.trim();

    if (!query) {
      setStudentError('Harap isi Username atau NISN terlebih dahulu.');
      return;
    }

    if (!pass) {
      setStudentError('Harap isi Password PIN.');
      return;
    }

    // Find student matching Username OR NISN OR ID OR Name
    const student = students.find((s) => {
      const u = (s.username || '').trim().toLowerCase();
      const n = (s.nisn || '').trim().toLowerCase();
      const id = (s.id || '').trim().toLowerCase();
      const name = (s.name || '').trim().toLowerCase();
      return u === query || n === query || id === query || name === query;
    });

    if (!student) {
      setStudentError(`Siswa dengan Username/NISN "${studentInput}" tidak ditemukan dalam database. Pastikan data siswa sudah didaftarkan oleh Admin.`);
      return;
    }

    // Check Password matching (default PIN is '123' if blank in record)
    const expectedPass = (student.password || '123').toString().trim();
    const isPasswordValid =
      expectedPass === pass ||
      expectedPass.toLowerCase() === pass.toLowerCase();

    if (!isPasswordValid) {
      setStudentError(`Password PIN untuk ${student.name} (${student.nisn}) salah. Silakan klik "Reset Password PIN" jika Anda telah mengubah atau lupa PIN Anda.`);
      return;
    }

    if (student.isBlocked) {
      setStudentError('AKUN DIBLOKIR: Anda tidak dapat login karena terdeteksi melakukan pelanggaran ujian (membuka tab/multitasking). Harap hubungi Pengawas / Admin.');
      return;
    }

    onStudentLogin(student);
  };

  // Handle Student Reset Password Submit
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccessMsg('');

    const query = resetIdentifier.trim().toLowerCase();
    const newPin = newPinInput.trim();
    const confirmPin = confirmPinInput.trim();

    if (!query) {
      setResetError('Harap masukkan Username atau NISN Siswa.');
      return;
    }

    if (!newPin) {
      setResetError('Harap masukkan Password PIN Baru.');
      return;
    }

    if (newPin.length < 3) {
      setResetError('Password PIN Baru minimal 3 karakter.');
      return;
    }

    if (newPin !== confirmPin) {
      setResetError('Konfirmasi Password PIN Baru tidak cocok dengan PIN Baru.');
      return;
    }

    const matchedStudent = students.find((s) => {
      const u = (s.username || '').trim().toLowerCase();
      const n = (s.nisn || '').trim().toLowerCase();
      const id = (s.id || '').trim().toLowerCase();
      return u === query || n === query || id === query;
    });

    if (!matchedStudent) {
      setResetError(`Siswa dengan Username / NISN "${resetIdentifier}" tidak ditemukan.`);
      return;
    }

    // Call reset handler or save directly
    let updatedStudent = onResetStudentPassword
      ? onResetStudentPassword(matchedStudent.id, newPin)
      : undefined;

    if (!updatedStudent) {
      matchedStudent.password = newPin;
      saveStudent(matchedStudent);
      updatedStudent = matchedStudent;
    }

    setResetSuccessMsg(`🔑 PASWORD BERHASIL DI-RESET! Password PIN baru untuk ${matchedStudent.name} (${matchedStudent.nisn}) telah diperbarui menjadi "${newPin}". Silakan masuk sekarang dengan password baru ini.`);

    // Auto-fill student login form
    setStudentInput(matchedStudent.username || matchedStudent.nisn);
    setStudentPassword(newPin);
    setStudentError('');

    // Clear reset modal form
    setResetIdentifier('');
    setNewPinInput('');
    setConfirmPinInput('');
    setShowResetModal(false);
  };

  // Handle Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setExpiredOtlAccount(null);

    const user = adminUsername.trim();
    const pass = adminPassword.trim();

    if (!user || !pass) {
      setAdminError('Harap isi Username Admin dan Password.');
      return;
    }

    // 1. Check Primary Super Admin Credential
    if (user === settings.adminUsername && pass === settings.adminPassword) {
      onAdminLogin('Super Administrator');
      return;
    }

    // 2. Check One-Time Admin Logins (OTL)
    const otlList = settings.oneTimeAdminLogins || [];
    const otlMatch = otlList.find(
      (o) => o.username.toLowerCase() === user.toLowerCase() && o.password === pass
    );

    if (otlMatch) {
      if (otlMatch.status === 'EXPIRED') {
        setExpiredOtlAccount(otlMatch);
        setAdminError(
          `🚫 AKUN / PASSWORD 1X PAKAI EXPIRED: Password ini telah digunakan pada ${
            otlMatch.usedAt ? new Date(otlMatch.usedAt).toLocaleString('id-ID') : 'Sesi Sebelumnya'
          }. Akun ini hanya bisa login 1 kali.`
        );
        return;
      }

      // First time use -> Mark Expired & Log in
      markOneTimeAdminLoginUsed(otlMatch.username);
      onAdminLogin(otlMatch.name || 'Pengawas Ruang');
      return;
    }

    setAdminError('Username Admin atau Password salah. Pastikan kredensial yang Anda masukkan sesuai.');
  };

  const formattedWa = (settings.waHelpNumber || '085240195357')
    .replace(/^0/, '62')
    .replace(/[^0-9]/g, '');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 my-4">
      
      {/* 3D Phone Model Visual Banner Component */}
      <div className="w-full max-w-md mb-4">
        <PhoneModelBadge />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Navigation Tabs or Dedicated Student Banner */}
        {isStudentOnlyMode ? (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-950 to-indigo-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-white">Portal Ujian Khusus Siswa</h2>
                <p className="text-[10px] text-indigo-300 font-medium">{settings.appName || 'GiannaExamApk'} • Anti-Nyontek</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Aplikasi Siswa</span>
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 bg-slate-950 p-1.5 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Login Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Login Admin / Guru</span>
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          
          {/* TAB 1: STUDENT LOGIN */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-5">
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-xl font-black text-white tracking-tight">Masuk Portal Ujian</h2>
                <p className="text-xs text-slate-400">
                  Scan QR Code Kartu Ujian atau masukkan NISN/Username & Password PIN.
                </p>
              </div>

              {/* Prominent QR Code Scan Banner */}
              <button
                type="button"
                onClick={onOpenQrScanner}
                className="w-full p-3.5 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-black shadow group-hover:scale-105 transition-transform shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span>Pindai QR Code Kartu Ujian</span>
                      <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full uppercase tracking-wider">
                        Instan
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Scan QR Code dengan kamera HP / foto gallery untuk login otomatis
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Atau Login Manual</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              {resetSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-start gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              {studentError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              {/* Input Username / NISN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Username atau NISN Siswa</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="Contoh: ahmad005 atau 0051234567"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Password Field with Eye Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Password PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Masukkan Password PIN..."
                    className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-950/50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Portal Ujian Siswa</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenQrScanner}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pindai QR Code Ujian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(true);
                      setResetError('');
                      setResetSuccessMsg('');
                      setResetIdentifier(studentInput);
                    }}
                    className="w-full py-2.5 px-3 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 hover:text-indigo-200 text-[11px] font-bold rounded-xl border border-indigo-500/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Reset Password PIN Siswa</span>
                  </button>
                </div>

                {/* Account Helper Accordion */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAccountHelper(!showAccountHelper)}
                    className="w-full text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showAccountHelper ? 'Sembunyikan Bantuan Akun' : 'Lupa NISN / Username Siswa? (Klik Bantuan Login)'}</span>
                  </button>

                  {showAccountHelper && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 animate-fade-in">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span>Daftar Akun Siswa ({students.length}):</span>
                        <span className="text-[10px] text-amber-400 font-mono">PIN Default: 123</span>
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {students.length === 0 ? (
                          <div className="text-[11px] text-slate-500 italic p-2">Belum ada data siswa. Minta Admin/Guru menambahkan akun.</div>
                        ) : (
                          students.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setStudentInput(s.username || s.nisn);
                                setStudentPassword(s.password || '123');
                                setStudentError('');
                              }}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <div className="font-bold text-white text-[11px]">{s.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  User: <span className="text-emerald-400 font-bold">{s.username}</span> | NISN: {s.nisn}
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded font-bold border border-indigo-500/30 shrink-0">
                                Isi Login
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subtle Switch to Admin for Teachers */}
              {isStudentOnlyMode && onSwitchToAdmin && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onSwitchToAdmin}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline decoration-dotted"
                  >
                    Bukan siswa? Masuk sebagai Guru / Administrator
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: ADMIN / TEACHER LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div className="text-center space-y-1 mb-6">
                <h2 className="text-xl font-black text-white tracking-tight">Control Panel Admin</h2>
                <p className="text-xs text-slate-400">
                  Akses Pengelolaan Kelas, Siswa Massal, Bank Soal & Hasil Nilai.
                </p>
              </div>

              {adminError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{adminError}</span>
                  </div>

                  {/* If expired One-Time Admin Login -> Provide WA Request Button */}
                  {expiredOtlAccount && (
                    <a
                      href={`https://wa.me/${formattedWa}?text=Halo%20Super%20Admin,%20akun%201x%20pakai%20${expiredOtlAccount.username}%20telah%20EXPIRED.%20Mohon%20reset/berikan%20password%20baru.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Hubungi Super Admin via WhatsApp (Minta Password Baru)</span>
                    </a>
                  )}
                </div>
              )}

              {/* Admin Username Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Username Admin / Pengawas</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Masukkan Username Admin..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Admin Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Password Admin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan Password Admin..."
                    className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Control Panel Admin</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info & Quick Guide Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
          <span>Aplikasi GiannaExamApk • Proctored Anti-Cheat</span>
          {onOpenGuideModal && (
            <button
              type="button"
              onClick={onOpenGuideModal}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors underline decoration-dotted"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Petunjuk Cara Menggunakan</span>
            </button>
          )}
        </div>

      </div>

      {/* External Guide Banner Helper */}
      {onOpenGuideModal && (
        <button
          type="button"
          onClick={onOpenGuideModal}
          className="w-full max-w-md p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/30 hover:border-indigo-400/50 flex items-center justify-between gap-3 text-left transition-all hover:scale-[1.01] shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                <span>Panduan Urutan Menggunakan Aplikasi</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400/20 text-amber-300">
                  LENGKAP
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Klik untuk melihat panduan langkah demi langkah guru & siswa
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      )}

      {/* MODAL RESET PASSWORD SISWA */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setShowResetModal(false);
                setResetError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-1">
                <Key className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-white">Reset Password PIN Siswa</h3>
              <p className="text-xs text-slate-400">
                Masukkan Username/NISN akun Anda untuk membuat Password PIN login baru.
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Username atau NISN Siswa</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="Contoh: ahmad005 atau 0051234567"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Password PIN Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Masukkan Password PIN Baru..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Konfirmasi Password PIN Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    required
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Ketik Ulang Password PIN Baru..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  <span>Simpan PIN Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
