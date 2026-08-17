import React, { useState, useEffect } from 'react';
import {
  Student,
  ClassItem,
  Question,
  ExamSchedule,
  ExamResult,
  AppSettings
} from './types';
import {
  getStudents,
  saveStudents,
  getClasses,
  saveClasses,
  getQuestions,
  saveQuestions,
  getExamSchedules,
  saveExamSchedules,
  getExamResults,
  getAppSettings,
  getActiveSession,
  setActiveSession,
  getSavedTheme,
  fetchServerData,
  pushServerSync
} from './lib/storage';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { StudentPortal } from './components/StudentPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { PwaInstallModal } from './components/PwaInstallModal';
import { QrScannerModal } from './components/QrScannerModal';
import { StudentShareModal } from './components/StudentShareModal';
import { UserGuideModal } from './components/UserGuideModal';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(getSavedTheme());

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());

  // Student-Only Mode Flag (Activated by URL: ?portal=student or /student or user choice)
  const [isStudentOnlyMode, setIsStudentOnlyMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('portal') === 'student' || window.location.pathname.startsWith('/student')) {
        return true;
      }
    }
    return false;
  });

  // Active user session state (Persists on browser refresh!)
  const [session, setSession] = useState<{ role: 'admin' | 'student'; user: any } | null>(
    getActiveSession()
  );

  // Modals state
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isStudentShareOpen, setIsStudentShareOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Load initial state on mount & synchronize with server
  useEffect(() => {
    const localStudents = getStudents();
    const localClasses = getClasses();
    const localQuestions = getQuestions();
    const localExams = getExamSchedules();
    const localResults = getExamResults();
    const localSettings = getAppSettings();

    setStudents(localStudents);
    setClasses(localClasses);
    setQuestions(localQuestions);
    setExams(localExams);
    setResults(localResults);
    setSettings(localSettings);

    // Initial server sync
    fetchServerData().then((serverData) => {
      if (serverData) {
        if (serverData.students && serverData.students.length > 0) {
          setStudents(serverData.students);
          saveStudents(serverData.students);
        }
        if (serverData.classes && serverData.classes.length > 0) {
          setClasses(serverData.classes);
          saveClasses(serverData.classes);
        }
        if (serverData.questions && serverData.questions.length > 0) {
          setQuestions(serverData.questions);
          saveQuestions(serverData.questions);
        }
        if (serverData.exams && serverData.exams.length > 0) {
          setExams(serverData.exams);
          saveExamSchedules(serverData.exams);
        }
      }
    });
  }, []);

  // Update theme class on root html / body
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f8fafc';
    }
  }, [theme]);

  // Login Handlers
  const handleStudentLogin = (student: Student) => {
    const sess = { role: 'student' as const, user: student };
    setSession(sess);
    setActiveSession(sess);
  };

  const handleAdminLogin = (adminName: string) => {
    const sess = { role: 'admin' as const, user: { name: adminName } };
    setSession(sess);
    setActiveSession(sess);
  };

  const handleLogout = () => {
    setSession(null);
    setActiveSession(null);
  };

  const handleResetStudentPassword = (identifier: string, newPass: string): Student | undefined => {
    const current = getStudents();
    const query = identifier.trim().toLowerCase();
    let targetStudent: Student | undefined;

    const updated = current.map((s) => {
      if (
        s.id.toLowerCase() === query ||
        (s.nisn && s.nisn.toLowerCase() === query) ||
        (s.username && s.username.toLowerCase() === query)
      ) {
        targetStudent = { ...s, password: newPass };
        return targetStudent;
      }
      return s;
    });

    if (targetStudent) {
      setStudents(updated);
      saveStudents(updated);
    }
    return targetStudent;
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Persistent Header Bar */}
      <Header
        currentTheme={theme}
        setTheme={setTheme}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        currentUser={session ? { role: session.role, name: session.role === 'student' ? session.user.name : session.user.name } : null}
        onLogout={session ? handleLogout : undefined}
        waNumber={settings.waHelpNumber}
        logoUrl={settings.logoUrl}
        isStudentOnlyMode={isStudentOnlyMode}
        onOpenShareStudent={() => setIsStudentShareOpen(true)}
      />

      {/* Main Container Views */}
      <main className="flex-1">
        {!session && (
          <LoginView
            students={students}
            settings={settings}
            onStudentLogin={handleStudentLogin}
            onAdminLogin={handleAdminLogin}
            onOpenQrScanner={() => setIsQrModalOpen(true)}
            onOpenGuideModal={() => setIsGuideOpen(true)}
            onResetStudentPassword={handleResetStudentPassword}
            isStudentOnlyMode={isStudentOnlyMode}
            onSwitchToAdmin={() => {
              setIsStudentOnlyMode(false);
              // Clean URL parameter if any
              if (window.history.pushState) {
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.pushState({ path: newUrl }, '', newUrl);
              }
            }}
          />
        )}

        {session && session.role === 'student' && (
          <StudentPortal
            student={session.user}
            exams={exams}
            settings={settings}
            onLogout={handleLogout}
          />
        )}

        {session && session.role === 'admin' && (
          <AdminDashboard
            adminName={session.user.name}
            students={students}
            setStudents={setStudents}
            classes={classes}
            setClasses={setClasses}
            questions={questions}
            setQuestions={setQuestions}
            exams={exams}
            setExams={setExams}
            results={results}
            setResults={setResults}
            settings={settings}
            setSettings={setSettings}
            onLogout={handleLogout}
            onOpenStudentPreview={() => {
              setIsStudentOnlyMode(true);
              setSession(null);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />

      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        students={students}
        onQrLogin={handleStudentLogin}
      />

      <StudentShareModal
        isOpen={isStudentShareOpen}
        onClose={() => setIsStudentShareOpen(false)}
        settings={settings}
        setSettings={setSettings}
        students={students}
        onOpenStudentPreview={() => {
          setIsStudentOnlyMode(true);
          setSession(null);
        }}
      />

      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        defaultRole={session?.role || (isStudentOnlyMode ? 'student' : 'admin')}
      />

    </div>
  );
}
