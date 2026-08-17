import {
  Student,
  ClassItem,
  Question,
  ExamSchedule,
  ExamResult,
  AppSettings,
  ExamDraft,
  SyncQueueItem,
  OneTimeAdminLogin
} from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'gianna_students_v1',
  CLASSES: 'gianna_classes_v1',
  QUESTIONS: 'gianna_questions_v1',
  EXAMS: 'gianna_exams_v1',
  RESULTS: 'gianna_results_v1',
  SETTINGS: 'gianna_settings_v1',
  DRAFTS: 'gianna_drafts_v1',
  SYNC_QUEUE: 'gppa_sync_queue_v1',
  THEME: 'gianna_theme_v1',
  ACTIVE_SESSION: 'gianna_active_session_v1',
};

// Initial Seed Data
const DEFAULT_CLASSES: ClassItem[] = [
  { id: 'c1', name: 'X MIPA 1', description: 'Kelas X Matematika dan IPA 1', studentCount: 2 },
  { id: 'c2', name: 'XI IPS 2', description: 'Kelas XI Ilmu Pengetahuan Sosial 2', studentCount: 1 },
  { id: 'c3', name: 'XC', description: 'Kelas X C', studentCount: 1 },
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 's1',
    nisn: '0051234567',
    name: 'Ahmad Rizky Pratama',
    username: 'ahmad005',
    password: '123',
    classId: 'c1',
    className: 'X MIPA 1',
    isBlocked: false,
    violationsCount: 0,
    violationLogs: [],
    status: 'OFFLINE'
  },
  {
    id: 's2',
    nisn: '0051234568',
    name: 'Siti Rahmawati',
    username: 'siti005',
    password: '123',
    classId: 'c1',
    className: 'X MIPA 1',
    isBlocked: false,
    violationsCount: 0,
    violationLogs: [],
    status: 'OFFLINE'
  },
  {
    id: 's3',
    nisn: '0051234569',
    name: 'Budi Santoso',
    username: 'budi005',
    password: '123',
    classId: 'c2',
    className: 'XI IPS 2',
    isBlocked: false,
    violationsCount: 0,
    violationLogs: [],
    status: 'OFFLINE'
  },
  {
    id: 's4',
    nisn: '0051234570',
    name: 'Gianna Puteri',
    username: 'gianna1',
    password: '123',
    classId: 'c3',
    className: 'XC',
    isBlocked: false,
    violationsCount: 0,
    violationLogs: [],
    status: 'OFFLINE'
  }
];

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    questionText: 'Siapakah presiden pertama Republik Indonesia yang membacakan Teks Proklamasi Kemerdekaan?',
    options: [
      { key: 'A', text: 'Drs. Mohammad Hatta' },
      { key: 'B', text: 'Ir. Soekarno' },
      { key: 'C', text: 'Sutan Sjahrir' },
      { key: 'D', text: 'Jenderal Soedirman' },
      { key: 'E', text: 'Ki Hajar Dewantara' }
    ],
    correctKey: 'B',
    points: 20
  },
  {
    id: 'q2',
    type: 'multiple_choice',
    questionText: 'Organel sel tanaman yang berfungsi sebagai tempat berlangsungnya proses fotosintesis adalah?',
    options: [
      { key: 'A', text: 'Mitokondria' },
      { key: 'B', text: 'Ribosom' },
      { key: 'C', text: 'Kloroplas' },
      { key: 'D', text: 'Badan Golgi' },
      { key: 'E', text: 'Lisosom' }
    ],
    correctKey: 'C',
    points: 20
  },
  {
    id: 'q3',
    type: 'multiple_choice',
    questionText: 'Pancasila disahkan sebagai dasar negara Republik Indonesia pada tanggal?',
    options: [
      { key: 'A', text: '17 Agustus 1945' },
      { key: 'B', text: '18 Agustus 1945' },
      { key: 'C', text: '1 Juni 1945' },
      { key: 'D', text: '22 Juni 1945' },
      { key: 'E', text: '28 Oktober 1928' }
    ],
    correctKey: 'B',
    points: 20
  },
  {
    id: 'q4',
    type: 'essay',
    questionText: 'Jelaskan perbedaan antara sistem pernapasan aerob dan anaerob pada makhluk hidup beserta contoh reaksinya!',
    essayGuide: 'Jawaban harus mencakup: 1. Kebutuhan oksigen (aerob butuh O2, anaerob tidak), 2. Hasil energi ATP (aerob 36-38 ATP, anaerob 2 ATP), 3. Produk sampingan (H2O & CO2 vs Asam Laktat / Alkohol).',
    points: 20
  },
  {
    id: 'q5',
    type: 'essay',
    questionText: 'Tuliskan dan jelaskan 3 nilai utama Pancasila yang dapat diterapkan siswa dalam kehidupan sehari-hari di sekolah untuk mencegah perundungan (bullying)!',
    essayGuide: 'Jawaban mencakup nilai Sila Ke-1 (toleransi), Sila Ke-2 (kemanusiaan & menghargai sesama), dan Sila Ke-3 (persatuan antar sesama teman).',
    points: 20
  }
];

