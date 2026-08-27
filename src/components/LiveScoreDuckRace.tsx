import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, RefreshCw, Zap, Medal, Award, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Users, Play } from 'lucide-react';
import { Student, ExamResult, ExamSchedule, ClassItem } from '../types';

interface LiveScoreDuckRaceProps {
  students: Student[];
  results: ExamResult[];
  exams: ExamSchedule[];
  classes: ClassItem[];
  currentExamId?: string;
  onRefresh?: () => void;
}

// Duck Avatar styles & color variations for racers
const DUCK_SKINS = [
  { bg: 'from-amber-400 to-yellow-500', duckColor: '#FBBF24', beakColor: '#F97316', eyeColor: '#1E293B', hat: '👑', name: 'Golden Duck' },
  { bg: 'from-sky-400 to-blue-500', duckColor: '#38BDF8', beakColor: '#EA580C', eyeColor: '#0F172A', hat: '🚀', name: 'Speedy Duck' },
  { bg: 'from-emerald-400 to-teal-500', duckColor: '#34D399', beakColor: '#EA580C', eyeColor: '#064E3B', hat: '⚡', name: 'Turbo Duck' },
  { bg: 'from-rose-400 to-pink-500', duckColor: '#FB7185', beakColor: '#EA580C', eyeColor: '#881337', hat: '🌟', name: 'Sparkle Duck' },
  { bg: 'from-purple-400 to-indigo-500', duckColor: '#C084FC', beakColor: '#EA580C', eyeColor: '#3B0764', hat: '🎩', name: 'Wizard Duck' },
  { bg: 'from-orange-400 to-amber-500', duckColor: '#FB923C', beakColor: '#C2410C', eyeColor: '#7C2D12', hat: '🔥', name: 'Blaze Duck' },
  { bg: 'from-lime-400 to-emerald-500', duckColor: '#A3E635', beakColor: '#EA580C', eyeColor: '#14532D', hat: '🎯', name: 'Champ Duck' },
  { bg: 'from-cyan-400 to-teal-500', duckColor: '#22D3EE', beakColor: '#EA580C', eyeColor: '#164E63', hat: '💎', name: 'Diamond Duck' },
];

