import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatMinutesToMMSS, formatTimeShort } from '../../utils/formatters';

export const ActiveConsultationCard = ({ currentlyServing, queueStatus, wmaMinutes }) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!currentlyServing || !currentlyServing.consultationStartTime) {
      setSecondsElapsed(0);
      return;
    }

    const startTime = new Date(currentlyServing.consultationStartTime).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setSecondsElapsed(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentlyServing]);

  return (
    <div className={`rounded-2xl p-6 transition-all shadow-2xl relative overflow-hidden ${
      queueStatus === 'PAUSED'
        ? 'glass-card-amber'
        : currentlyServing
        ? 'glass-card-emerald'
        : 'glass-panel'
    }`}>
      {/* Background Subtle Pulse Glow */}
      {currentlyServing && queueStatus === 'ACTIVE' && (
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      )}

      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-800/80 flex items-center justify-center border border-white/10">
            <UserCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Active Consultation Desk
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                queueStatus === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
              }`}>
                Queue: {queueStatus}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Activity className="h-3 w-3 text-cyan-400" /> WMA Avg: <strong className="text-slate-200">{wmaMinutes} mins</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Live Stopwatch Counter */}
        {currentlyServing && (
          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-emerald-500/30 shadow-inner">
            <Clock className="h-4 w-4 text-emerald-400 animate-spin-slow" />
            <span className="font-mono-num font-bold text-lg text-emerald-400 tracking-wider">
              {formatMinutesToMMSS(secondsElapsed)}
            </span>
          </div>
        )}
      </div>

      {/* Main Hero Token Display */}
      {currentlyServing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="sm:col-span-1 text-center sm:text-left">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Currently Serving</span>
            <div className="text-5xl sm:text-6xl font-black text-emerald-400 tracking-tight font-mono-num mt-1">
              #{currentlyServing.tokenNumber}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-2 border-l border-white/10 pl-0 sm:pl-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Patient Name:</span>
              <span className="text-lg font-bold text-slate-100">{currentlyServing.patientName}</span>
            </div>

            {currentlyServing.phoneNumber && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Contact:</span>
                <span className="text-xs font-mono text-slate-300">{currentlyServing.phoneNumber}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Started At:</span>
              <span className="text-xs text-slate-300">
                {formatTimeShort(currentlyServing.consultationStartTime)}
              </span>
            </div>

            {currentlyServing.priorityScore > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Emergency Triage Patient
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-base font-semibold text-slate-200">No Consultation Currently Active</h3>
          <p className="text-xs text-slate-400 mt-1">
            Click <strong className="text-cyan-400">"Call Next Patient"</strong> in the control bar below to serve the next patient in queue.
          </p>
        </div>
      )}
    </div>
  );
};