const DEFAULT_EXAMS: ExamSchedule[] = [
  {
    id: 'ex1',
    title: 'Ujian Akhir Semester - Pengetahuan Umum & Saintek',
    subject: 'Pengetahuan Umum',
    targetClassId: 'all',
    targetClassName: 'Semua Kelas',
    durationMinutes: 45,
    startTime: '2026-08-01T08:00',
    endTime: '2026-12-31T23:59',
    isRandomizeQuestions: true,
    isRandomizeOptions: true,
    cameraProctoring: true,
    cameraIntervalMinutes: 2,
    questions: DEFAULT_QUESTIONS,
    passGrade: 70
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'GiannaExamApk',
  schoolName: 'SMA Negeri Utama',
  npsn: '20401892',
  schoolAddress: 'Jl. Pendidikan No. 45, Kompleks Pendidikan Utama, Kota Makassar, Sulawesi Selatan',
  schoolPhone: '(0411) 872190',
  schoolEmail: 'info@smanutama.sch.id',
  headmasterName: 'Drs. H. Muhammad Ridwan, M.Pd.',
  headmasterNip: '19690815 199403 1 005',
  academicYear: '2025/2026',
  semester: 'Genap',
  examCity: 'Makassar',
  schoolLogo: '',
  defaultPaperSize: 'F4',
  adminUsername: 'admin',
  adminPassword: 'admin123',
  googleSheetWebhookUrl: '',
  waHelpNumber: '085240195357',
  oneTimeAdminLogins: [
    {
      id: 'otl1',
      username: 'admin_204',
      password: 'X8K2P9',
      name: 'Pak Ahmad - Pengawas Ruang 1',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }
  ]
};

// Generic Helpers
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// Students
export function getStudents(): Student[] {
  return getItem<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
}

export function saveStudents(students: Student[]): void {
  setItem(STORAGE_KEYS.STUDENTS, students);
  triggerSpreadsheetSync('SYNC_STUDENTS', { students });
  pushServerSync('STUDENTS', students);
}

export function saveStudent(student: Student): void {
  const current = getStudents();
  const idx = current.findIndex((s) => s.id === student.id);
  if (idx >= 0) {
    current[idx] = student;
  } else {
    current.push(student);
  }
  saveStudents(current);
}

export function deleteStudent(id: string): void {
  const current = getStudents().filter((s) => s.id !== id);
  saveStudents(current);
}

// Classes
export function getClasses(): ClassItem[] {
  return getItem<ClassItem[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
}

export function saveClasses(classes: ClassItem[]): void {
  setItem(STORAGE_KEYS.CLASSES, classes);
  triggerSpreadsheetSync('SYNC_CLASSES', { classes });
}

export function saveClass(classItem: ClassItem): void {
  const current = getClasses();
  const idx = current.findIndex((c) => c.id === classItem.id);
  if (idx >= 0) {
    current[idx] = classItem;
  } else {
    current.push(classItem);
  }
  saveClasses(current);
}

export function deleteClass(id: string): void {
  const current = getClasses().filter((c) => c.id !== id);
  saveClasses(current);
}

// Questions
export function getQuestions(): Question[] {
  return getItem<Question[]>(STORAGE_KEYS.QUESTIONS, DEFAULT_QUESTIONS);
}

export function saveQuestions(questions: Question[]): void {
  setItem(STORAGE_KEYS.QUESTIONS, questions);
  triggerSpreadsheetSync('SYNC_QUESTIONS', { questions });
  pushServerSync('QUESTIONS', questions);
}

export function saveQuestion(question: Question): void {
  const current = getQuestions();
  const idx = current.findIndex((q) => q.id === question.id);
  if (idx >= 0) {
    current[idx] = question;
  } else {
    current.push(question);
  }
  saveQuestions(current);
}

export function deleteQuestion(id: string): void {
  const current = getQuestions().filter((q) => q.id !== id);
  saveQuestions(current);
}

// Exam Schedules
export function getExamSchedules(): ExamSchedule[] {
  return getItem<ExamSchedule[]>(STORAGE_KEYS.EXAMS, DEFAULT_EXAMS);
}

export function saveExamSchedules(exams: ExamSchedule[]): void {
  setItem(STORAGE_KEYS.EXAMS, exams);
  triggerSpreadsheetSync('SYNC_EXAMS', { exams });
  pushServerSync('EXAMS', exams);
}

export function saveExamSchedule(exam: ExamSchedule): void {
  const current = getExamSchedules();
  const idx = current.findIndex((e) => e.id === exam.id);
  if (idx >= 0) {
    current[idx] = exam;
  } else {
    current.push(exam);
  }
  saveExamSchedules(current);
}

export function deleteExamSchedule(id: string): void {
  const current = getExamSchedules().filter((e) => e.id !== id);
  saveExamSchedules(current);
}

// Exam Results
export function getExamResults(): ExamResult[] {
  return getItem<ExamResult[]>(STORAGE_KEYS.RESULTS, []);
}

export function saveExamResult(result: ExamResult): void {
  const current = getExamResults();
  const idx = current.findIndex((r) => r.id === result.id);
  if (idx >= 0) {
    current[idx] = result;
  } else {
    current.push(result);
  }
  setItem(STORAGE_KEYS.RESULTS, current);
  triggerSpreadsheetSync('SYNC_RESULT', { result });
  submitExamToServer(result);
}

export function deleteExamResult(id: string): void {
  const current = getExamResults().filter((r) => r.id !== id);
  setItem(STORAGE_KEYS.RESULTS, current);
}

export function deleteAllExamResults(): void {
  setItem(STORAGE_KEYS.RESULTS, []);
}

export function deleteAllStudents(): void {
  setItem(STORAGE_KEYS.STUDENTS, []);
  triggerSpreadsheetSync('SYNC_STUDENTS', { students: [] });
}

export function deleteAllQuestions(): void {
  setItem(STORAGE_KEYS.QUESTIONS, []);
  triggerSpreadsheetSync('SYNC_QUESTIONS', { questions: [] });
}

export function deleteAllExamSchedules(): void {
  setItem(STORAGE_KEYS.EXAMS, []);
  triggerSpreadsheetSync('SYNC_EXAMS', { exams: [] });
}

export function deleteOneTimeAdminLogin(id: string): void {
  const settings = getAppSettings();
  if (!settings.oneTimeAdminLogins) return;
  settings.oneTimeAdminLogins = settings.oneTimeAdminLogins.filter((o) => o.id !== id);
  saveAppSettings(settings);
}

// App Settings
export function getAppSettings(): AppSettings {
  return getItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveAppSettings(settings: AppSettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  triggerSpreadsheetSync('SYNC_SETTINGS', { settings });
}

// One-Time Admin Logins
export function saveOneTimeAdminLogin(otl: OneTimeAdminLogin): void {
  const settings = getAppSettings();
  const current = settings.oneTimeAdminLogins || [];
  const idx = current.findIndex((o) => o.id === otl.id);
  if (idx >= 0) {
    current[idx] = otl;
  } else {
    current.push(otl);
  }
  settings.oneTimeAdminLogins = current;
  saveAppSettings(settings);
}

export function markOneTimeAdminLoginUsed(username: string): void {
  const settings = getAppSettings();
  if (!settings.oneTimeAdminLogins) return;
  const idx = settings.oneTimeAdminLogins.findIndex(
    (o) => o.username.toLowerCase() === username.toLowerCase()
  );
  if (idx >= 0) {
    settings.oneTimeAdminLogins[idx].status = 'EXPIRED';
    settings.oneTimeAdminLogins[idx].usedAt = new Date().toISOString();
    saveAppSettings(settings);
  }
}

// Exam Drafts Auto-Save
export function saveExamDraft(draft: ExamDraft): void {
  const drafts = getItem<Record<string, ExamDraft>>(STORAGE_KEYS.DRAFTS, {});
  const key = `${draft.studentId}_${draft.examId}`;
  drafts[key] = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  setItem(STORAGE_KEYS.DRAFTS, drafts);
}

export function getExamDraft(studentId: string, examId: string): ExamDraft | null {
  const drafts = getItem<Record<string, ExamDraft>>(STORAGE_KEYS.DRAFTS, {});
  const key = `${studentId}_${examId}`;
  return drafts[key] || null;
}

export function clearExamDraft(studentId: string, examId: string): void {
  const drafts = getItem<Record<string, ExamDraft>>(STORAGE_KEYS.DRAFTS, {});
  const key = `${studentId}_${examId}`;
  delete drafts[key];
  setItem(STORAGE_KEYS.DRAFTS, drafts);
}

// Active Session Persistence (Prevents unwanted logouts on refresh)
export function getActiveSession(): { role: 'admin' | 'student'; user: any } | null {
  return getItem(STORAGE_KEYS.ACTIVE_SESSION, null);
}

export function setActiveSession(session: { role: 'admin' | 'student'; user: any } | null): void {
  setItem(STORAGE_KEYS.ACTIVE_SESSION, session);
}

// Theme Persistence
export function getSavedTheme(): 'light' | 'dark' {
  return getItem<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light');
}

export function saveTheme(theme: 'light' | 'dark'): void {
  setItem(STORAGE_KEYS.THEME, theme);
}

// Offline Sync Queue
export function getSyncQueue(): SyncQueueItem[] {
  return getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
}

export function saveSyncQueue(queue: SyncQueueItem[]): void {
  setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
}

export function addToSyncQueue(action: SyncQueueItem['action'], payload: any): void {
  const queue = getSyncQueue();
  const newItem: SyncQueueItem = {
    id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    action,
    payload,
    timestamp: new Date().toISOString(),
    status: 'PENDING',
    retryCount: 0,
  };
  queue.push(newItem);
  saveSyncQueue(queue);
}

export async function processSyncQueue(): Promise<{ processedCount: number; errors: number }> {
  const settings = getAppSettings();
  if (!settings.googleSheetWebhookUrl) return { processedCount: 0, errors: 0 };

  const queue = getSyncQueue().filter((item) => item.status === 'PENDING');
  if (queue.length === 0) return { processedCount: 0, errors: 0 };

  let processedCount = 0;
  let errors = 0;

  for (const item of queue) {
    try {
      const response = await fetch('/api/proxy-spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: settings.googleSheetWebhookUrl,
          action: item.action,
          payload: item.payload,
          timestamp: item.timestamp,
        }),
      });

      if (response.ok) {
        item.status = 'SYNCED';
        processedCount++;
      } else {
        item.retryCount++;
        if (item.retryCount >= 5) item.status = 'FAILED';
        errors++;
      }
    } catch (err) {
      console.error('Queue processing network error:', err);
      item.retryCount++;
      if (item.retryCount >= 5) item.status = 'FAILED';
      errors++;
    }
  }

  saveSyncQueue(getSyncQueue());
  return { processedCount, errors };
}