export const LiveScoreDuckRace: React.FC<LiveScoreDuckRaceProps> = ({
  students,
  results,
  exams,
  classes,
  currentExamId = 'all',
  onRefresh,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(currentExamId);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'race' | 'leaderboard'>('race');
  const [isWaterAnimated, setIsWaterAnimated] = useState<boolean>(true);

  // Active exam object if filtered
  const activeExam = exams.find((e) => e.id === selectedExamId);

  // Compute live scores and racing data for each student
  const raceParticipants = useMemo(() => {
    // Filter students by class if specified
    const filteredStudents = students.filter((s) => {
      if (selectedClassId === 'all') return true;
      return s.classId === selectedClassId || s.className === selectedClassId;
    });

    return filteredStudents.map((student, idx) => {
      // Find matching exam result
      const studentResult = results.find((r) => {
        const matchStudent =
          r.studentId === student.id ||
          r.studentNisn === student.nisn ||
          (r.studentName && r.studentName.trim().toLowerCase() === student.name.trim().toLowerCase());
        
        const matchExam = selectedExamId === 'all' || r.examId === selectedExamId;
        return matchStudent && matchExam;
      });

      // Calculate score and progress percentage
      let score = 0;
      let isCompleted = false;
      let progressPercent = 0;
      let statusLabel = 'Belum Mulai';
      let statusColor = 'text-slate-400';

      if (studentResult) {
        score = studentResult.score || 0;
        isCompleted = true;
        progressPercent = 100;
        statusLabel = `Selesai (${score} Poin)`;
        statusColor = 'text-emerald-400';
      } else if (student.isBlocked) {
        score = 0;
        isCompleted = false;
        progressPercent = 5;
        statusLabel = 'Diblokir';
        statusColor = 'text-rose-400';
      } else if (student.status === 'EXAM') {
        // In exam: estimate live progress from answered / active indices
        const currentQ = student.currentQuestionIndex || 1;
        const totalQ = student.totalQuestionsCount || (activeExam?.questions?.length || 10);
        progressPercent = Math.min(Math.round((currentQ / totalQ) * 90), 92);
        // Temporary proportional score estimate if live
        score = Math.round((progressPercent / 100) * 80);
        statusLabel = `Sedang Mengerjakan (${currentQ}/${totalQ})`;
        statusColor = 'text-amber-400';
      } else if (student.status === 'ONLINE') {
        progressPercent = 8;
        statusLabel = 'Online / Bersiap';
        statusColor = 'text-sky-400';
      }

      // Progress mapped to race distance (0% to 94% max to keep duck inside container)
      const raceDistance = Math.min(Math.max((score / 100) * 88, isCompleted ? 88 : progressPercent * 0.7), 90);

      const skin = DUCK_SKINS[idx % DUCK_SKINS.length];

      return {
        student,
        score,
        isCompleted,
        progressPercent,
        raceDistance,
        statusLabel,
        statusColor,
        skin,
        violations: student.violationsCount || (studentResult?.antiCheatViolations?.length || 0),
      };
    }).sort((a, b) => {
      // Leaderboard sort: highest score first, then completed status, then progress
      if (b.score !== a.score) return b.score - a.score;
      if (b.isCompleted !== a.isCompleted) return b.isCompleted ? 1 : -1;
      return b.progressPercent - a.progressPercent;
    });
  }, [students, results, exams, selectedExamId, selectedClassId, activeExam]);

  // Top 3 Podium
  const podiumTop3 = raceParticipants.slice(0, 3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 text-white space-y-6 shadow-2xl overflow-hidden relative">
      
      {/* Top Banner & Control Center */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
              <span className="text-xl">🦆</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Live Race Score Bebek Ujian
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-bounce" /> Live Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Diagram balapan bebek live: Bebek siswa yang meraih poin / nilai tertinggi akan melaju paling depan menuju garis finish!
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Exam Filter */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
          >
            <option value="all">Semua Ujian ({exams.length})</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.subject})
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-medium focus:border-amber-400 focus:outline-none"
          >
            <option value="all">Semua Kelas ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('race')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'race' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏁 Lintasan Bebek</span>
            </button>
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'leaderboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Klasemen Nilai</span>
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Refresh Data Live Score"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TOP 3 PODIUM HIGHLIGHT */}
      {podiumTop3.length > 0 && podiumTop3[0].score > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {podiumTop3.map((p, idx) => {
            const podiumMedals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3'];
            const podiumGradients = [
              'from-amber-500/20 via-yellow-500/10 to-transparent border-amber-500/40 text-amber-300',
              'from-slate-400/20 via-slate-400/10 to-transparent border-slate-400/40 text-slate-200',
              'from-amber-700/20 via-orange-600/10 to-transparent border-amber-700/40 text-amber-400',
            ];

            return (
              <div
                key={p.student.id}
                className={`p-3.5 rounded-2xl border bg-gradient-to-b ${podiumGradients[idx]} flex items-center gap-3 relative overflow-hidden`}
              >
                <div className="text-3xl shrink-0">
                  {idx === 0 ? '🦆👑' : idx === 1 ? '🦆🥈' : '🦆🥉'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
                    {podiumMedals[idx]}
                  </div>
                  <div className="font-extrabold text-sm text-white truncate">{p.student.name}</div>
                  <div className="text-[11px] text-slate-300 flex items-center justify-between mt-0.5">
                    <span>{p.student.className}</span>
                    <span className="font-black text-amber-400 text-sm">{p.score} Pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MAIN VIEW: DUCK RACING RIVER TRACK */}
      {viewMode === 'race' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-white">Garis Start (0 Poin)</span>
            </div>
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Garis Finish Juara (100 Poin)</span>
              <span>🏁</span>
            </div>
          </div>

          {/* River Track Container */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden shadow-inner">
            
            {/* Water Flow Subtle Animated Wave Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] animate-pulse"></div>
            
            {/* Finish Line Checkered Grid Bar */}
            <div className="absolute right-6 top-0 bottom-0 w-8 border-l-2 border-dashed border-amber-400/40 bg-gradient-to-r from-amber-400/5 to-amber-400/15 flex flex-col items-center justify-between py-2 text-[10px] text-amber-300/80 font-black pointer-events-none select-none">
              <span>FINISH</span>
              <span>🏁</span>
              <span>100</span>
              <span>🏁</span>
              <span>PTS</span>
            </div>

            {/* Empty State */}
            {raceParticipants.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <div className="text-4xl">🦆🌊</div>
                <div className="text-sm font-bold text-slate-400">Belum ada siswa terdaftar pada kelas yang dipilih.</div>
                <p className="text-xs">Tambahkan siswa di menu Kelola Siswa untuk memulai perlombaan.</p>
              </div>
            ) : (
              raceParticipants.map((p, rankIndex) => {
                const isTop1 = rankIndex === 0 && p.score > 0;
                const isTop3 = rankIndex < 3 && p.score > 0;

                return (
                  <div key={p.student.id} className="relative group">
                    {/* Lane Header Info */}
                    <div className="flex items-center justify-between text-xs mb-1.5 px-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                            rankIndex === 0
                              ? 'bg-amber-400 text-slate-950'
                              : rankIndex === 1
                              ? 'bg-slate-300 text-slate-950'
                              : rankIndex === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{rankIndex + 1}
                        </span>
                        <span className="font-bold text-white text-xs sm:text-sm">{p.student.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({p.student.className})</span>
                        {p.violations > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                            ⚠ {p.violations}x
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <span className={`text-xs font-bold ${p.statusColor}`}>{p.statusLabel}</span>
                        <span className="text-sm font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          {p.score} Pts
                        </span>
                      </div>
                    </div>

                    {/* Water Lane */}
                    <div className="relative h-14 bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-950 rounded-2xl border border-sky-900/30 overflow-hidden flex items-center px-2">
                      
                      {/* Swimming Ripples Progress Trail */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.raceDistance + 6}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-600/20 via-sky-400/25 to-sky-300/30 border-r-2 border-sky-400/60 rounded-l-2xl"
                      ></motion.div>

                      {/* Animated Water Bubbles */}
                      <div className="absolute inset-0 flex items-center justify-around opacity-20 pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                        <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                      </div>

                      {/* THE RACING DUCK */}
                      <motion.div
                        initial={{ left: '0%' }}
                        animate={{ left: `${p.raceDistance}%` }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        className="absolute z-10 flex items-center gap-2 cursor-pointer"
                        title={`${p.student.name} - Skor: ${p.score} Poin`}
                      >
                        {/* Duck Graphic with Bobbing Float Animation */}
                        <div className="relative animate-bounce" style={{ animationDuration: `${1.2 + (rankIndex % 4) * 0.2}s` }}>
                          
                          {/* Swimming Water Splash Behind Duck */}
                          <div className="absolute -left-3 bottom-1 flex gap-0.5 opacity-70">
                            <span className="w-2 h-1 bg-sky-300 rounded-full animate-ping"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                          </div>

                          {/* Duck SVG / Avatar Card */}
                          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${p.skin.bg} p-1 shadow-lg shadow-amber-500/20 flex items-center justify-center border-2 ${isTop1 ? 'border-amber-300 scale-110' : 'border-white/40'} transition-transform`}>
                            <div className="relative text-xl select-none">
                              <span>🦆</span>
                              {/* Custom Trophy or Hat for Top Racers */}
                              {isTop1 ? (
                                <span className="absolute -top-3.5 -right-1 text-xs animate-pulse">👑</span>
                              ) : isTop3 ? (
                                <span className="absolute -top-3.5 -right-1 text-xs">⭐</span>
                              ) : null}
                            </div>
                          </div>

                        </div>

                        {/* Floating Name Badge */}
                        <div className="hidden sm:flex flex-col bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-slate-700 shadow-md text-[10px] leading-tight">
                          <span className="font-black text-white truncate max-w-[100px]">{p.student.name.split(' ')[0]}</span>
                          <span className="text-amber-400 font-bold">{p.score} pts</span>
                        </div>
                      </motion.div>

                    </div>
                  </div>
                );
              })
            )}

          </div>
        </div>
      )}

      {/* ALTERNATIVE VIEW: LEADERBOARD TABLE */}
      {viewMode === 'leaderboard' && (
        <div className="overflow-x-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3 text-center w-16">Peringkat</th>
                <th className="p-3">Pembalap Bebek</th>
                <th className="p-3">NISN / Kelas</th>
                <th className="p-3 text-center">Poin Nilai</th>
                <th className="p-3 text-center">Status Ujian</th>
                <th className="p-3 text-center">Pelanggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {raceParticipants.map((p, idx) => (
                <tr key={p.student.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-center font-black">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                  </td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="text-lg">🦆</span>
                    <span>{p.student.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {p.student.nisn} ({p.student.className})
                  </td>
                  <td className="p-3 text-center font-black text-amber-400 text-sm">
                    {p.score}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      p.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : p.student.status === 'EXAM'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {p.statusLabel}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-400">
                    {p.violations > 0 ? (
                      <span className="text-rose-400 font-bold">⚠ {p.violations}x</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">✔ Aman</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Poin tertinggi = Berenang terdepan
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 100 Poin = Menyentuh garis finish
          </span>
        </div>
        <div className="text-slate-500 italic">
          Data tersinkronisasi otomatis setiap ada jawaban masuk dari siswa
        </div>
      </div>

    </div>
  );
};
