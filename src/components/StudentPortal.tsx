import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Student,
  ExamSchedule,
  Question,
  ExamResult,
  AppSettings,
  StudentViolation
} from '../types';
import {
  saveExamDraft,
  getExamDraft,
  clearExamDraft,
  saveExamResult,
  saveStudent,
  getAppSettings,
  sendStudentHeartbeat
} from '../lib/storage';
import { syncStudentExamResultToGoogleSpreadsheet } from '../lib/googleSheets';
import { playAntiCheatAlertSound } from '../lib/audioAlert';
import { downloadExamResultPDF } from '../lib/pdfGenerator';
import { CountdownTimer } from './CountdownTimer';
import {
  Clock,
  ShieldAlert,
  Camera,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  FileText,
  Download,
  LogOut,
  HelpCircle,
  Eye,
  Check,
  Lock,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { UserGuideModal } from './UserGuideModal';

interface StudentPortalProps {
  student: Student;
  exams: ExamSchedule[];
  settings: AppSettings;
  onLogout: () => void;
}

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  exams,
  settings,
  onLogout,
}) => {
  const [activeExam, setActiveExam] = useState<ExamSchedule | null>(null);
  const [examStartedAt, setExamStartedAt] = useState<string>('');
  
  // Exam State
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, { key: string; text: string }[]>>({});
  const [mcAnswers, setMcAnswers] = useState<Record<string, string>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Auto-Save Status
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Tersimpan');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Anti-Cheat & Camera State
  const [violations, setViolations] = useState<StudentViolation[]>([]);
  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [violationMessage, setViolationMessage] = useState<string>('');
  const [cameraSnapshots, setCameraSnapshots] = useState<string[]>([]);
  
  // Submit Confirmation, Final Result & Time Expired Lock
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [isTimeExpiredModalOpen, setIsTimeExpiredModalOpen] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  // Student Guide Modal State
  const [showStudentGuide, setShowStudentGuide] = useState<boolean>(false);

  // Camera Video Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize Camera
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Webcam permission not granted or missing camera:', err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const captureSnapshot = useCallback((): string => {
    if (!videoRef.current || !canvasRef.current) return '';
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add watermark
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${student.name} • ${new Date().toLocaleTimeString('id-ID')}`, 5, canvas.height - 6);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        return dataUrl;
      }
    } catch (err) {
      console.warn('Failed to capture snapshot:', err);
    }
    return '';
  }, [student.name]);

  // Start Exam Session
  const handleStartExam = (exam: ExamSchedule) => {
    setActiveExam(exam);
    const nowIso = new Date().toISOString();
    setExamStartedAt(nowIso);

    // Check existing draft
    const draft = getExamDraft(student.id, exam.id);

    let questionsToUse = exam.questions;
    let optMap: Record<string, { key: string; text: string }[]> = {};

    if (draft && draft.questionOrderIds.length > 0) {
      // Restore draft question order
      const qMap = new Map(exam.questions.map((q) => [q.id, q]));
      questionsToUse = draft.questionOrderIds
        .map((id) => qMap.get(id))
        .filter((q): q is Question => Boolean(q));
      optMap = draft.optionsOrderMap || {};
      setMcAnswers(draft.multipleChoiceAnswers || {});
      setEssayAnswers(draft.essayAnswers || {});
      setFlaggedIds(draft.flaggedQuestionIds || []);
      setCurrentIndex(draft.currentQuestionIndex || 0);
    } else {
      // Fresh session with Shuffling if enabled
      if (exam.isRandomizeQuestions) {
        questionsToUse = shuffleArray(exam.questions);
      }

      exam.questions.forEach((q) => {
        if (q.type === 'multiple_choice' && q.options) {
          optMap[q.id] = exam.isRandomizeOptions ? shuffleArray(q.options) : q.options;
        }
      });
    }

    setOrderedQuestions(questionsToUse);
    setOptionsMap(optMap);

    // Start camera if proctoring enabled
    if (exam.cameraProctoring) {
      startCamera();
    }
  };

  // Periodic Auto-Save Engine (Every 30 seconds)
  useEffect(() => {
    if (!activeExam || examResult) return;

    const performSave = () => {
      setAutoSaveStatus('Menyimpan...');
      saveExamDraft({
        examId: activeExam.id,
        studentId: student.id,
        multipleChoiceAnswers: mcAnswers,
        essayAnswers: essayAnswers,
        flaggedQuestionIds: flaggedIds,
        questionOrderIds: orderedQuestions.map((q) => q.id),
        optionsOrderMap: optionsMap,
        currentQuestionIndex: currentIndex,
        updatedAt: new Date().toISOString(),
      });

      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      setAutoSaveStatus('Tersimpan');
    };

    performSave();
    const interval = setInterval(performSave, 30000);

    return () => clearInterval(interval);
  }, [activeExam, mcAnswers, essayAnswers, flaggedIds, currentIndex, orderedQuestions, optionsMap, student.id, examResult]);

  // Real-Time Server Heartbeat for Live Teacher Monitoring
  useEffect(() => {
    const sendPulse = () => {
      sendStudentHeartbeat({
        studentId: student.id,
        status: activeExam ? (student.isBlocked ? 'BLOCKED' : 'EXAM') : 'ONLINE',
        activeExamId: activeExam?.id,
        currentQuestionIndex: activeExam ? currentIndex + 1 : undefined,
        totalQuestionsCount: activeExam ? orderedQuestions.length : undefined,
        violationsCount: violations.length,
      });
    };

    sendPulse();
    const timer = setInterval(sendPulse, 8000);
    return () => clearInterval(timer);
  }, [student.id, student.isBlocked, activeExam, currentIndex, orderedQuestions.length, violations.length]);

  // Periodic Camera Proctoring Snapshots
  useEffect(() => {
    if (!activeExam || !activeExam.cameraProctoring || examResult) return;

    const intervalMs = (activeExam.cameraIntervalMinutes || 2) * 60 * 1000;

    const takePeriodicSnapshot = () => {
      const snap = captureSnapshot();
      if (snap) {
        setCameraSnapshots((prev) => [...prev, snap].slice(-10)); // Keep last 10
      }
    };

    const timer = setInterval(takePeriodicSnapshot, intervalMs);
    return () => clearInterval(timer);
  }, [activeExam, captureSnapshot, examResult]);

  // Anti-Cheat Window Blur & Tab Switching Listener
  useEffect(() => {
    if (!activeExam || examResult) return;

    const handleViolation = (reason: string) => {
      playAntiCheatAlertSound();

      const snap = captureSnapshot();
      if (snap) {
        setCameraSnapshots((prev) => [...prev, snap].slice(-10));
      }

      const newViolation: StudentViolation = {
        timestamp: new Date().toISOString(),
        reason,
        snapshotUrl: snap,
      };

      const updatedViolations = [...violations, newViolation];
      setViolations(updatedViolations);

      // Update student record
      const updatedStudent: Student = {
        ...student,
        violationsCount: updatedViolations.length,
        violationLogs: updatedViolations,
      };

      // VIOLATION 2: LOG OUT & BLOCK ACCOUNT!
      if (updatedViolations.length >= 2) {
        updatedStudent.isBlocked = true;
        updatedStudent.status = 'BLOCKED';
        saveStudent(updatedStudent);

        stopCamera();
        alert('PERINGATAN DIBLOKIR: Anda telah melakukan 2x pelanggaran (pindah tab/layar). Akun Anda otomatis DIBLOKIR oleh sistem anti-nyontek.');
        onLogout();
        return;
      }

      // VIOLATION 1: WARN STUDENT
      saveStudent(updatedStudent);
      setViolationMessage(`PERINGATAN ANTI-NYONTEK (#${updatedViolations.length}): Terdeteksi ${reason}. Jangan meninggalkan atau membagi layar ujian! Pelanggaran kedua akan menyebabkan akun DIBLOKIR.`);
      setShowViolationModal(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Membuka Tab Lain / Browser Di-minimize');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Membagi Layar / Pindah Fokus Aplikasi (Multitasking)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeExam, violations, student, captureSnapshot, onLogout, examResult]);

  // Keyboard Shortcuts (Arrow keys, 1-5, R/F)
  useEffect(() => {
    if (!activeExam || examResult || showSubmitConfirmModal || showViolationModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if student is typing inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const currentQ = orderedQuestions[currentIndex];

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        if (currentIndex < orderedQuestions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      } else if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'f') {
        if (currentQ) {
          toggleFlag(currentQ.id);
        }
      } else if (currentQ && currentQ.type === 'multiple_choice' && ['1', '2', '3', '4', '5', 'a', 'b', 'c', 'd', 'e'].includes(e.key.toLowerCase())) {
        const opts = optionsMap[currentQ.id] || currentQ.options || [];
        let index = -1;
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          index = parseInt(e.key) - 1;
        } else {
          const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4 };
          index = letterMap[e.key.toLowerCase()];
        }
        if (opts[index]) {
          handleSelectOption(currentQ.id, opts[index].key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeExam, orderedQuestions, currentIndex, optionsMap, examResult, showSubmitConfirmModal, showViolationModal]);

  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSelectOption = (qId: string, optionKey: string) => {
    setMcAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const handleEssayChange = (qId: string, text: string) => {
    setEssayAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  // Submit Exam Calculation
  const handleFinalSubmit = useCallback(() => {
    if (!activeExam) return;

    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;
    let totalScoredPoints = 0;
    let maxPossiblePoints = 0;

    orderedQuestions.forEach((q) => {
      maxPossiblePoints += q.points || 10;

      if (q.type === 'multiple_choice') {
        const chosen = mcAnswers[q.id];
        if (!chosen) {
          emptyCount++;
        } else if (chosen === q.correctKey) {
          correctCount++;
          totalScoredPoints += q.points || 10;
        } else {
          wrongCount++;
        }
      } else {
        // Essay questions (Assigned full score for completion or pending teacher manual grading)
        const essayText = essayAnswers[q.id]?.trim();
        if (essayText) {
          totalScoredPoints += q.points || 10;
        } else {
          emptyCount++;
        }
      }
    });

    const finalScore = maxPossiblePoints > 0 ? Math.round((totalScoredPoints / maxPossiblePoints) * 100) : 0;
    const isPassed = finalScore >= (activeExam.passGrade || 70);

    const result: ExamResult = {
      id: 'res_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      studentNisn: student.nisn,
      className: student.className,
      examId: activeExam.id,
      examTitle: activeExam.title,
      subject: activeExam.subject,
      score: finalScore,
      totalQuestions: orderedQuestions.length,
      correctCount,
      wrongCount,
      emptyCount,
      multipleChoiceAnswers: mcAnswers,
      essayAnswers: essayAnswers,
      startedAt: examStartedAt,
      submittedAt: new Date().toISOString(),
      antiCheatViolations: violations,
      cameraSnapshots: cameraSnapshots,
      isPassed,
    };

    saveExamResult(result);
    clearExamDraft(student.id, activeExam.id);
    stopCamera();

    // Trigger Automatic Sync to Google Spreadsheet
    const currentSettings = getAppSettings();
    if (currentSettings.autoSyncGoogleSheets ?? true) {
      syncStudentExamResultToGoogleSpreadsheet(result, currentSettings).catch((err) => {
        console.warn('Auto-sync to Google Spreadsheet background error:', err);
      });
    }

    // Update student status
    const updatedStudent: Student = {
      ...student,
      status: 'COMPLETED',
    };
    saveStudent(updatedStudent);

    setExamResult(result);
    setShowSubmitConfirmModal(false);
  }, [activeExam, orderedQuestions, mcAnswers, essayAnswers, examStartedAt, student, violations, cameraSnapshots]);

  // Automatic submission when timer expires
  const handleTimeExpired = useCallback(() => {
    setIsTimeExpiredModalOpen(true);
    setTimeout(() => {
      handleFinalSubmit();
      setIsTimeExpiredModalOpen(false);
    }, 1500);
  }, [handleFinalSubmit]);

  // Clean camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 1. RESULT SUMMARY VIEW
  if (examResult) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 my-6 space-y-6 animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-center space-y-6">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Ujian Berhasil Diselesaikan!</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Jawaban Anda telah tersimpan secara permanen di server & Google Spreadsheet.
            </p>
          </div>

          {/* Score Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm mx-auto space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai Akhir Ujian</div>
            <div className="text-5xl font-black text-amber-400">{examResult.score}</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              examResult.isPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {examResult.isPassed ? 'LULUS (KOMPETEN)' : 'TIDAK LULUS (REMIDIAL)'}
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Soal</div>
              <div className="text-lg font-bold text-white">{examResult.totalQuestions}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Jawaban Benar</div>
              <div className="text-lg font-bold text-emerald-400">{examResult.correctCount}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Jawaban Salah</div>
              <div className="text-lg font-bold text-rose-400">{examResult.wrongCount}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Kosong / Unanswered</div>
              <div className="text-lg font-bold text-amber-400">{examResult.emptyCount}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => downloadExamResultPDF(examResult, settings)}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Unduh / Cetak Laporan Hasil PDF</span>
            </button>

            <button
              onClick={() => {
                setExamResult(null);
                setActiveExam(null);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
            >
              Kembali ke Menu Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE EXAM EXECUTION VIEW
  if (activeExam) {
    const currentQ = orderedQuestions[currentIndex];
    const answeredCount = Object.keys(mcAnswers).length + Object.keys(essayAnswers).filter((k) => essayAnswers[k]?.trim()).length;
    const unansweredCount = orderedQuestions.length - answeredCount;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Hidden Canvas & Video for Proctoring */}
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Exam Header */}
        <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-amber-300 truncate max-w-xs sm:max-w-md">
                {activeExam.title}
              </h2>
              <p className="text-[10px] text-slate-400">
                Mapel: {activeExam.subject} • Kelas: {student.className}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Live Camera Proctor Status */}
              {activeExam.cameraProctoring && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Kamera Guard Active</span>
                </div>
              )}

              {/* Auto Save Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                <Save className="w-3 h-3 text-sky-400" />
                <span>{autoSaveStatus} {lastSavedTime && `(${lastSavedTime})`}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Question Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Question Box */}
            {currentQ && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                
                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-black">
                      Soal #{currentIndex + 1} / {orderedQuestions.length}
                    </span>
                    <span className="text-xs font-bold text-amber-400 uppercase">
                      {currentQ.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay / Uraian'} ({currentQ.points} Poin)
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      flaggedIds.includes(currentQ.id)
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{flaggedIds.includes(currentQ.id) ? 'Ragu-Ragu (Tandai)' : 'Tandai Ragu'}</span>
                  </button>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base leading-relaxed text-slate-100 font-medium">
                  {currentQ.questionText}
                </div>

                {/* Question Options / Input */}
                {currentQ.type === 'multiple_choice' ? (
                  <div className="space-y-3 pt-2">
                    {(optionsMap[currentQ.id] || currentQ.options || []).map((opt) => {
                      const isSelected = mcAnswers[currentQ.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectOption(currentQ.id, opt.key)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="text-xs sm:text-sm font-medium leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-300">Tuliskan Jawaban Uraian / Essay Anda:</label>
                    <textarea
                      rows={6}
                      value={essayAnswers[currentQ.id] || ''}
                      onChange={(e) => handleEssayChange(currentQ.id, e.target.value)}
                      placeholder="Ketik uraian jawaban secara rinci di sini..."
                      className="w-full p-4 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-sans"
                    ></textarea>
                    <div className="text-[10px] text-slate-400 text-right">
                      {(essayAnswers[currentQ.id] || '').length} Karakter
                    </div>
                  </div>
                )}

                {/* Footer Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="text-xs text-slate-400 hidden sm:block">
                    Pintasan Keyboard: Panah Kiri/Kanan • Opsi 1-5 / A-E • Key R (Ragu)
                  </div>

                  <button
                    disabled={currentIndex === orderedQuestions.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(orderedQuestions.length - 1, prev + 1))}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Right Column: Timer & Question Navigation Grid */}
          <div className="space-y-6">
            
            {/* Timer Component */}
            <CountdownTimer
              durationMinutes={activeExam.durationMinutes}
              startedAtIso={examStartedAt}
              onTimeExpired={handleTimeExpired}
            />

            {/* Question Navigation Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200">Navigasi Soal</span>
                <span className="text-[10px] font-bold text-emerald-400">
                  {answeredCount} / {orderedQuestions.length} Terjawab
                </span>
              </div>

              {/* Grid Buttons */}
              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
                {orderedQuestions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isFlagged = flaggedIds.includes(q.id);
                  const isAnswered = q.type === 'multiple_choice' ? Boolean(mcAnswers[q.id]) : Boolean(essayAnswers[q.id]?.trim());

                  let btnBg = 'bg-slate-950 text-slate-400 border-slate-800';
                  if (isFlagged) {
                    btnBg = 'bg-amber-500 text-slate-950 font-black border-amber-400';
                  } else if (isAnswered) {
                    btnBg = 'bg-indigo-600 text-white font-bold border-indigo-500';
                  }

                  if (isCurrent) {
                    btnBg += ' ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl border text-xs flex items-center justify-center transition-all ${btnBg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-1 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600"></span>
                  <span>Sudah</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span>Ragu</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-800"></span>
                  <span>Belum</span>
                </div>
              </div>

              {/* Finish Exam Trigger Button */}
              <button
                onClick={() => setShowSubmitConfirmModal(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan & Selesaikan Ujian</span>
              </button>

            </div>

          </div>

        </div>

        {/* SUBMIT CONFIRMATION MODAL */}
        {showSubmitConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-5">
              <div className="flex items-center gap-3 text-amber-400 font-bold text-lg">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <span>Konfirmasi Pengumpulan Ujian</span>
              </div>

              {unansweredCount > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1">
                  <div className="font-bold">⚠️ Perhatian: Ada {unansweredCount} Soal Belum Dijawab!</div>
                  <p>Anda masih memiliki soal yang belum diisi. Apakah Anda yakin ingin menyelesaikan ujian sekarang?</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed">
                  <div className="font-bold">✅ Seluruh {orderedQuestions.length} Soal telah dijawab lengkap!</div>
                  <p>Jawaban Anda akan langsung diperiksa dan disimpan secara permanen.</p>
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Total Soal:</span>
                  <span className="font-bold">{orderedQuestions.length}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Soal Terjawab:</span>
                  <span className="font-bold">{answeredCount}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Belum Dijawab:</span>
                  <span className="font-bold">{unansweredCount}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Ditandai Ragu:</span>
                  <span className="font-bold">{flaggedIds.length}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Kembali Periksa Soal
                </button>

                <button
                  onClick={handleFinalSubmit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md"
                >
                  Ya, Kumpulkan Jawaban
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIOLATION WARNING MODAL */}
        {showViolationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-md bg-rose-950 border-2 border-rose-500 rounded-3xl p-6 text-white space-y-4 shadow-2xl animate-shake">
              <div className="flex items-center gap-3 text-rose-400 font-extrabold text-lg">
                <ShieldAlert className="w-8 h-8 text-rose-400 animate-bounce" />
                <span>PERINGATAN ANTI-NYONTEK!</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-rose-500/40 text-xs text-rose-200 leading-relaxed font-medium">
                {violationMessage}
              </div>

              <div className="text-[11px] text-slate-300">
                Sistem merekam timestamp serta foto kamera pengawas setiap kali terjadi aktivitas multitasking.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowViolationModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg"
                >
                  Saya Mengerti & Lanjutkan Ujian
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TIME EXPIRED & LOCK OVERLAY MODAL */}
        {isTimeExpiredModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in select-none">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-5 animate-pulse shadow-2xl shadow-rose-500/20">
              <Lock className="w-10 h-10" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              WAKTU UJIAN TELAH HABIS!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-2 leading-relaxed">
              Sisa waktu pengerjaan telah mencapai 00:00. Layar ujian dikunci secara otomatis. Seluruh draft jawaban Anda sedang dikumpulkan dan disinkronkan ke server...
            </p>
            <div className="mt-6 flex items-center gap-2.5 text-emerald-400 font-extrabold text-xs bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/30 shadow-lg">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Mengunggah & Mengunci Lembar Jawaban...</span>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 3. STUDENT DASHBOARD (AVAILABLE EXAMS LIST)
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 my-4 animate-fade-in">
      
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">Selamat Datang, {student.name}!</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {student.className}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            NISN: {student.nisn} • Akun Ujian Terverifikasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStudentGuide(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Petunjuk Ujian</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </div>

      {/* Available Exams List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Jadwal Ujian Aktif Tersedia</span>
          </h3>

          <button
            onClick={() => setShowStudentGuide(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tata Cara Ujian</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const draft = getExamDraft(student.id, exam.id);
            return (
              <div
                key={exam.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {exam.subject}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      {exam.durationMinutes} Menit
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white leading-snug">{exam.title}</h4>
                  
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Target Kelas: <span className="text-slate-200 font-semibold">{exam.targetClassName}</span></div>
                    <div>Jumlah Soal: <span className="text-slate-200 font-semibold">{exam.questions?.length || 0} Soal</span></div>
                    {exam.cameraProctoring && (
                      <div className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> Kamera Guard Pengawas Aktif
                      </div>
                    )}
                  </div>
                </div>

                {draft && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-medium">
                    ✏️ Draf Tersimpan: {new Date(draft.updatedAt).toLocaleTimeString('id-ID')}
                  </div>
                )}

                <button
                  onClick={() => handleStartExam(exam)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{draft ? 'Lanjutkan Ujian (Draf Tersimpan)' : 'Mulai Kerjakan Ujian'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Guide Modal for Students */}
      <UserGuideModal
        isOpen={showStudentGuide}
        onClose={() => setShowStudentGuide(false)}
        defaultRole="student"
      />

    </div>
  );
};
