import React, { useState, useEffect } from 'react';
import {
  Student,
  ClassItem,
  Question,
  ExamSchedule,
  ExamResult,
  AppSettings,
  OneTimeAdminLogin
} from '../types';
import {
  getStudents,
  getExamResults,
  saveStudents,
  saveStudent,
  deleteStudent,
  deleteAllStudents,
  saveClasses,
  saveClass,
  deleteClass,
  saveQuestions,
  saveQuestion,
  deleteQuestion,
  deleteAllQuestions,
  saveExamSchedules,
  saveExamSchedule,
  deleteExamSchedule,
  deleteAllExamSchedules,
  deleteExamResult,
  deleteAllExamResults,
  deleteOneTimeAdminLogin,
  saveAppSettings,
  saveOneTimeAdminLogin,
  processSyncQueue,
  getSyncQueue,
  saveSyncQueue
} from '../lib/storage';
import { downloadExamResultPDF, downloadBatchExamResultsPDF, exportResultsCSV } from '../lib/pdfGenerator';
import { extractTextFromWordFile, parseQuestionsFromText, downloadWordQuestionTemplate } from '../lib/wordParser';
import {
  syncStudentExamResultToGoogleSpreadsheet,
  createNewGoogleSpreadsheet,
  formatExamResultToRow,
  GOOGLE_SHEET_HEADERS
} from '../lib/googleSheets';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Award,
  Database,
  Settings,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  Printer,
  Sparkles,
  QrCode,
  Eye,
  EyeOff,
  Copy,
  MessageCircle,
  RefreshCw,
  Search,
  Camera,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  Key,
  FileText,
  FileSpreadsheet,
  Lock,
  Unlock,
  RotateCcw,
  Building,
  Image as ImageIcon,
  School,
  Check,
  ExternalLink,
  Globe,
  Send,
  Smartphone,
  Share2,
  ChevronRight
} from 'lucide-react';
import { StudentShareModal } from './StudentShareModal';
import { UserGuideModal } from './UserGuideModal';