export async function triggerSpreadsheetSync(action: string, payload: any): Promise<boolean> {
  const settings = getAppSettings();

  // If offline or no webhook, queue it
  if (!navigator.onLine || !settings.googleSheetWebhookUrl) {
    addToSyncQueue(action as any, payload);
    return false;
  }

  try {
    const res = await fetch('/api/proxy-spreadsheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: settings.googleSheetWebhookUrl,
        action,
        payload,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      return true;
    } else {
      addToSyncQueue(action as any, payload);
      return false;
    }
  } catch (e) {
    addToSyncQueue(action as any, payload);
    return false;
  }
}

// Server Data Synchronization Handlers
export async function pushServerSync(type: 'ALL' | 'STUDENTS' | 'EXAMS' | 'QUESTIONS' | 'SETTINGS', payload: any): Promise<void> {
  if (!navigator.onLine) return;
  try {
    await fetch('/api/sync-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
  } catch (err) {
    // Ignore offline sync errors silently
  }
}

export async function fetchServerData(): Promise<{
  students?: Student[];
  classes?: ClassItem[];
  questions?: Question[];
  exams?: ExamSchedule[];
  results?: ExamResult[];
  settings?: AppSettings;
} | null> {
  if (!navigator.onLine) return null;
  try {
    const res = await fetch('/api/app-data');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    // Return null if server not reachable
  }
  return null;
}

export async function sendStudentHeartbeat(payload: {
  studentId: string;
  status: 'ONLINE' | 'EXAM' | 'COMPLETED' | 'BLOCKED' | 'OFFLINE';
  activeExamId?: string;
  currentQuestionIndex?: number;
  totalQuestionsCount?: number;
  violationsCount?: number;
}): Promise<void> {
  if (!navigator.onLine) return;
  try {
    await fetch('/api/student-heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Ignore silent heartbeat errors
  }
}

export async function submitExamToServer(result: ExamResult): Promise<void> {
  if (!navigator.onLine) return;
  try {
    await fetch('/api/student-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    });
  } catch (err) {
    // Silent fail if network issue
  }
}
