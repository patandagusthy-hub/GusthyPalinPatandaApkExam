export type QuestionType = 'multiple_choice' | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: {
    key: string; // 'A', 'B', 'C', 'D', 'E'
    text: string;
  }[];
  correctKey?: string; // For multiple choice ('A', 'B', etc.)
  essayGuide?: string; // Answer guide / rubric for essay
  points: number;
}

export interface StudentViolation {
  timestamp: string;
  reason: string;
  snapshotUrl?: string;
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  username: string;
  password: string;
  classId: string;
  className: string;
  isBlocked?: boolean;
  violationsCount?: number;
  violationLogs?: StudentViolation[];
  status?: 'ONLINE' | 'EXAM' | 'COMPLETED' | 'BLOCKED' | 'OFFLINE';
  activeExamId?: string;
  currentQuestionIndex?: number;
  totalQuestionsCount?: number;
}

export interface ClassItem {
  id: string;
  name: string;
  description?: string;
  studentCount?: number;
}

export interface ExamSchedule {
  id: string;
  title: string;
  subject: string;
  targetClassId: string;
  targetClassName: string;
  durationMinutes: number;
  startTime: string; // ISO String or readable datetime
  endTime: string;
  isRandomizeQuestions: boolean;
  isRandomizeOptions: boolean;
  cameraProctoring: boolean;
  cameraIntervalMinutes: number; // 1, 2, 3, 5
  questions: Question[];
  passGrade?: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  className: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  multipleChoiceAnswers: Record<string, string>; // questionId -> chosenKey
  essayAnswers: Record<string, string>; // questionId -> studentEssayText
  startedAt: string;
  submittedAt: string;
  antiCheatViolations: StudentViolation[];
  cameraSnapshots: string[];
  isPassed?: boolean;
}

export interface OneTimeAdminLogin {
  id: string;
  username: string;
  password: string;
  name: string; // e.g., "Pak Ahmad - Ruang 1"
  status: 'ACTIVE' | 'EXPIRED';
  createdAt: string;
  usedAt?: string;
}

export interface AppSettings {
  appName: string;
  schoolName: string;
  npsn?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  headmasterName?: string;
  headmasterNip?: string;
  academicYear?: string;
  semester?: string;
  examCity?: string;
  schoolLogo?: string;
  defaultPaperSize?: 'A4' | 'F4' | 'Letter' | 'Legal';
  adminUsername: string;
  adminPassword: string;
  googleSheetWebhookUrl: string;
  googleSpreadsheetId?: string;
  autoSyncGoogleSheets?: boolean;
  waHelpNumber: string; // e.g., "085240195357"
  logoUrl?: string;
  oneTimeAdminLogins: OneTimeAdminLogin[];
}

export interface ExamDraft {
  examId: string;
  studentId: string;
  multipleChoiceAnswers: Record<string, string>;
  essayAnswers: Record<string, string>;
  flaggedQuestionIds: string[];
  questionOrderIds: string[];
  optionsOrderMap: Record<string, { key: string; text: string }[]>;
  currentQuestionIndex: number;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'SYNC_STUDENT' | 'SYNC_CLASS' | 'SYNC_RESULT' | 'SYNC_EXAM' | 'SYNC_SETTINGS';
  payload: Record<string, any>;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}