interface AdminDashboardProps {
  adminName: string;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: ClassItem[];
  setClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  exams: ExamSchedule[];
  setExams: React.Dispatch<React.SetStateAction<ExamSchedule[]>>;
  results: ExamResult[];
  setResults: React.Dispatch<React.SetStateAction<ExamResult[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onLogout: () => void;
  onOpenStudentPreview?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminName,
  students,
  setStudents,
  classes,
  setClasses,
  questions,
  setQuestions,
  exams,
  setExams,
  results,
  setResults,
  settings,
  setSettings,
  onLogout,
  onOpenStudentPreview,
}) => {
  const [activeTab, setActiveTab] = useState<
    'monitoring' | 'students' | 'questions' | 'schedules' | 'results' | 'spreadsheet' | 'school_profile' | 'settings'
  >('monitoring');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [monitoringStatusFilter, setMonitoringStatusFilter] = useState<string>('all');
  const [monitoringClassFilter, setMonitoringClassFilter] = useState<string>('all');

  // Class Form Modal / State
  const [classNameInput, setClassNameInput] = useState<string>('');
  const [classDescInput, setClassDescInput] = useState<string>('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Student Form State
  const [studentName, setStudentName] = useState<string>('');
  const [studentNisn, setStudentNisn] = useState<string>('');
  const [studentUser, setStudentUser] = useState<string>('');
  const [studentPass, setStudentPass] = useState<string>('');
  const [studentClassId, setStudentClassId] = useState<string>('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Question Form State
  const [qType, setQType] = useState<'multiple_choice' | 'essay'>('multiple_choice');
  const [qText, setQText] = useState<string>('');
  const [qOptA, setQOptA] = useState<string>('');
  const [qOptB, setQOptB] = useState<string>('');
  const [qOptC, setQOptC] = useState<string>('');
  const [qOptD, setQOptD] = useState<string>('');
  const [qOptE, setQOptE] = useState<string>('');
  const [qCorrectKey, setQCorrectKey] = useState<string>('A');
  const [qEssayGuide, setQEssayGuide] = useState<string>('');
  const [qPoints, setQPoints] = useState<number>(20);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Mass Point Edit State
  const [massPgPoints, setMassPgPoints] = useState<number>(5);
  const [massEssayPoints, setMassEssayPoints] = useState<number>(20);
  const [massAllPoints, setMassAllPoints] = useState<number>(10);

  // AI Gemini Question Generator
  const [aiMaterialText, setAiMaterialText] = useState<string>('');
  const [aiSubject, setAiSubject] = useState<string>('Pengetahuan Umum');
  const [aiMcCount, setAiMcCount] = useState<number>(5);
  const [aiEssayCount, setAiEssayCount] = useState<number>(2);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string>('');

  // Exam Schedule Form State
  const [exTitle, setExTitle] = useState<string>('');
  const [exSubject, setExSubject] = useState<string>('');
  const [exTargetClassId, setExTargetClassId] = useState<string>('all');
  const [exDuration, setExDuration] = useState<number>(45);
  const [exRandomQ, setExRandomQ] = useState<boolean>(true);
  const [exRandomOpt, setExRandomOpt] = useState<boolean>(true);
  const [exCamera, setExCamera] = useState<boolean>(true);
  const [exCameraInterval, setExCameraInterval] = useState<number>(2);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Google Sheets Auto-Sync Control Center State
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [syncSheetStatusMsg, setSyncSheetStatusMsg] = useState<string>('');
  const [googleAccessTokenInput, setGoogleAccessTokenInput] = useState<string>('');
  const [showAppsScriptCodeModal, setShowAppsScriptCodeModal] = useState<boolean>(false);

  // One-Time Admin Login Form
  const [otlNameInput, setOtlNameInput] = useState<string>('');
  const [showSuperAdminPass, setShowSuperAdminPass] = useState<boolean>(false);

  // Modal Lightbox Snapshot Detail
  const [inspectResult, setInspectResult] = useState<ExamResult | null>(null);
  const [showQrPrintModal, setShowQrPrintModal] = useState<boolean>(false);
  const [qrClassFilter, setQrClassFilter] = useState<string>('all');
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);

  // Modal Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestDelete = (title: string, message: string, onConfirm: () => void) => {
    setDeleteConfirm({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const handleConfirmDelete = () => {
    deleteConfirm.onConfirm();
    setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  // Auto-refresh for live monitoring
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Results Batch PDF & Filter State
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [resultFilterClass, setResultFilterClass] = useState<string>('all');
  const [resultFilterSubject, setResultFilterSubject] = useState<string>('all');
  const [resultSearchQuery, setResultSearchQuery] = useState<string>('');

  // Student Share & Portal Modal State
  const [showStudentShareModal, setShowStudentShareModal] = useState<boolean>(false);

  // User Guide Modal State
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Student Template Copy State
  const [isTemplateCopied, setIsTemplateCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Refresh local storage states
      setStudents(getStudents());
      setResults(getExamResults());
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, setStudents, setResults]);

  // Handle Class Add/Edit
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    const classItem: ClassItem = {
      id: editingClassId || 'c_' + Date.now(),
      name: classNameInput.trim(),
      description: classDescInput.trim(),
      studentCount: students.filter((s) => s.classId === editingClassId).length,
    };

    saveClass(classItem);
    const updated = classes.filter((c) => c.id !== classItem.id).concat(classItem);
    setClasses(updated);

    setClassNameInput('');
    setClassDescInput('');
    setEditingClassId(null);
  };

  const handleEditClass = (c: ClassItem) => {
    setEditingClassId(c.id);
    setClassNameInput(c.name);
    setClassDescInput(c.description || '');
  };

  const handleDeleteClass = (id: string) => {
    requestDelete('Hapus Kelas', 'Apakah Anda yakin ingin menghapus kelas ini?', () => {
      deleteClass(id);
      setClasses(classes.filter((c) => c.id !== id));
    });
  };

  // Handle Student Add/Edit
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentNisn.trim()) return;

    const targetClass = classes.find((c) => c.id === studentClassId) || classes[0];

    const student: Student = {
      id: editingStudentId || 's_' + Date.now(),
      name: studentName.trim(),
      nisn: studentNisn.trim(),
      username: studentUser.trim() || `siswa_${studentNisn.slice(-4)}`,
      password: studentPass.trim() || '123',
      classId: targetClass?.id || 'c1',
      className: targetClass?.name || 'X MIPA 1',
      isBlocked: false,
      violationsCount: 0,
      violationLogs: [],
      status: 'OFFLINE',
    };

    saveStudent(student);
    const updated = students.filter((s) => s.id !== student.id).concat(student);
    setStudents(updated);

    setStudentName('');
    setStudentNisn('');
    setStudentUser('');
    setStudentPass('');
    setEditingStudentId(null);
  };

  const handleEditStudent = (s: Student) => {
    setEditingStudentId(s.id);
    setStudentName(s.name);
    setStudentNisn(s.nisn);
    setStudentUser(s.username);
    setStudentPass(s.password);
    setStudentClassId(s.classId);
  };

  const handleResetStudentPasswordAdmin = (s: Student) => {
    const newPass = prompt(`Masukkan Password PIN Baru untuk Siswa:\n\nNama: ${s.name}\nNISN: ${s.nisn}`, '123456');
    if (newPass === null) return;

    const cleanPass = newPass.trim();
    if (!cleanPass) {
      alert('Password PIN tidak boleh kosong.');
      return;
    }

    const updated: Student = {
      ...s,
      password: cleanPass,
    };
    saveStudent(updated);
    setStudents(students.map((item) => (item.id === s.id ? updated : item)));
    alert(`🔑 PASWORD BERHASIL DI-RESET!\n\nPassword PIN untuk ${s.name} (${s.nisn}) telah diubah menjadi: "${cleanPass}".`);
  };

  const handleDeleteStudent = (id: string) => {
    requestDelete('Hapus Data Siswa', 'Apakah Anda yakin ingin menghapus data siswa ini?', () => {
      deleteStudent(id);
      setStudents(students.filter((s) => s.id !== id));
    });
  };

  const handleUnblockStudent = (s: Student) => {
    const updated: Student = {
      ...s,
      isBlocked: false,
      violationsCount: 0,
      violationLogs: [],
      status: 'OFFLINE',
    };
    saveStudent(updated);
    setStudents(students.map((item) => (item.id === s.id ? updated : item)));
    alert(`Akses siswa ${s.name} berhasil DIBUKA KEMBALI dan riwayat pelanggaran di-reset.`);
  };

  // Generate Student CSV Template String
  const getStudentTemplateCSVString = () => {
    const sampleClass1 = classes[0]?.name || 'X MIPA 1';
    const sampleClass2 = classes[1]?.name || classes[0]?.name || 'X IPS 1';
    return `NISN,Nama Siswa,Kelas,Username,Password
"0051234567","Ahmad Rizky Pratama","${sampleClass1}","ahmad01","123456"
"0051234568","Budi Santoso","${sampleClass1}","budi02","123456"
"0051234569","Siti Aminah","${sampleClass2}","siti03","123456"`;
  };

  const handleCopyStudentTemplate = () => {
    const text = getStudentTemplateCSVString();
    navigator.clipboard.writeText(text);
    setIsTemplateCopied(true);
    setTimeout(() => setIsTemplateCopied(false), 2000);
  };

  // Download Template Format Excel/CSV for Student Mass Upload
  const handleDownloadStudentTemplate = () => {
    const sampleClass1 = classes[0]?.name || 'X MIPA 1';
    const sampleClass2 = classes[1]?.name || classes[0]?.name || 'X IPS 1';

    // Generate native .xlsx file
    const sampleData = [
      {
        'NISN': '0051234567',
        'Nama Siswa': 'Ahmad Rizky Pratama',
        'Kelas': sampleClass1,
        'Username': 'ahmad01',
        'Password': '123'
      },
      {
        'NISN': '0051234568',
        'Nama Siswa': 'Budi Santoso',
        'Kelas': sampleClass1,
        'Username': 'budi02',
        'Password': '123'
      },
      {
        'NISN': '0051234569',
        'Nama Siswa': 'Siti Aminah',
        'Kelas': sampleClass2,
        'Username': 'siti03',
        'Password': '123'
      }
    ];

    try {
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
      XLSX.writeFile(workbook, 'Template_Format_Data_Siswa.xlsx');
    } catch {
      // Fallback CSV download if XLSX fails
      const csvContent = getStudentTemplateCSVString();
      const csvText = '\uFEFF' + csvContent;
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Template_Format_Data_Siswa.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Mass Excel / CSV Upload for Students
  const handleMassExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        alert('File Excel/CSV kosong atau tidak memiliki worksheet.');
        e.target.value = '';
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        alert('File Excel/CSV tidak berisi baris data siswa.');
        e.target.value = '';
        return;
      }

      let currentClasses = [...classes];
      const newStudents: Student[] = [];
      let newClassesCreatedCount = 0;

      rawRows.forEach((row: any, i: number) => {
        // Helper to match column header flexibly (ignoring spaces, case, underscores, etc.)
        const getVal = (aliases: string[]) => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().replace(/[\s_.-]+/g, '');
            const isMatch = aliases.some((a) => {
              const cleanAlias = a.trim().toLowerCase().replace(/[\s_.-]+/g, '');
              return cleanAlias === cleanKey;
            });
            if (isMatch) {
              return String(row[key] ?? '').trim();
            }
          }
          return '';
        };

        const name =
          getVal(['Nama Siswa', 'Nama', 'nama', 'name', 'Nama_Siswa', 'Nama Lengkap', 'Student Name', 'Nama Peserta']) ||
          `Siswa ${i + 1}`;
        const nisn =
          getVal(['NISN', 'nisn', 'Nisn', 'Nomor NISN', 'No NISN', 'ID Siswa', 'NIS']) ||
          `005${Math.floor(1000000 + Math.random() * 9000000)}`;
        const user =
          getVal([
            'Username',
            'username',
            'user name',
            'user_name',
            'user',
            'nama user',
            'nama_user',
            'akun',
            'login',
            'id_user',
            'user_id',
            'id user',
          ]) || `usr_${nisn.slice(-5)}_${i + 1}`;
        const pass =
          getVal([
            'Password',
            'pasword',
            'password',
            'pass',
            'PIN',
            'pin',
            'password pin',
            'pass_word',
            'pwd',
            'passcode',
          ]) || '123';
        const rawClassName =
          getVal(['Kelas', 'kelas', 'class', 'Class', 'nama kelas', 'rombel', 'tingkat']) || 'X MIPA 1';

        // Match existing class or auto-create missing class
        const cleanClassName = rawClassName.trim();
        let matchedClass = currentClasses.find(
          (c) => c.name.trim().toLowerCase() === cleanClassName.toLowerCase()
        );

        if (!matchedClass && cleanClassName) {
          matchedClass = {
            id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: cleanClassName,
            description: `Kelas ${cleanClassName} (Otomatis dari Upload Excel)`,
          };
          currentClasses.push(matchedClass);
          newClassesCreatedCount++;
        }

        const defaultClass = currentClasses[0] || { id: 'c1', name: 'X MIPA 1' };
        const finalClass = matchedClass || defaultClass;

        newStudents.push({
          id: 's_excel_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 5),
          name: name,
          nisn: nisn,
          username: user,
          password: pass,
          classId: finalClass.id,
          className: finalClass.name,
          isBlocked: false,
          violationsCount: 0,
          violationLogs: [],
          status: 'OFFLINE',
        });
      });

      if (newStudents.length > 0) {
        if (newClassesCreatedCount > 0) {
          saveClasses(currentClasses);
          setClasses(currentClasses);
        }

        const combined = [...students, ...newStudents];
        saveStudents(combined);
        setStudents(combined);

        let successMsg = `BERHASIL! Mengimpor ${newStudents.length} siswa massal dari file "${file.name}".`;
        if (newClassesCreatedCount > 0) {
          successMsg += `\n\n- ${newClassesCreatedCount} Kelas baru dibuat otomatis (misal: ${newStudents.map(s => s.className).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 3).join(', ')}...).`;
        }
        alert(successMsg);
      } else {
        alert('Tidak ada data siswa yang berhasil dibaca dari file ini.');
      }
    } catch (err: any) {
      alert('Gagal membaca file Excel/CSV: ' + (err.message || err));
    } finally {
      e.target.value = '';
    }
  };

  // Export Excel/CSV Student Credentials
  const handleExportStudentsCSV = () => {
    if (students.length === 0) {
      alert('Belum ada data siswa untuk diexport. Silakan tambahkan data siswa terlebih dahulu.');
      return;
    }
    const headers = ['NISN', 'Nama Siswa', 'Kelas', 'Username', 'Password PIN'];
    const rows = students.map((s) => [
      `"${(s.nisn || '').replace(/"/g, '""')}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.className || '').replace(/"/g, '""')}"`,
      `"${(s.username || '').replace(/"/g, '""')}"`,
      `"${(s.password || '').replace(/"/g, '""')}"`
    ]);

    const csvText = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_Akun_Siswa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Question Form
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const question: Question = {
      id: editingQuestionId || 'q_' + Date.now(),
      type: qType,
      questionText: qText.trim(),
      points: qPoints,
    };

    if (qType === 'multiple_choice') {
      question.options = [
        { key: 'A', text: qOptA.trim() || 'Opsi A' },
        { key: 'B', text: qOptB.trim() || 'Opsi B' },
        { key: 'C', text: qOptC.trim() || 'Opsi C' },
        { key: 'D', text: qOptD.trim() || 'Opsi D' },
        { key: 'E', text: qOptE.trim() || 'Opsi E' },
      ];
      question.correctKey = qCorrectKey;
    } else {
      question.essayGuide = qEssayGuide.trim();
    }

    saveQuestion(question);
    const updated = questions.filter((q) => q.id !== question.id).concat(question);
    setQuestions(updated);

    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQOptE('');
    setQEssayGuide('');
    setEditingQuestionId(null);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setQType(q.type);
    setQText(q.questionText);
    setQPoints(q.points);

    if (q.type === 'multiple_choice' && q.options) {
      setQOptA(q.options[0]?.text || '');
      setQOptB(q.options[1]?.text || '');
      setQOptC(q.options[2]?.text || '');
      setQOptD(q.options[3]?.text || '');
      setQOptE(q.options[4]?.text || '');
      setQCorrectKey(q.correctKey || 'A');
    } else {
      setQEssayGuide(q.essayGuide || '');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    requestDelete('Hapus Soal', 'Apakah Anda yakin ingin menghapus soal ini dari Bank Soal?', () => {
      deleteQuestion(id);
      setQuestions(questions.filter((q) => q.id !== id));
    });
  };

  // Inline Point Update Handler per Question
  const handleInlineUpdateQuestionPoints = (questionId: string, newPoints: number) => {
    const validPoints = Math.max(1, isNaN(newPoints) ? 1 : newPoints);
    const updated = questions.map((q) => (q.id === questionId ? { ...q, points: validPoints } : q));
    saveQuestions(updated);
    setQuestions(updated);
  };

  // Bulk Apply Points to PG
  const handleApplyMassPgPoints = () => {
    const pgQuestions = questions.filter((q) => q.type === 'multiple_choice');
    if (pgQuestions.length === 0) {
      alert('Tidak ada soal Pilihan Ganda (PG) di Bank Soal.');
      return;
    }
    const updated = questions.map((q) => (q.type === 'multiple_choice' ? { ...q, points: massPgPoints } : q));
    saveQuestions(updated);
    setQuestions(updated);
    alert(`BERHASIL: Nilai poin seluruh soal Pilihan Ganda (${pgQuestions.length} Soal) diubah menjadi ${massPgPoints} poin per soal.`);
  };

  // Bulk Apply Points to Essay
  const handleApplyMassEssayPoints = () => {
    const essayQuestions = questions.filter((q) => q.type === 'essay');
    if (essayQuestions.length === 0) {
      alert('Tidak ada soal Essay di Bank Soal.');
      return;
    }
    const updated = questions.map((q) => (q.type === 'essay' ? { ...q, points: massEssayPoints } : q));
    saveQuestions(updated);
    setQuestions(updated);
    alert(`BERHASIL: Nilai poin seluruh soal Essay (${essayQuestions.length} Soal) diubah menjadi ${massEssayPoints} poin per soal.`);
  };

  // Bulk Apply Points to ALL questions
  const handleApplyMassAllPoints = () => {
    if (questions.length === 0) {
      alert('Bank Soal masih kosong.');
      return;
    }
    const updated = questions.map((q) => ({ ...q, points: massAllPoints }));
    saveQuestions(updated);
    setQuestions(updated);
    alert(`BERHASIL: Nilai poin seluruh ${questions.length} soal di Bank Soal diubah menjadi ${massAllPoints} poin per soal.`);
  };

  // Auto Calculate Points to target 100 Total Score
  const handleAutoCalculateTarget100 = () => {
    if (questions.length === 0) {
      alert('Bank Soal masih kosong.');
      return;
    }

    const pgCount = questions.filter((q) => q.type === 'multiple_choice').length;
    const essayCount = questions.filter((q) => q.type === 'essay').length;

    let updatedQuestions: Question[] = [];

    if (essayCount === 0) {
      // 100% PG
      const pointsPerPg = Math.max(1, Math.round(100 / pgCount));
      updatedQuestions = questions.map((q) => ({ ...q, points: pointsPerPg }));
    } else if (pgCount === 0) {
      // 100% Essay
      const pointsPerEssay = Math.max(1, Math.round(100 / essayCount));
      updatedQuestions = questions.map((q) => ({ ...q, points: pointsPerEssay }));
    } else {
      // 70% PG, 30% Essay
      const targetPgTotal = 70;
      const targetEssayTotal = 30;
      const pointsPerPg = Math.max(1, Math.round(targetPgTotal / pgCount));
      const pointsPerEssay = Math.max(1, Math.round(targetEssayTotal / essayCount));

      updatedQuestions = questions.map((q) => ({
        ...q,
        points: q.type === 'multiple_choice' ? pointsPerPg : pointsPerEssay,
      }));
    }

    saveQuestions(updatedQuestions);
    setQuestions(updatedQuestions);

    const totalCalculated = updatedQuestions.reduce((acc, q) => acc + q.points, 0);
    alert(`BERHASIL RE-KALKULASI POIN OTOMATIS (TARGET MAX 100 NILAI)!
    
- Soal PG (${pgCount} soal): @ ${updatedQuestions.find((q) => q.type === 'multiple_choice')?.points || 0} poin
- Soal Essay (${essayCount} soal): @ ${updatedQuestions.find((q) => q.type === 'essay')?.points || 0} poin
- Total Poin Maksimal Ujian: ${totalCalculated} Poin.`);
  };

  // Google Sheets Master Sync Handlers
  const handleSyncAllResultsToSheets = async () => {
    if (results.length === 0) {
      alert('Belum ada data hasil ujian siswa untuk disinkronkan.');
      return;
    }

    setIsSyncingSheets(true);
    setSyncSheetStatusMsg('');
    try {
      // 1. Process offline queue
      await processSyncQueue();

      // 2. Sync all results
      let successCount = 0;
      for (const resItem of results) {
        const syncRes = await syncStudentExamResultToGoogleSpreadsheet(resItem, settings, googleAccessTokenInput);
        if (syncRes.success) successCount++;
      }

      setSyncSheetStatusMsg(
        `✅ BERHASIL SINKRONISASI! ${successCount} dari ${results.length} data hasil ujian siswa telah terkirim ke Google Spreadsheet.`
      );
    } catch (err: any) {
      setSyncSheetStatusMsg(`⚠️ Terjadi kesalahan saat sinkronisasi: ${err?.message || String(err)}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleCreateNewGoogleSheetAction = async () => {
    if (!googleAccessTokenInput) {
      alert('Silakan tempel Google OAuth Access Token atau masukan Google Account Token.');
      return;
    }

    setIsSyncingSheets(true);
    try {
      const created = await createNewGoogleSpreadsheet(
        googleAccessTokenInput,
        `Hasil_Ujian_${settings.schoolName || 'GiannaExamApk'}`
      );

      const updatedSettings = {
        ...settings,
        googleSpreadsheetId: created.spreadsheetId,
      };
      saveAppSettings(updatedSettings);
      setSettings(updatedSettings);

      alert(
        `🎉 SPREADSHEET BARU BERHASIL DIBUAT DI GOOGLE DRIVE!\n\nID Spreadsheet: ${created.spreadsheetId}\n\nURL Spreadsheet: ${created.spreadsheetUrl}`
      );
    } catch (err: any) {
      alert(`Gagal membuat Spreadsheet di Google Drive: ${err?.message || String(err)}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSyncSingleResultToSheets = async (resItem: ExamResult) => {
    setIsSyncingSheets(true);
    try {
      const syncRes = await syncStudentExamResultToGoogleSpreadsheet(resItem, settings, googleAccessTokenInput);
      if (syncRes.success) {
        alert(`✅ Hasil Ujian "${resItem.studentName}" berhasil disinkronkan ke Google Spreadsheet!`);
      } else {
        alert(`⚠️ Sinkronisasi gagal. Data disimpan ke antrean offline lokal.`);
      }
    } catch (e: any) {
      alert(`Gagal sync: ${e?.message || String(e)}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Word / Text File Question Upload Handler
  const [isWordUploading, setIsWordUploading] = useState<boolean>(false);

  const handleWordQuestionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsWordUploading(true);
    try {
      const rawText = await extractTextFromWordFile(file);
      const parsedQuestions = parseQuestionsFromText(rawText);

      if (parsedQuestions.length === 0) {
        alert('Gagal membaca soal: Format file Word/Text tidak dikenali atau tidak berisi nomor soal (seperti "1.", "2.", dll). Klik tombol "Download Format Word" untuk melihat template contoh yang tepat.');
        return;
      }

      // Merge with existing questions
      const combined = [...questions, ...parsedQuestions];
      saveQuestions(combined);
      setQuestions(combined);

      const mcCount = parsedQuestions.filter((q) => q.type === 'multiple_choice').length;
      const essayCount = parsedQuestions.filter((q) => q.type === 'essay').length;

      alert(`BERHASIL! Mengimpor ${parsedQuestions.length} soal dari file Word (${file.name}):\n- ${mcCount} Soal Pilihan Ganda (Opsi A-E + Kunci)\n- ${essayCount} Soal Essay (Rubrik/Kunci)`);
    } catch (err: any) {
      alert('Gagal memproses file Word: ' + (err.message || err));
    } finally {
      setIsWordUploading(false);
      e.target.value = '';
    }
  };

  // AI Question Generation via Server Gemini API
  const handleGenerateQuestionsAI = async () => {
    if (!aiMaterialText.trim()) {
      alert('Harap isi teks materi atau topik soal terlebih dahulu.');
      return;
    }

    setIsAiLoading(true);
    setAiSuccessMessage('');

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: aiMaterialText,
          subject: aiSubject,
          mcCount: aiMcCount,
          essayCount: aiEssayCount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.questions) {
        const generated = data.questions;
        const combined = [...questions, ...generated];
        saveQuestions(combined);
        setQuestions(combined);
        setAiSuccessMessage(`BERHASIL: AI Gemini telah membuat ${generated.length} soal baru dan menyimpannya ke Bank Soal!`);
        setAiMaterialText('');
      } else {
        alert('Gagal membuat soal: ' + (data.error || 'Terjadi kesalahan pada AI.'));
      }
    } catch (err: any) {
      alert('Error saat menghubungi server AI Gemini: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save Exam Schedule
  const handleSaveExamSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exTitle.trim() || questions.length === 0) {
      alert('Harap isi Judul Ujian dan pastikan Bank Soal tidak kosong.');
      return;
    }

    const targetClass = classes.find((c) => c.id === exTargetClassId);

    const exam: ExamSchedule = {
      id: editingExamId || 'ex_' + Date.now(),
      title: exTitle.trim(),
      subject: exSubject.trim() || 'Pengetahuan Umum',
      targetClassId: exTargetClassId,
      targetClassName: exTargetClassId === 'all' ? 'Semua Kelas' : targetClass?.name || 'X MIPA 1',
      durationMinutes: exDuration,
      startTime: new Date().toISOString(),
      endTime: '2026-12-31T23:59',
      isRandomizeQuestions: exRandomQ,
      isRandomizeOptions: exRandomOpt,
      cameraProctoring: exCamera,
      cameraIntervalMinutes: exCameraInterval,
      questions: questions,
      passGrade: 70,
    };

    saveExamSchedule(exam);
    const updated = exams.filter((e) => e.id !== exam.id).concat(exam);
    setExams(updated);

    setExTitle('');
    setExSubject('');
    setEditingExamId(null);
  };

  const handleDeleteExamSchedule = (id: string) => {
    requestDelete('Hapus Jadwal Ujian', 'Apakah Anda yakin ingin menghapus jadwal ujian ini?', () => {
      deleteExamSchedule(id);
      setExams(exams.filter((e) => e.id !== id));
    });
  };

  // One-Time Admin Login Generation
  const handleCreateOneTimeAdmin = () => {
    if (!otlNameInput.trim()) {
      alert('Harap tuliskan nama pengawas/ruang terlebih dahulu.');
      return;
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    const randomPass = Math.random().toString(36).substring(2, 8).toUpperCase();

    const otl: OneTimeAdminLogin = {
      id: 'otl_' + Date.now(),
      username: `admin_${randomNum}`,
      password: randomPass,
      name: otlNameInput.trim(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    saveOneTimeAdminLogin(otl);
    setSettings({ ...settings });
    setOtlNameInput('');
    alert(`AKUN 1X PAKAI BERHASIL DIBUAT:\nUsername: ${otl.username}\nPassword: ${otl.password}`);
  };

  const handleResetOtl = (otl: OneTimeAdminLogin) => {
    const newPass = Math.random().toString(36).substring(2, 8).toUpperCase();
    const updated: OneTimeAdminLogin = {
      ...otl,
      password: newPass,
      status: 'ACTIVE',
      usedAt: undefined,
    };
    saveOneTimeAdminLogin(updated);
    setSettings({ ...settings });
    alert(`Password baru untuk ${otl.username} adalah: ${newPass}`);
  };

  const handleDeleteOtl = (id: string) => {
    requestDelete('Hapus Akun 1x Pakai', 'Apakah Anda yakin ingin menghapus akun admin/pengawas 1x pakai ini?', () => {
      deleteOneTimeAdminLogin(id);
      setSettings({
        ...settings,
        oneTimeAdminLogins: (settings.oneTimeAdminLogins || []).filter((o) => o.id !== id),
      });
    });
  };

  const handleDeleteResult = (id: string) => {
    requestDelete('Hapus Hasil Ujian', 'Apakah Anda yakin ingin menghapus hasil ujian ini?', () => {
      deleteExamResult(id);
      setResults(results.filter((r) => r.id !== id));
    });
  };

  const handleDeleteAllResults = () => {
    requestDelete('HAPUS SELURUH HASIL UJIAN', 'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH hasil nilai ujian? Data yang dihapus tidak dapat dikembalikan.', () => {
      deleteAllExamResults();
      setResults([]);
    });
  };

  const handleDeleteAllStudents = () => {
    requestDelete('HAPUS SELURUH SISWA', 'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH data siswa? Data yang dihapus tidak dapat dikembalikan.', () => {
      deleteAllStudents();
      setStudents([]);
    });
  };

  const handleDeleteAllQuestions = () => {
    requestDelete('KOSONGKAN BANK SOAL', 'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH soal di bank soal?', () => {
      deleteAllQuestions();
      setQuestions([]);
    });
  };

  const handleDeleteAllExamSchedules = () => {
    requestDelete('HAPUS SELURUH JADWAL UJIAN', 'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH jadwal ujian?', () => {
      deleteAllExamSchedules();
      setExams([]);
    });
  };

  const formattedWa = (settings.waHelpNumber || '085240195357')
    .replace(/^0/, '62')
    .replace(/[^0-9]/g, '');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 my-4 animate-fade-in">
      
      {/* Top Admin Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">Dashboard Administrator & Guru</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {adminName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola Kelas, Siswa Massal, Bank Soal, Anti-Cheat & Integration Google Spreadsheet
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowGuideModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
            title="Lihat Alur Urut Langkah Penggunaan Aplikasi Ujian"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Panduan Urut Ujian</span>
          </button>

          <button
            onClick={() => setShowStudentShareModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:to-sky-500 text-white border border-indigo-400/30 text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02]"
            title="Bagikan Tautan Khusus Siswa & QR Code Proyektor Kelas"
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>Bagikan Aplikasi & QR Siswa</span>
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors"
          >
            Keluar Admin
          </button>
        </div>
      </div>

      {/* QUICK INTERACTIVE WORKFLOW STEPPER BAR (CHRONOLOGICAL GUIDE) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-black text-white tracking-wide uppercase">
              Alur Urut Pelaksanaan Ujian:
            </span>
          </div>
          <button
            onClick={() => setShowGuideModal(true)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Baca Penjelasan Detail</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Step 1 */}
          <button
            onClick={() => setActiveTab('students')}
            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-black flex items-center justify-center shrink-0">1</span>
            <div className="truncate">
              <div className="font-bold text-[11px] truncate">1. Data Siswa</div>
              <div className="text-[10px] opacity-75 truncate">{students.length} Siswa Terdaftar</div>
            </div>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => setActiveTab('questions')}
            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-black flex items-center justify-center shrink-0">2</span>
            <div className="truncate">
              <div className="font-bold text-[11px] truncate">2. Bank Soal</div>
              <div className="text-[10px] opacity-75 truncate">{questions.length} Soal Siap</div>
            </div>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => setActiveTab('schedules')}
            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
              activeTab === 'schedules'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-black flex items-center justify-center shrink-0">3</span>
            <div className="truncate">
              <div className="font-bold text-[11px] truncate">3. Jadwal & Token</div>
              <div className="text-[10px] opacity-75 truncate">{exams.length} Jadwal Aktif</div>
            </div>
          </button>

          {/* Step 4 */}
          <button
            onClick={() => setShowStudentShareModal(true)}
            className="p-2 rounded-xl border text-left flex items-center gap-2 bg-gradient-to-br from-indigo-950/70 to-slate-950 border-indigo-500/40 text-indigo-200 hover:border-indigo-400 transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">4</span>
            <div className="truncate">
              <div className="font-bold text-[11px] truncate">4. Bagikan Link</div>
              <div className="text-[10px] text-amber-300 truncate">QR & Link Siswa</div>
            </div>
          </button>

          {/* Step 5 */}
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
              activeTab === 'monitoring'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-black flex items-center justify-center shrink-0">5</span>
            <div className="truncate">
              <div className="font-bold text-[11px] truncate">5. Monitoring</div>
              <div className="text-[10px] opacity-75 truncate">Anti-Cheat Live</div>
            </div>
          </button>

          {/* Step 6 */}
          <button
            onClick={() => setActiveTab('results')}
            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
              activeTab === 'results'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-black flex items-center justify-center shrink-0">6</span>
            <div className="truncate">
              <div className="font-bold text-[11px] truncate">6. Rekap Nilai</div>
              <div className="text-[10px] opacity-75 truncate">{results.length} Jawaban Selesai</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-400">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'monitoring' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Live Monitoring Siswa
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'students' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Kelola Kelas & Siswa Massal
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'questions' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Bank Soal & AI Generator
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'schedules' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" /> Pengaturan Ujian & Jadwal
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'results' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Hasil Nilai & Rekap PDF
        </button>

        <button
          onClick={() => setActiveTab('spreadsheet')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'spreadsheet' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" /> Google Spreadsheet Sync
        </button>

        <button
          onClick={() => setActiveTab('school_profile')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'school_profile' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <School className="w-4 h-4" /> Data Sekolah
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" /> Pengaturan & Admin 1x Pakai
        </button>
      </div>

      {/* TAB 1: LIVE MONITORING SISWA */}
      {activeTab === 'monitoring' && (() => {
        const completedCount = students.filter(
          (s) =>
            s.status === 'COMPLETED' ||
            results.some(
              (r) =>
                r.studentId === s.id ||
                r.studentNisn === s.nisn ||
                (r.studentName && r.studentName.trim().toLowerCase() === s.name.trim().toLowerCase())
            )
        ).length;
        const finalCompletedCount = Math.max(completedCount, results.length);

        const filteredStudentsForMonitoring = students.filter((s) => {
          const matchSearch =
            !searchQuery.trim() ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.nisn.includes(searchQuery) ||
            (s.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.className || '').toLowerCase().includes(searchQuery.toLowerCase());

          const matchClass =
            monitoringClassFilter === 'all' ||
            s.classId === monitoringClassFilter ||
            s.className === monitoringClassFilter;

          const studentResult = results.find(
            (r) =>
              r.studentId === s.id ||
              r.studentNisn === s.nisn ||
              (r.studentName && r.studentName.trim().toLowerCase() === s.name.trim().toLowerCase())
          );
          const hasCompleted = Boolean(studentResult) || s.status === 'COMPLETED';

          let matchStatus = true;
          if (monitoringStatusFilter === 'blocked') {
            matchStatus = Boolean(s.isBlocked);
          } else if (monitoringStatusFilter === 'completed') {
            matchStatus = hasCompleted;
          } else if (monitoringStatusFilter === 'exam') {
            matchStatus = s.status === 'EXAM' && !s.isBlocked && !hasCompleted;
          } else if (monitoringStatusFilter === 'online') {
            matchStatus = s.status === 'ONLINE' && !s.isBlocked && !hasCompleted;
          }

          return matchSearch && matchClass && matchStatus;
        });

        return (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Siswa Terdaftar</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">{students.length} Siswa</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Siswa Selesai Ujian</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{finalCompletedCount} Siswa</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Siswa Terdeteksi Diblokir</div>
                <div className="text-2xl font-black text-rose-400 mt-1">{students.filter((s) => s.isBlocked).length} Siswa</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Soal Bank Soal</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{questions.length} Soal</div>
              </div>
            </div>

            {/* Student Live Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>Daftar Status Siswa Real-Time & Hasil Ujian</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitoring keaktifan siswa, pengerjaan ujian, nilai evaluasi real-time, reset password PIN, dan status anti-cheat.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Class Filter */}
                  <select
                    value={monitoringClassFilter}
                    onChange={(e) => setMonitoringClassFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="all">Semua Kelas ({classes.length})</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={monitoringStatusFilter}
                    onChange={(e) => setMonitoringStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="all">Semua Status Live</option>
                    <option value="completed">🏁 Selesai Ujian</option>
                    <option value="exam">🟡 Sedang Ujian</option>
                    <option value="online">🟢 Online / Siap</option>
                    <option value="blocked">🔴 Diblokir</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />

                  <button
                    onClick={() => exportResultsCSV(results)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    title="Export Seluruh Hasil Ujian ke CSV"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">NISN / Username</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Status Live</th>
                      <th className="p-3">Hasil / Nilai Ujian</th>
                      <th className="p-3">Pelanggaran</th>
                      <th className="p-3 text-right">Aksi Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudentsForMonitoring.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 text-xs italic">
                          Tidak ada data siswa yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStudentsForMonitoring.map((s) => {
                        const studentResult = results.find(
                          (r) =>
                            r.studentId === s.id ||
                            r.studentNisn === s.nisn ||
                            (r.studentName && r.studentName.trim().toLowerCase() === s.name.trim().toLowerCase())
                        );
                        const hasCompleted = Boolean(studentResult) || s.status === 'COMPLETED';

                        return (
                          <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-bold text-white">{s.name}</td>
                            <td className="p-3 text-slate-400 font-mono">
                              {s.nisn} ({s.username})
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                                {s.className}
                              </span>
                            </td>
                            <td className="p-3">
                              {s.isBlocked ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1.5 w-fit">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                  🔴 Diblokir
                                </span>
                              ) : hasCompleted ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 w-fit">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  🏁 Selesai Ujian
                                </span>
                              ) : s.status === 'EXAM' ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5 w-fit animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                  🟡 Sedang Ujian
                                </span>
                              ) : s.status === 'ONLINE' ? (
                                <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-1.5 w-fit">
                                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                  🟢 Online / Siap
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold flex items-center gap-1.5 w-fit">
                                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                  🟢 Aktif Normal
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {studentResult ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-emerald-400">{studentResult.score}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                      studentResult.isPassed
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    }`}
                                  >
                                    {studentResult.isPassed ? 'LULUS' : 'TIDAK LULUS'}
                                  </span>
                                </div>
                              ) : hasCompleted ? (
                                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                </span>
                              ) : s.status === 'EXAM' ? (
                                <span className="text-amber-400 font-bold text-xs animate-pulse">
                                  Sedang mengerjakan...
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs italic">- Belum Ujian -</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`font-bold ${s.violationsCount ? 'text-rose-400' : 'text-slate-400'}`}>
                                {s.violationsCount || 0}x Pelanggaran
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end items-center gap-1.5">
                                {studentResult && (
                                  <button
                                    onClick={() => downloadExamResultPDF(studentResult, settings)}
                                    className="p-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 rounded-lg text-indigo-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                                    title="Cetak/Download Lembar Hasil Ujian (PDF)"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="hidden xl:inline">Cetak PDF</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleResetStudentPasswordAdmin(s)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-400 transition-colors"
                                  title="Reset Password PIN Siswa"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                {s.isBlocked && (
                                  <button
                                    onClick={() => handleUnblockStudent(s)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow transition-colors"
                                  >
                                    Buka Blokir
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteStudent(s.id)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-900 rounded-lg text-rose-400 transition-colors"
                                  title="Hapus Siswa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 2: KELOLA KELAS & SISWA MASSAL */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Class Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>{editingClassId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</span>
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Nama Kelas / Rombel</label>
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  placeholder="Contoh: X MIPA 1"
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  value={classDescInput}
                  onChange={(e) => setClassDescInput(e.target.value)}
                  placeholder="Contoh: Kelas IPA Pagi"
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
              >
                {editingClassId ? 'Simpan Perubahan Kelas' : 'Tambah Kelas'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto">
              <div className="text-xs font-bold text-slate-400">Daftar Kelas Aktif:</div>
              {classes.map((c) => (
                <div key={c.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.description || 'Tanpa deskripsi'}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditClass(c)} className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-400">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteClass(c.id)} className="p-1 bg-slate-800 hover:bg-rose-900 rounded text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 & 3: Student Management & Excel Import */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form Input Student Individual or Mass Excel */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Input Siswa Individual / Upload Excel Massal</span>
                </h3>

                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadStudentTemplate}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors"
                    title="Download file template Excel/CSV yang siap diisi"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download Format Excel</span>
                  </button>

                  <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Excel (.xlsx/.csv)</span>
                    <input type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleMassExcelUpload} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleExportStudentsCSV}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Data
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQrPrintModal(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Kartu QR
                  </button>
                </div>
              </div>

              {/* Excel/CSV Format Guidance & Code Preview Block */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white text-sm block">Format Template Data Siswa (.csv / .xlsx)</span>
                      <span className="text-[11px] text-slate-400">Gunakan struktur kolom di bawah ini untuk impor massal data siswa secara otomatis</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyStudentTemplate}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
                      title="Salin isi template CSV ke clipboard"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isTemplateCopied ? 'Tersalin!' : 'Salin Text CSV'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadStudentTemplate}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors"
                      title="Unduh file template .csv langsung"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh File Template (.csv)</span>
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preview Isi Format File CSV:</div>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
{getStudentTemplateCSVString()}
                  </pre>
                </div>
              </div>

              {/* Individual Student Form */}
              <form onSubmit={handleSaveStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: Ahmad Rizky"
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">NISN Siswa</label>
                  <input
                    type="text"
                    value={studentNisn}
                    onChange={(e) => setStudentNisn(e.target.value)}
                    placeholder="Contoh: 0051234567"
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Pilih Kelas</label>
                  <select
                    value={studentClassId}
                    onChange={(e) => setStudentClassId(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Username (Opsional)</label>
                  <input
                    type="text"
                    value={studentUser}
                    onChange={(e) => setStudentUser(e.target.value)}
                    placeholder="Auto-generate"
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Password PIN (Opsional)</label>
                  <input
                    type="text"
                    value={studentPass}
                    onChange={(e) => setStudentPass(e.target.value)}
                    placeholder="Bawaan: 123"
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
                  >
                    {editingStudentId ? 'Simpan Siswa' : '+ Tambah Siswa'}
                  </button>
                </div>
              </form>
            </div>

            {/* Students Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-200">Daftar Akun Seluruh Siswa ({students.length} Siswa)</div>
                {students.length > 0 && (
                  <button
                    onClick={handleDeleteAllStudents}
                    className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua Siswa</span>
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">NISN</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Password</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{s.name}</td>
                        <td className="p-3 font-mono text-slate-400">{s.nisn}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">{s.className}</span></td>
                        <td className="p-3 font-mono">{s.username}</td>
                        <td className="p-3 font-mono">{s.password}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedStudentForQr(s);
                                setShowQrPrintModal(true);
                              }}
                              title="Lihat & Cetak Kartu QR Siswa Ini"
                              className="p-1 bg-slate-800 hover:bg-amber-950 rounded text-amber-400 transition-colors"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleResetStudentPasswordAdmin(s)} title="Reset Password PIN Siswa" className="p-1 bg-slate-800 hover:bg-indigo-900 rounded text-indigo-400">
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleEditStudent(s)} title="Edit Data Siswa" className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-400">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteStudent(s.id)} title="Hapus Siswa" className="p-1 bg-slate-800 hover:bg-rose-900 rounded text-rose-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: BANK SOAL, AI GENERATOR & UPLOAD WORD */}
      {activeTab === 'questions' && (
        <div className="space-y-6">

          {/* Banner Import Word Soal & Template Download */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Upload File Soal dari Word (.docx / .txt)</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Otomatis Extract Opsi & Kunci
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Upload dokumen Word (.docx) atau Text (.txt) yang berisi daftar soal. Aplikasi akan otomatis mengurai teks pertanyaan, opsi pilihan ganda (A-E), serta kunci jawabannya secara instan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
                <button
                  type="button"
                  onClick={downloadWordQuestionTemplate}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition-colors shadow"
                  title="Unduh file contoh format penulisan soal Word/TXT"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Format Word</span>
                </button>

                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]">
                  <Upload className="w-4 h-4" />
                  <span>{isWordUploading ? 'Memproses File...' : 'Upload File Soal (.docx / .txt)'}</span>
                  <input
                    type="file"
                    accept=".docx,.doc,.txt"
                    disabled={isWordUploading}
                    onChange={handleWordQuestionUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Format Reference Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Panduan Format Penulisan Soal di File Word:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-[11px] font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-amber-300 font-bold font-sans block mb-1">Contoh Soal Pilihan Ganda (PG):</span>
                  <pre className="text-slate-300 leading-tight whitespace-pre-wrap">
{`1. Ibu kota negara Indonesia adalah...
A. Jakarta
B. Surabaya
C. Bandung
D. Medan
E. Makassar
Kunci: A`}
                  </pre>
                </div>
                <div>
                  <span className="text-emerald-300 font-bold font-sans block mb-1">Contoh Soal Essay:</span>
                  <pre className="text-slate-300 leading-tight whitespace-pre-wrap">
{`2. Jelaskan pengertian Fotosintesis!
Kunci Essay: Proses pembuatan makanan oleh tumbuhan hijau dengan bantuan sinar matahari.`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL ATUR & EDIT POIN SOAL MASSAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Atur & Edit Poin Soal Massal</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Serentak
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ubah bobot nilai/poin seluruh soal yang sudah di-upload secara serentak atau atur poin instan per soal.
                  </p>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Total Soal: <strong className="text-white">{questions.length}</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 font-bold">Total Max Skor: {questions.reduce((acc, q) => acc + q.points, 0)} Poin</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Option 1: Set Poin PG */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-extrabold text-amber-400 flex items-center justify-between mb-1">
                    <span>1. Poin Soal PG</span>
                    <span className="text-[10px] text-slate-400 font-normal">({questions.filter(q => q.type === 'multiple_choice').length} Soal)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Terapkan bobot nilai ini ke seluruh soal Pilihan Ganda.</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={massPgPoints}
                    onChange={(e) => setMassPgPoints(Number(e.target.value))}
                    className="w-16 p-2 bg-slate-900 border border-slate-700 rounded-xl text-center font-bold text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyMassPgPoints}
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] rounded-xl shadow transition-colors"
                  >
                    Set All PG
                  </button>
                </div>
              </div>

              {/* Option 2: Set Poin Essay */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-extrabold text-indigo-400 flex items-center justify-between mb-1">
                    <span>2. Poin Soal Essay</span>
                    <span className="text-[10px] text-slate-400 font-normal">({questions.filter(q => q.type === 'essay').length} Soal)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Terapkan bobot nilai ini ke seluruh soal Essay / Uraian.</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={massEssayPoints}
                    onChange={(e) => setMassEssayPoints(Number(e.target.value))}
                    className="w-16 p-2 bg-slate-900 border border-slate-700 rounded-xl text-center font-bold text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyMassEssayPoints}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl shadow transition-colors"
                  >
                    Set All Essay
                  </button>
                </div>
              </div>

              {/* Option 3: Set Poin Sama Semua Soal */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-extrabold text-sky-400 flex items-center justify-between mb-1">
                    <span>3. Poin Semua Soal</span>
                    <span className="text-[10px] text-slate-400 font-normal">({questions.length} Soal)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Set nilai poin yang sama untuk SELURUH soal di bank soal.</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={massAllPoints}
                    onChange={(e) => setMassAllPoints(Number(e.target.value))}
                    className="w-16 p-2 bg-slate-900 border border-slate-700 rounded-xl text-center font-bold text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyMassAllPoints}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] rounded-xl shadow transition-colors"
                  >
                    Set Sama Semua
                  </button>
                </div>
              </div>

              {/* Option 4: Auto Calculate Target 100 */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-extrabold text-emerald-400 flex items-center justify-between mb-1">
                    <span>4. Target Nilai 100</span>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase">Otomatis</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Hitung & bagi proporsi poin otomatis agar total nilai max = 100.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoCalculateTarget100}
                  className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hitung Poin Target 100</span>
                </button>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: AI Gemini Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>AI Question Generator (Gemini)</span>
            </div>

            <p className="text-xs text-slate-400">
              Ketikkan materi pelajaran atau tempelkan teks dari file Word/PDF untuk langsung digenerate menjadi soal pilihan ganda & essay siap pakai!
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Mata Pelajaran</label>
                <input
                  type="text"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  placeholder="Contoh: Biologi SMA Kelas X"
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Teks Materi / Referensi Soal</label>
                <textarea
                  rows={5}
                  value={aiMaterialText}
                  onChange={(e) => setAiMaterialText(e.target.value)}
                  placeholder="Tempelkan paragraf materi di sini..."
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Jumlah PG</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={aiMcCount}
                    onChange={(e) => setAiMcCount(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Jumlah Essay</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={aiEssayCount}
                    onChange={(e) => setAiEssayCount(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <button
                disabled={isAiLoading}
                onClick={handleGenerateQuestionsAI}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{isAiLoading ? 'Gemini Sedang Mengolah Soal...' : 'Generate Soal Otomatis dengan AI'}</span>
              </button>

              {aiSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                  {aiSuccessMessage}
                </div>
              )}
            </div>
          </div>

          {/* Column 2 & 3: Manual Question Form & List */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>{editingQuestionId ? 'Edit Soal' : 'Input Soal Manual'}</span>
              </h3>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300">Tipe Soal</label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value as any)}
                      className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="multiple_choice">Pilihan Ganda (A-E)</option>
                      <option value="essay">Essay / Uraian</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Poin Soal</label>
                    <input
                      type="number"
                      value={qPoints}
                      onChange={(e) => setQPoints(Number(e.target.value))}
                      className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Pertanyaan / Teks Soal</label>
                  <textarea
                    rows={3}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Tuliskan teks pertanyaan di sini..."
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  ></textarea>
                </div>

                {qType === 'multiple_choice' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Opsi Pilihan Jawaban (A-E):</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input type="text" placeholder="Opsi A" value={qOptA} onChange={(e) => setQOptA(e.target.value)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                      <input type="text" placeholder="Opsi B" value={qOptB} onChange={(e) => setQOptB(e.target.value)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                      <input type="text" placeholder="Opsi C" value={qOptC} onChange={(e) => setQOptC(e.target.value)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                      <input type="text" placeholder="Opsi D" value={qOptD} onChange={(e) => setQOptD(e.target.value)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                      <input type="text" placeholder="Opsi E" value={qOptE} onChange={(e) => setQOptE(e.target.value)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-amber-300">Kunci Jawaban:</label>
                        <select
                          value={qCorrectKey}
                          onChange={(e) => setQCorrectKey(e.target.value)}
                          className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-bold"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-300">Pedoman Kunci Jawaban Essay (Rubrik Guru)</label>
                    <textarea
                      rows={2}
                      value={qEssayGuide}
                      onChange={(e) => setQEssayGuide(e.target.value)}
                      placeholder="Pedoman penilaian essay..."
                      className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    ></textarea>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  {editingQuestionId ? 'Simpan Perubahan Soal' : '+ Simpan ke Bank Soal'}
                </button>
              </form>
            </div>

            {/* Questions Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-200">Daftar Soal di Bank Soal ({questions.length} Soal)</div>
                {questions.length > 0 && (
                  <button
                    onClick={handleDeleteAllQuestions}
                    className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Bank Soal</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">Soal #{idx + 1} ({q.type === 'multiple_choice' ? 'PG' : 'Essay'})</span>
                      <div className="flex items-center gap-2">
                        {/* Interactive Inline Point Editor */}
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1" title="Ubah poin soal ini secara instan">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Poin:</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.points}
                            onChange={(e) => handleInlineUpdateQuestionPoints(q.id, Number(e.target.value))}
                            className="w-12 bg-slate-950 border border-amber-500/40 focus:border-amber-400 text-amber-300 font-black text-xs text-center rounded-lg py-0.5 px-1 outline-none"
                          />
                        </div>

                        <button onClick={() => handleEditQuestion(q)} title="Edit Seluruh Soal" className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-400 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteQuestion(q.id)} title="Hapus Soal" className="p-1.5 bg-slate-800 hover:bg-rose-900 rounded-lg text-rose-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-200 leading-relaxed">{q.questionText}</div>
                    {q.type === 'multiple_choice' && (
                      <div className="text-[11px] text-emerald-400 font-bold">Kunci: Opsi {q.correctKey}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
      )}

      {/* TAB 4: PENGATURAN UJIAN & JADWAL */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Create Schedule */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Buat Jadwal Ujian Aktif</span>
            </h3>

            <form onSubmit={handleSaveExamSchedule} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Judul Ujian</label>
                <input
                  type="text"
                  value={exTitle}
                  onChange={(e) => setExTitle(e.target.value)}
                  placeholder="Contoh: Ujian Tengah Semester Pengetahuan Umum"
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Mata Pelajaran</label>
                <input
                  type="text"
                  value={exSubject}
                  onChange={(e) => setExSubject(e.target.value)}
                  placeholder="Contoh: Pengetahuan Umum"
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Target Kelas</label>
                <select
                  value={exTargetClassId}
                  onChange={(e) => setExTargetClassId(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="all">Semua Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Durasi Pengerjaan (Menit)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={exDuration}
                  onChange={(e) => setExDuration(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              {/* Anti-Cheat Toggles */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-300">Fitur Anti-Nyontek Ujian:</div>
                
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={exRandomQ} onChange={(e) => setExRandomQ(e.target.checked)} className="rounded text-indigo-600" />
                  <span>Acak Urutan Soal (Fisher-Yates)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={exRandomOpt} onChange={(e) => setExRandomOpt(e.target.checked)} className="rounded text-indigo-600" />
                  <span>Acak Pilihan Jawaban (A-E)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={exCamera} onChange={(e) => setExCamera(e.target.checked)} className="rounded text-indigo-600" />
                  <span>Kamera Guard Pengawas (Snapshot Periodik)</span>
                </label>

                {exCamera && (
                  <div className="pl-6">
                    <label className="text-[11px] text-slate-400">Interval Snapshot Kamera:</label>
                    <select
                      value={exCameraInterval}
                      onChange={(e) => setExCameraInterval(Number(e.target.value))}
                      className="w-full mt-0.5 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value={1}>Setiap 1 Menit</option>
                      <option value={2}>Setiap 2 Menit</option>
                      <option value={3}>Setiap 3 Menit</option>
                      <option value={5}>Setiap 5 Menit</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Simpan Jadwal Ujian
              </button>
            </form>
          </div>

          {/* List Exam Schedules */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Daftar Jadwal Ujian Aktif ({exams.length})</h3>
                {exams.length > 0 && (
                  <button
                    onClick={handleDeleteAllExamSchedules}
                    className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua Jadwal</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {exams.map((ex) => (
                  <div key={ex.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{ex.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Mapel: {ex.subject} | Target: {ex.targetClassName} | Durasi: {ex.durationMinutes} Menit
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">
                        ✔ Anti-Cheat Active • {ex.questions?.length || 0} Soal • Kamera Guard ({ex.cameraIntervalMinutes}m)
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteExamSchedule(ex.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-900 rounded-xl text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: HASIL NILAI & REKAP PDF */}
      {activeTab === 'results' && (() => {
        const filteredExamResults = results.filter((r) => {
          const matchClass = resultFilterClass === 'all' || r.className === resultFilterClass;
          const matchSubject = resultFilterSubject === 'all' || r.subject === resultFilterSubject || r.examTitle === resultFilterSubject;
          const matchQuery = !resultSearchQuery.trim() ||
            (r.studentName || '').toLowerCase().includes(resultSearchQuery.toLowerCase()) ||
            (r.studentNisn || '').includes(resultSearchQuery) ||
            (r.className || '').toLowerCase().includes(resultSearchQuery.toLowerCase());
          return matchClass && matchSubject && matchQuery;
        });

        const uniqueSubjectsList = Array.from(new Set(results.map((r) => r.subject).filter(Boolean)));

        const isAllSelected = filteredExamResults.length > 0 && filteredExamResults.every((r) => selectedResultIds.includes(r.id));

        const toggleSelectAll = () => {
          if (isAllSelected) {
            setSelectedResultIds([]);
          } else {
            setSelectedResultIds(filteredExamResults.map((r) => r.id));
          }
        };

        const toggleSelectRow = (id: string) => {
          if (selectedResultIds.includes(id)) {
            setSelectedResultIds(selectedResultIds.filter((i) => i !== id));
          } else {
            setSelectedResultIds([...selectedResultIds, id]);
          }
        };

        const handleBatchPrintAll = () => {
          if (filteredExamResults.length === 0) {
            alert('Tidak ada data hasil nilai ujian yang sesuai dengan filter saat ini.');
            return;
          }
          const filterTitle = resultFilterClass !== 'all' ? `Kelas ${resultFilterClass}` : 'Semua Kelas';
          downloadBatchExamResultsPDF(
            filteredExamResults,
            settings,
            `Laporan Rekapitulasi Hasil Ujian - ${filterTitle}`
          );
        };

        const handleBatchPrintSelected = () => {
          const selectedList = results.filter((r) => selectedResultIds.includes(r.id));
          if (selectedList.length === 0) {
            alert('Silakan centang setidaknya satu siswa menggunakan checkbox tabel terlebih dahulu.');
            return;
          }
          downloadBatchExamResultsPDF(
            selectedList,
            settings,
            `Laporan Hasil Ujian (${selectedList.length} Siswa Terpilih)`
          );
        };

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5">
            
            {/* Header & Main Batch Actions */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Hasil Nilai Evaluasi & Rekapitulasi PDF</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Cetak Individual & Batch Massal
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Cetak lembar hasil evaluasi siswa secara individual atau secara massal (batch PDF multi-halaman) lengkap dengan audit proctoring kamera & rekap nilai kolektif.
                </p>
              </div>

              {/* PDF Batch Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {selectedResultIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchPrintSelected}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                    title="Cetak PDF untuk siswa yang dicentang saja"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak PDF Terpilih ({selectedResultIds.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBatchPrintAll}
                  disabled={filteredExamResults.length === 0}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                  title="Cetak seluruh hasil nilai ujian ke dokumen PDF multi-halaman"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekap PDF Massal ({filteredExamResults.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportResultsCSV(filteredExamResults)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>

                {results.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllResults}
                    className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter Kelas:</label>
                <select
                  value={resultFilterClass}
                  onChange={(e) => setResultFilterClass(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="all">Semua Kelas ({classes.length})</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter Mata Pelajaran / Ujian:</label>
                <select
                  value={resultFilterSubject}
                  onChange={(e) => setResultFilterSubject(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="all">Semua Mata Pelajaran</option>
                  {uniqueSubjectsList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Cari Nama / NISN Siswa:</label>
                <input
                  type="text"
                  placeholder="Ketik nama atau NISN..."
                  value={resultSearchQuery}
                  onChange={(e) => setResultSearchQuery(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Results Table with Checkbox */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        title="Pilih Semua Siswa Terfilter"
                        className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">NISN / Kelas</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3 text-center">Nilai</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Integrity</th>
                    <th className="p-3 text-right">Aksi Laporan PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExamResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                        Belum ada data hasil ujian yang sesuai dengan kriteria pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredExamResults.map((r) => {
                      const isSelected = selectedResultIds.includes(r.id);
                      return (
                        <tr key={r.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-950/30' : ''}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(r.id)}
                              className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-bold text-white">{r.studentName}</td>
                          <td className="p-3 text-slate-400">{r.studentNisn} ({r.className})</td>
                          <td className="p-3 font-medium text-slate-200">{r.subject}</td>
                          <td className="p-3 text-center font-black text-amber-400 text-sm">{r.score}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {r.isPassed ? 'LULUS' : 'REMIDIAL'}
                            </span>
                          </td>
                          <td className="p-3 text-center text-slate-400">
                            {(r.antiCheatViolations || []).length > 0 ? (
                              <span className="text-rose-400 font-bold">⚠ {r.antiCheatViolations.length}x</span>
                            ) : (
                              <span className="text-emerald-400 font-medium">✔ Aman</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => downloadExamResultPDF(r, settings)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-sm hover:scale-[1.02]"
                                title="Download / Cetak PDF Laporan Siswa Ini"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteResult(r.id)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-900 rounded-xl text-rose-400 transition-colors"
                                title="Hapus Hasil Ujian Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 7: INPUT DATA SEKOLAH / PROFIL SEKOLAH & KOP SURAT */}
      {activeTab === 'school_profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Input Data Sekolah */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-500/30">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Profil & Data Identitas Sekolah / Madrasah</h3>
                    <p className="text-xs text-slate-400">
                      Lengkapi data sekolah untuk kebutuhan Kop Surat Resmi PDF, Kartu Login Siswa, dan Header Sistem Ujian.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    saveAppSettings(settings);
                    alert('BERHASIL: Data Sekolah berhasil disimpan secara permanen!');
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Sekolah */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nama Sekolah / Madrasah <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.schoolName || ''}
                    onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                    placeholder="Contoh: SMA Negeri 1 Utama / SMAS DWP"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* NPSN */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    NPSN (Nomor Pokok Sekolah Nasional)
                  </label>
                  <input
                    type="text"
                    value={settings.npsn || ''}
                    onChange={(e) => setSettings({ ...settings, npsn: e.target.value })}
                    placeholder="Contoh: 20401892"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Kota / Kab Tempat Ujian */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kota / Kabupaten Ujian (Tanda Tangan Surat)
                  </label>
                  <input
                    type="text"
                    value={settings.examCity || ''}
                    onChange={(e) => setSettings({ ...settings, examCity: e.target.value })}
                    placeholder="Contoh: Makassar / Tana Toraja"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Alamat Sekolah */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Alamat Lengkap Sekolah
                  </label>
                  <textarea
                    rows={2}
                    value={settings.schoolAddress || ''}
                    onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
                    placeholder="Jl. Pendidikan No. 45, Kompleks Pendidikan Utama, Kota Makassar"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Telephone */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nomor Telepon Sekolah
                  </label>
                  <input
                    type="text"
                    value={settings.schoolPhone || ''}
                    onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value })}
                    placeholder="(0411) 872190"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Email Resmi Sekolah
                  </label>
                  <input
                    type="email"
                    value={settings.schoolEmail || ''}
                    onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value })}
                    placeholder="info@smanutama.sch.id"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Tahun Ajaran */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={settings.academicYear || ''}
                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                    placeholder="2025/2026"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Semester */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Semester
                  </label>
                  <select
                    value={settings.semester || 'Genap'}
                    onChange={(e) => setSettings({ ...settings, semester: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>

                {/* Nama Kepala Sekolah */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nama Kepala Sekolah / Madrasah
                  </label>
                  <input
                    type="text"
                    value={settings.headmasterName || ''}
                    onChange={(e) => setSettings({ ...settings, headmasterName: e.target.value })}
                    placeholder="Drs. H. Muhammad Ridwan, M.Pd."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* NIP Kepala Sekolah */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={settings.headmasterNip || ''}
                    onChange={(e) => setSettings({ ...settings, headmasterNip: e.target.value })}
                    placeholder="19690815 199403 1 005"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Ukuran Kertas Default PDF */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Ukuran Kertas Default Cetak Dokumen PDF / Kop Surat <span className="text-amber-400 font-extrabold">(Rekomendasi: F4)</span>
                  </label>
                  <select
                    value={settings.defaultPaperSize || 'F4'}
                    onChange={(e) => setSettings({ ...settings, defaultPaperSize: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none font-bold"
                  >
                    <option value="F4">F4 / Folio (215 x 330 mm) — Standard Sekolah & Madrasah</option>
                    <option value="A4">A4 (210 x 297 mm) — Standard International</option>
                    <option value="Letter">Letter (216 x 279 mm)</option>
                    <option value="Legal">Legal (216 x 356 mm)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ukuran kertas yang dipilih akan digunakan secara otomatis pada saat mencetak Laporan Hasil Nilai Ujian PDF dan dokumen resmi lainnya.
                  </p>
                </div>

                {/* Upload Logo Sekolah */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Upload Foto / Gambar Logo Sekolah
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all">
                      <Upload className="w-4 h-4" />
                      <span>Pilih File Logo (PNG/JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            alert('Ukuran gambar logo maksimal 2MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              const updated = { ...settings, schoolLogo: reader.result, logoUrl: reader.result };
                              setSettings(updated);
                              saveAppSettings(updated);
                              alert('Logo sekolah berhasil diunggah!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>

                    {settings.schoolLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...settings, schoolLogo: '', logoUrl: '' };
                          setSettings(updated);
                          saveAppSettings(updated);
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold underline"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    saveAppSettings(settings);
                    alert('BERHASIL: Seluruh Data Profil Sekolah berhasil diperbarui!');
                  }}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
                >
                  💾 Simpan Perubahan Data Sekolah
                </button>
              </div>
            </div>

            {/* Visual Live Preview KOP Surat Resmi */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4" />
                    <span>Pratinjau Kop Surat Resmi PDF</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Kertas: {settings.defaultPaperSize || 'F4'} ({settings.defaultPaperSize === 'A4' ? '210 x 297 mm' : settings.defaultPaperSize === 'Letter' ? '216 x 279 mm' : settings.defaultPaperSize === 'Legal' ? '216 x 356 mm' : '215 x 330 mm'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Berikut tampilan simulasi Kop Surat Resmi yang akan otomatis tercetak pada dokumen PDF Laporan Hasil Ujian & Kartu Login Siswa:
                </p>

                {/* Paper Preview Card */}
                <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-300 space-y-3 font-sans">
                  {/* Kop Header */}
                  <div className="flex items-center justify-between gap-3 text-center border-b-2 border-double border-slate-900 pb-3">
                    {settings.schoolLogo ? (
                      <img
                        src={settings.schoolLogo}
                        alt="Logo Sekolah"
                        className="w-12 h-12 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-800 font-black text-lg flex items-center justify-center shrink-0 border border-indigo-300">
                        {settings.schoolName ? settings.schoolName.charAt(0) : 'S'}
                      </div>
                    )}

                    <div className="flex-1 text-center">
                      <div className="text-[8px] font-bold text-slate-600 tracking-wider uppercase">
                        KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET DAN TEKNOLOGI
                      </div>
                      <div className="text-sm font-black text-indigo-900 uppercase tracking-tight">
                        {settings.schoolName || 'SMA NEGERI 1 UTAMA'}
                      </div>
                      <div className="text-[9px] text-slate-700 leading-tight">
                        {settings.schoolAddress || 'Jl. Pendidikan No. 45, Kota Makassar'}
                        {settings.npsn ? ` | NPSN: ${settings.npsn}` : ''}
                      </div>
                      <div className="text-[8px] text-slate-500">
                        {settings.schoolPhone ? `Telp: ${settings.schoolPhone}` : ''} 
                        {settings.schoolEmail ? ` | Email: ${settings.schoolEmail}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Sample Banner Body */}
                  <div className="bg-slate-100 p-2 rounded text-center text-[10px] font-bold text-slate-800 border border-slate-300">
                    LAPORAN HASIL EVALUASI EVALUASI UJIAN (T.A. {settings.academicYear || '2025/2026'})
                  </div>

                  {/* Sample Signature Box */}
                  <div className="grid grid-cols-2 text-[9px] text-slate-800 pt-4 text-center">
                    <div>
                      <div>Mengetahui,</div>
                      <div className="font-bold">Kepala Sekolah,</div>
                      <div className="h-10"></div>
                      <div className="font-bold underline">{settings.headmasterName || 'Drs. H. Muhammad Ridwan, M.Pd.'}</div>
                      <div className="text-[8px] text-slate-500">NIP. {settings.headmasterNip || '19690815 199403 1 005'}</div>
                    </div>
                    <div>
                      <div>{settings.examCity || 'Makassar'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="font-bold">Panitia Ujian,</div>
                      <div className="h-10"></div>
                      <div className="font-bold">( ___________________ )</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="text-amber-300 font-bold">ℹ Catatan Integrasi:</div>
                  <p>Data sekolah yang Anda simpan akan secara otomatis digunakan di:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400 pl-1">
                    <li>Kop Surat Dokumen Laporan Hasil Ujian PDF</li>
                    <li>Lembar Cetak Kartu QR Code Peserta Ujian</li>
                    <li>Header Portal Login Siswa & Dashboard Utama</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 8: GOOGLE SPREADSHEET AUTOMATIC SYNC CENTER */}
      {activeTab === 'spreadsheet' && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <span>Google Spreadsheet Auto-Sync Center</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Real-time API & Webhook
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kirimkan dan simpan hasil nilai ujian siswa secara otomatis dan permanen ke Google Spreadsheet & Google Drive.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2.5 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs">
                <div className={`w-2.5 h-2.5 rounded-full ${settings.googleSpreadsheetId || settings.googleSheetWebhookUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
                <span className="font-bold text-slate-300">
                  {settings.googleSpreadsheetId || settings.googleSheetWebhookUrl ? 'Terhubung ke Google Spreadsheet' : 'Belum Konfigurasi Target Sheet'}
                </span>
              </div>
            </div>

            {/* Quick Action Alert */}
            {syncSheetStatusMsg && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
                <span>{syncSheetStatusMsg}</span>
                <button type="button" onClick={() => setSyncSheetStatusMsg('')} className="text-slate-400 hover:text-white font-bold">×</button>
              </div>
            )}

            {/* Configuration Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Box 1: Google Spreadsheet ID / Link */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-amber-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>1. ID / Link Google Spreadsheet Target</span>
                  </label>
                  {settings.googleSpreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${settings.googleSpreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                    >
                      <span>Buka Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <input
                  type="text"
                  value={settings.googleSpreadsheetId || ''}
                  onChange={(e) => {
                    let val = e.target.value.trim();
                    // Auto extract ID if full Google Sheets URL is pasted
                    if (val.includes('/spreadsheets/d/')) {
                      const match = val.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                      if (match && match[1]) val = match[1];
                    }
                    setSettings({ ...settings, googleSpreadsheetId: val });
                  }}
                  placeholder="Contoh ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                />

                <p className="text-[10px] text-slate-500">
                  Tempel ID Spreadsheet atau paste seluruh URL Google Sheet dari browser Anda.
                </p>
              </div>

              {/* Box 2: Google Apps Script Webhook URL */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    <span>2. Webhook URL Google Apps Script</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAppsScriptCodeModal(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Kode Script</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={settings.googleSheetWebhookUrl || ''}
                  onChange={(e) => setSettings({ ...settings, googleSheetWebhookUrl: e.target.value.trim() })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-white placeholder-slate-600 focus:border-emerald-400 outline-none"
                />

                <p className="text-[10px] text-slate-500">
                  Gunakan Apps Script Webhook sebagai fallback gratis tanpa limit batas kuota.
                </p>
              </div>

            </div>

            {/* Toggle & Action Control Bar */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => {
                      const updated = { ...settings, autoSyncGoogleSheets: !(settings.autoSyncGoogleSheets ?? true) };
                      setSettings(updated);
                      saveAppSettings(updated);
                    }}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      (settings.autoSyncGoogleSheets ?? true) ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        (settings.autoSyncGoogleSheets ?? true) ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                  <div>
                    <label className="font-extrabold text-white text-xs block cursor-pointer">
                      Sinkronisasi Otomatis Setiap Siswa Selesai Ujian
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Saat aktif, setiap jawaban siswa yang di-submit langsung dikirimkan ke Google Spreadsheet.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    saveAppSettings(settings);
                    alert('Pengaturan Google Spreadsheet berhasil disimpan!');
                  }}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors border border-slate-700"
                >
                  Simpan Pengaturan
                </button>
              </div>

              {/* Master Sync Trigger Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={isSyncingSheets || results.length === 0}
                  onClick={handleSyncAllResultsToSheets}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSyncingSheets ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {isSyncingSheets
                      ? 'Memproses Sinkronisasi...'
                      : `Sinkronkan Seluruh Data Hasil Ujian (${results.length} Data) Ke Google Spreadsheet`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncingSheets(true);
                    const queueRes = await processSyncQueue();
                    setIsSyncingSheets(false);
                    alert(`Flush Offline Queue Selesai! Terproses: ${queueRes.processedCount}, Gagal/Pending: ${queueRes.errors}`);
                  }}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Flush Offline Queue</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sync Status Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Daftar Log Hasil Ujian & Status Google Spreadsheet</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300">
                    {results.length} Siswa
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Status pengiriman data hasil ujian per siswa ke target Google Spreadsheet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncAllResultsToSheets}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-amber-400 border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Ulang Semua</span>
              </button>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                Belum ada data hasil ujian siswa yang tersimpan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Siswa & NISN</th>
                      <th className="py-2.5 px-3">Kelas & Mapel</th>
                      <th className="py-2.5 px-3 text-center">Nilai</th>
                      <th className="py-2.5 px-3">Waktu Selesai</th>
                      <th className="py-2.5 px-3 text-center">Aksi Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {results.map((resItem, idx) => (
                      <tr key={resItem.id} className="hover:bg-slate-950/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white block">{resItem.studentName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">NISN: {resItem.studentNisn}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-amber-400 font-bold block">{resItem.className}</span>
                          <span className="text-[10px] text-slate-400">{resItem.subject}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-black text-emerald-400 text-sm px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            {resItem.score}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-400 font-mono">
                          {resItem.submittedAt
                            ? new Date(resItem.submittedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSyncSingleResultToSheets(resItem)}
                            className="py-1 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim ke Sheet</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CODY APPS SCRIPT WEBHOOK */}
      {showAppsScriptCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Kode Google Apps Script Auto-Sync</span>
              </h3>
              <button
                onClick={() => setShowAppsScriptCodeModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>Petunjuk Pemasangan Webhook Google Spreadsheet Gratis:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Buka Google Spreadsheet baru di browser Anda.</li>
                <li>Klik menu <strong>Ekstensi (Extensions) → Apps Script</strong>.</li>
                <li>Hapus seluruh isi kode lama, lalu <strong>Paste / Tempel kode di bawah ini</strong>:</li>
              </ol>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-56">
                <pre>{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Hasil Ujian Siswa") || ss.getSheets()[0];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Waktu Selesai (WIB)", "ID Hasil", "Nama Siswa", "NISN", "Kelas", 
        "Mata Pelajaran", "Judul Ujian", "Nilai Total / Skor", "Jumlah Benar", 
        "Jumlah Salah", "Jumlah Kosong", "Status Kelulusan", "Jumlah Pelanggaran", "Detail Pelanggaran"
      ]);
    }
    
    if (data.payload && data.payload.formattedRow) {
      sheet.appendRow(data.payload.formattedRow);
    } else if (data.payload && data.payload.result) {
      var r = data.payload.result;
      sheet.appendRow([
        r.submittedAt || new Date().toLocaleString(),
        r.id || '', r.studentName || '', r.studentNisn || '', r.className || '',
        r.subject || '', r.examTitle || '', r.score || 0, r.correctCount || 0,
        r.wrongCount || 0, r.emptyCount || 0, r.score >= 70 ? 'LULUS' : 'TIDAK LULUS',
        (r.antiCheatViolations || []).length, (r.antiCheatViolations || []).map(function(v){return v.reason}).join('; ')
      ]);
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
              </div>

              <ol start={4} className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Klik tombol <strong>Deploy → New deployment</strong>.</li>
                <li>Pilih type <strong>Web App</strong>, ubah <i>Who has access</i> menjadi <strong>Anyone</strong>.</li>
                <li>Salin Webhook URL yang dihasilkan dan tempelkan ke kolom Webhook URL di GiannaExamApk!</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const code = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Hasil Ujian Siswa") || ss.getSheets()[0];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Waktu Selesai (WIB)", "ID Hasil", "Nama Siswa", "NISN", "Kelas", 
        "Mata Pelajaran", "Judul Ujian", "Nilai Total / Skor", "Jumlah Benar", 
        "Jumlah Salah", "Jumlah Kosong", "Status Kelulusan", "Jumlah Pelanggaran", "Detail Pelanggaran"
      ]);
    }
    
    if (data.payload && data.payload.formattedRow) {
      sheet.appendRow(data.payload.formattedRow);
    } else if (data.payload && data.payload.result) {
      var r = data.payload.result;
      sheet.appendRow([
        r.submittedAt || new Date().toLocaleString(),
        r.id || '', r.studentName || '', r.studentNisn || '', r.className || '',
        r.subject || '', r.examTitle || '', r.score || 0, r.correctCount || 0,
        r.wrongCount || 0, r.emptyCount || 0, r.score >= 70 ? 'LULUS' : 'TIDAK LULUS',
        (r.antiCheatViolations || []).length, (r.antiCheatViolations || []).map(function(v){return v.reason}).join('; ')
      ]);
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                  navigator.clipboard.writeText(code);
                  alert('Kode Apps Script berhasil disalin ke clipboard!');
                }}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow"
              >
                Salin Kode Script
              </button>
              <button
                type="button"
                onClick={() => setShowAppsScriptCodeModal(false)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PENGATURAN & ONE-TIME ADMIN LOGIN */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Change Super Admin Password */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>Ubah Username & Password Admin Utama</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Nama Sekolah / Madrasah</label>
                <input
                  type="text"
                  value={settings.schoolName || ''}
                  onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="Contoh: SMA Negeri 1 Utama"
                />
                <button
                  type="button"
                  onClick={() => setActiveTab('school_profile')}
                  className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-1"
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Buka Editor Lengkap Data Sekolah & Kop Surat &rarr;</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Ukuran Kertas Default Cetak PDF</label>
                <select
                  value={settings.defaultPaperSize || 'F4'}
                  onChange={(e) => setSettings({ ...settings, defaultPaperSize: e.target.value as any })}
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
                >
                  <option value="F4">F4 / Folio (215 x 330 mm) — Standard Sekolah & Madrasah</option>
                  <option value="A4">A4 (210 x 297 mm) — Standard International</option>
                  <option value="Letter">Letter (216 x 279 mm)</option>
                  <option value="Legal">Legal (216 x 356 mm)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Username Admin Utama</label>
                <input
                  type="text"
                  value={settings.adminUsername}
                  onChange={(e) => setSettings({ ...settings, adminUsername: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Password Admin Baru</label>
                <input
                  type={showSuperAdminPass ? 'text' : 'password'}
                  value={settings.adminPassword}
                  onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Nomor WA Bantuan Admin</label>
                <input
                  type="text"
                  value={settings.waHelpNumber}
                  onChange={(e) => setSettings({ ...settings, waHelpNumber: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={() => {
                  saveAppSettings(settings);
                  alert('Pengaturan Admin Utama berhasil diperbarui!');
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow"
              >
                Simpan Pengaturan Utama
              </button>
            </div>
          </div>

          {/* One-Time Admin Login Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <span>Password Admin / Pengawas Sekali Pakai (One-Time Login)</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Nama Pengawas / Ruangan</label>
                <input
                  type="text"
                  value={otlNameInput}
                  onChange={(e) => setOtlNameInput(e.target.value)}
                  placeholder="Contoh: Pak Ahmad - Ruang 1"
                  className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={handleCreateOneTimeAdmin}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
              >
                + Buat Password Admin 1x Pakai
              </button>

              <div className="pt-2 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                <div className="text-xs font-bold text-slate-400">Daftar Akun 1x Pakai:</div>
                {(settings.oneTimeAdminLogins || []).map((o) => (
                  <div key={o.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{o.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">User: {o.username} | Pass: {o.password}</div>
                      <div className={`text-[9px] font-bold ${o.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {o.status === 'ACTIVE' ? '🟢 Belum Dipakai' : '🔴 EXPIRED (Sudah Dipakai)'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`https://wa.me/?text=Halo%20${encodeURIComponent(o.name)},%20akun%20login%20Admin%201x%20Pakai:%20Username:%20${o.username},%20Password:%20${o.password}.%20Hanya%20bisa%201x%20login.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                      >
                        Kirim WA
                      </a>
                      <button onClick={() => handleResetOtl(o)} className="p-1.5 bg-amber-500 text-slate-950 rounded text-[10px] font-bold">
                        Reset
                      </button>
                      <button
                        onClick={() => handleDeleteOtl(o.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900 text-rose-400 rounded transition-colors"
                        title="Hapus Akun 1x Pakai"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* PRINT MASS / INDIVIDUAL QR LOGIN CARDS MODAL */}
      {showQrPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl print:max-w-none print:max-h-none print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {selectedStudentForQr ? `Kartu QR Ujian - ${selectedStudentForQr.name}` : 'Cetak Kartu Login QR Code Peserta Ujian'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Class Option */}
                <select
                  value={qrClassFilter}
                  onChange={(e) => {
                    setQrClassFilter(e.target.value);
                    setSelectedStudentForQr(null);
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="all">Semua Kelas ({students.length} Siswa)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name}
                    </option>
                  ))}
                </select>

                {selectedStudentForQr && (
                  <button
                    onClick={() => setSelectedStudentForQr(null)}
                    className="px-3 py-1.5 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold"
                  >
                    Tampilkan Semua Siswa
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Print / PDF)</span>
                </button>

                <button
                  onClick={() => {
                    setShowQrPrintModal(false);
                    setSelectedStudentForQr(null);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-4 print:text-black">
              {(selectedStudentForQr
                ? [selectedStudentForQr]
                : qrClassFilter === 'all'
                ? students
                : students.filter((s) => s.classId === qrClassFilter || s.className === qrClassFilter)
              ).map((s) => {
                const qrValue = JSON.stringify({ nisn: s.nisn, username: s.username, id: s.id, name: s.name });
                const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`;

                return (
                  <div
                    key={s.id}
                    className="p-4 bg-white text-slate-900 rounded-2xl border-2 border-indigo-900/30 text-center space-y-2 shadow-md relative overflow-hidden print:break-inside-avoid print:border-black"
                  >
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 text-white py-1.5 px-2 rounded-xl -mx-2 -mt-2 mb-2">
                      <div className="font-extrabold text-[10px] uppercase tracking-wider leading-tight">
                        {settings.schoolName || 'SMA NEGERI 1 UTAMA'}
                      </div>
                      <div className="text-[8px] text-amber-300 font-bold uppercase tracking-widest">
                        KARTU PESERTA UJIAN ONLINE
                      </div>
                    </div>

                    {/* QR Code Real Image */}
                    <div className="w-28 h-28 mx-auto p-1.5 bg-white border-2 border-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <img
                        src={qrImgUrl}
                        alt={`QR Code ${s.name}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="font-extrabold text-sm text-indigo-950 leading-tight">{s.name}</div>
                    
                    <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-700 bg-slate-100 py-1 px-2 rounded-lg border border-slate-200">
                      <span>NISN: <strong>{s.nisn}</strong></span>
                      <span>|</span>
                      <span>Kelas: <strong>{s.className}</strong></span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-800 bg-amber-500/15 border border-amber-500/40 p-1.5 rounded-xl font-semibold flex items-center justify-around">
                      <span>User: <strong className="text-indigo-900">{s.username}</strong></span>
                      <span>PIN: <strong className="text-emerald-800">{s.password}</strong></span>
                    </div>

                    <div className="text-[8px] text-slate-400 italic">
                      Scan QR Code di atas pada kamera HP untuk login otomatis
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Cetak Lembar Kartu Peserta (A4 / PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{deleteConfirm.title}</h3>
                <p className="text-xs text-rose-300 font-medium">Tindakan ini permanen</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Share & Portal Modal */}
      <StudentShareModal
        isOpen={showStudentShareModal}
        onClose={() => setShowStudentShareModal(false)}
        settings={settings}
        setSettings={setSettings}
        students={students}
        onOpenStudentPreview={onOpenStudentPreview || (() => {})}
      />

      {/* User Guide & Step-by-Step Tutorial Modal */}
      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        defaultRole="admin"
        onNavigateToTab={(tabKey) => {
          if (tabKey === 'share') {
            setShowStudentShareModal(true);
          } else {
            setActiveTab(tabKey as any);
          }
        }}
      />

    </div>
  );
};
