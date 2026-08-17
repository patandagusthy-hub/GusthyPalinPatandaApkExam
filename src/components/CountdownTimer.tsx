import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, Lock } from 'lucide-react';

interface CountdownTimerProps {
  durationMinutes: number;
  startedAtIso: string;
  onTimeExpired: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  durationMinutes,
  startedAtIso,
  onTimeExpired,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(Math.max(1, durationMinutes * 60));
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    const total = Math.max(1, durationMinutes * 60);
    setTotalSeconds(total);

    const startTime = new Date(startedAtIso).getTime();
    const targetEndTime = startTime + total * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((targetEndTime - now) / 1000));
      setSecondsRemaining(diffSeconds);

      if (diffSeconds <= 0) {
        setIsExpired(true);
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onTimeExpired();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, startedAtIso, onTimeExpired]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const percentage = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;

  // Status colors
  const isDanger = secondsRemaining <= 60 || isExpired;
  const isWarning = secondsRemaining <= 300 && !isDanger;

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-lg ${
      isExpired
        ? 'bg-rose-950/80 border-rose-500 text-rose-200'
        : isDanger
        ? 'bg-rose-950/40 border-rose-500/80 text-rose-200 animate-pulse'
        : isWarning
        ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
        : 'bg-slate-900 border-slate-800 text-sky-200'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <Lock className="w-4 h-4 text-rose-400" />
          ) : (
            <Clock className={`w-4 h-4 ${isDanger ? 'text-rose-400 animate-spin' : isWarning ? 'text-amber-400' : 'text-sky-400'}`} />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Sisa Waktu Ujian</span>
        </div>

        {isExpired && (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500">
            <Lock className="w-3 h-3" /> WAKTU HABIS
          </span>
        )}

        {isWarning && !isExpired && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> &lt; 5 Menit
          </span>
        )}

        {isDanger && !isExpired && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50">
            <AlertTriangle className="w-3 h-3" /> &lt; 1 Menit
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="text-xs text-slate-400 font-bold">
          {isExpired ? '0% (Terkunci)' : `${Math.round(percentage)}% Tersisa`}
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isDanger || isExpired
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-gradient-to-r from-sky-500 to-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

