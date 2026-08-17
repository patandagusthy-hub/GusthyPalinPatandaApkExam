import React from 'react';
import { Smartphone, ShieldCheck, Sparkles } from 'lucide-react';

export const PhoneModelBadge: React.FC = () => {
  return (
    <div className="relative group cursor-pointer my-2">
      {/* 3D Phone Container Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-xl border border-indigo-500/30 backdrop-blur-md transform transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
        
        {/* Decorative Background Glowing Elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl"></div>

        <div className="flex items-center gap-4 relative z-10">
          
          {/* 3D Smartphone Isometric Graphic Frame */}
          <div className="relative flex-shrink-0 w-16 h-28 bg-slate-950 rounded-2xl border-2 border-indigo-400/80 p-1 shadow-2xl shadow-indigo-950 flex flex-col items-center justify-between transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            
            {/* Phone Notch / Camera Pill */}
            <div className="w-6 h-1.5 bg-slate-800 rounded-full my-0.5"></div>
            
            {/* Phone Screen Visual with Animated Gradient & Badge */}
            <div className="w-full flex-1 bg-gradient-to-b from-indigo-600 via-sky-600 to-indigo-900 rounded-lg p-1 flex flex-col items-center justify-center text-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent animate-pulse"></div>
              <Smartphone className="w-5 h-5 text-white drop-shadow-md mb-0.5" />
              <div className="text-[7px] font-extrabold text-amber-300 tracking-wider uppercase leading-tight drop-shadow">
                EXAM
              </div>
            </div>

            {/* Home Indicator Bar */}
            <div className="w-5 h-1 bg-slate-700 rounded-full my-0.5"></div>
          </div>

          {/* Title & Branding Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> Anti-Nyontek 3D System
              </span>
            </div>

            {/* USER REQUESTED TEXT: GusthyPalinPatandaApkExam */}
            <h3 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent tracking-tight truncate">
              GusthyPalinPatandaApkExam
            </h3>

            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>Multi-Platform PWA App for iOS, Android & Windows</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
