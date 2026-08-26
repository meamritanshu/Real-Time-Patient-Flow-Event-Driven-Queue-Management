import React from 'react';
import { Clock, Activity, AlertTriangle, Sparkles } from 'lucide-react';
import { formatTimeShort } from '../../utils/formatters';

export const DynamicEtaDisplay = ({ selectedToken, wmaMinutes, queueStatus }) => {
  if (!selectedToken) return null;

  if (selectedToken.status === 'COMPLETED') {
    return (
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-center">
        <div className="text-emerald-400 font-bold text-sm">Consultation Finished</div>
        <p className="text-xs text-slate-400 mt-1">Thank you for visiting Apollo Health Clinic!</p>
      </div>
    );
  }

  if (selectedToken.status === 'IN_CONSULTATION') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl text-center animate-pulse">
        <div className="text-emerald-300 font-extrabold text-base flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <span>It's Your Turn! Please enter Room 3</span>
        </div>
        <p className="text-xs text-emerald-200 mt-1">Dr. Ananya Sharma is ready for your consultation.</p>
      </div>
    );
  }

  const estimatedWait = selectedToken.estimatedWaitMinutes ?? 15;
  const isPaused = queueStatus === 'PAUSED';

  return (
    <div className={`p-5 rounded-2xl shadow-xl relative overflow-hidden transition-all ${
      isPaused ? 'glass-card-amber' : 'glass-card-cyan'
    }`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dynamic ETA Counter</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Activity className="h-3 w-3 text-cyan-400" />
          <span>WMA Engine: <strong className="text-slate-200">{wmaMinutes}m/pt</strong></span>
        </div>
      </div>

      <div className="text-center py-2">
        <div className="text-xs text-slate-400">Estimated Wait Time</div>
        <div className="text-4xl font-black text-cyan-400 font-mono-num tracking-tight mt-0.5">
          ~{estimatedWait} mins
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Estimated Call Time: <strong className="text-slate-200">{formatTimeShort(selectedToken.projectedTime)}</strong>
        </p>
      </div>

      {isPaused && (
        <div className="mt-3 bg-amber-500/20 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-300 flex items-center justify-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Doctor is taking a short break. Queue is temporarily paused.</span>
        </div>
      )}
    </div>
  );
};
