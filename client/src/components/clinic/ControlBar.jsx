import React from 'react';
import { UserCheck, CheckCircle2, FastForward, Pause, Play, AlertOctagon } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const ControlBar = ({ onOpenEmergencyModal }) => {
  const { callNext, completeConsultation, skipPatient, togglePause, queueState } = useSocket();

  const isPaused = queueState?.status === 'PAUSED';
  const hasActiveConsultation = Boolean(queueState?.currentlyServing);

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Call Next Patient - Primary Button */}
        <button
          onClick={callNext}
          disabled={isPaused}
          className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg ${
            isPaused
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-cyan-500/25 active:scale-[0.98]'
          }`}
        >
          <UserCheck className="h-5 w-5" />
          <span>Call Next Patient</span>
        </button>

        {/* Complete Consultation */}
        <button
          onClick={completeConsultation}
          disabled={!hasActiveConsultation}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
            hasActiveConsultation
              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30 active:scale-[0.98]'
              : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Complete</span>
        </button>

        {/* Skip / Absent */}
        <button
          onClick={() => skipPatient()}
          disabled={!hasActiveConsultation}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
            hasActiveConsultation
              ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30 active:scale-[0.98]'
              : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <FastForward className="h-4 w-4 text-amber-400" />
          <span>Skip / Absent</span>
        </button>

        {/* Pause / Resume Queue */}
        <button
          onClick={togglePause}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all border ${
            isPaused
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
              <span>Resume Queue</span>
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>Pause Queue</span>
            </>
          )}
        </button>

        {/* Emergency Triage Insertion */}
        <button
          onClick={onOpenEmergencyModal}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 active:scale-[0.98] transition-all"
        >
          <AlertOctagon className="h-4 w-4 text-rose-400 animate-pulse" />
          <span>Emergency Triage</span>
        </button>
      </div>
    </div>
  );
};
