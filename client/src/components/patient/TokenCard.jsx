import React from 'react';
import { UserCheck, Zap, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { getStatusBadgeStyle, getStatusLabel } from '../../utils/formatters';

export const TokenCard = ({ selectedToken, currentServingToken, isConnected }) => {
  if (!selectedToken) {
    return (
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-center">
        <p className="text-xs text-slate-400">Select an existing token above or book a new token to preview.</p>
      </div>
    );
  }

  const isServing = selectedToken.tokenNumber === currentServingToken;
  const isCompleted = selectedToken.status === 'COMPLETED';

  return (
    <div className={`rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all border ${
      isServing
        ? 'glass-card-emerald'
        : isCompleted
        ? 'glass-card-cyan'
        : selectedToken.status === 'EMERGENCY'
        ? 'glass-card-rose'
        : 'glass-panel border-cyan-500/20'
    }`}>
      {/* Real-time Connection Status Pill */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Connected live via WebSockets
          </span>
        </div>

        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadgeStyle(selectedToken.status)}`}>
          {getStatusLabel(selectedToken.status)}
        </span>
      </div>

      {/* Large Token Hero Header */}
      <div className="text-center py-4">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Reserved Token</span>
        <div className="text-5xl sm:text-6xl font-black text-slate-100 font-mono-num tracking-tight mt-1">
          #{selectedToken.tokenNumber}
        </div>
        <div className="text-sm font-bold text-cyan-300 mt-1">{selectedToken.patientName}</div>
      </div>

      {/* Current Queue Status & Patients Ahead Badge */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 mt-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Now Serving:</span>
          <span className="font-extrabold text-base text-emerald-400 font-mono-num">
            {currentServingToken ? `#${currentServingToken}` : 'Preparing...'}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span className="text-xs text-slate-400">Queue Position:</span>
          {isServing ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> YOUR TURN NOW!
            </span>
          ) : isCompleted ? (
            <span className="text-xs font-bold text-blue-400">Completed</span>
          ) : (
            <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              {selectedToken.tokensAhead !== undefined
                ? `${selectedToken.tokensAhead} Patient${selectedToken.tokensAhead !== 1 ? 's' : ''} Ahead`
                : 'In Queue'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
