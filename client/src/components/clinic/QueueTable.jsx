import React from 'react';
import { Users, Clock, CheckCircle2, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getStatusBadgeStyle, getStatusLabel, formatTimeShort } from '../../utils/formatters';
import { useSocket } from '../../context/SocketContext';

export const QueueTable = ({ waitingQueue, skippedTokens, completedCount }) => {
  const { checkInToken, skipPatient, callNext } = useSocket();

  return (
    <div className="space-y-6">
      {/* Upcoming Active Queue */}
      <div className="glass-panel rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <h3 className="font-bold text-base text-slate-100">Live Waiting Queue</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              {waitingQueue.length} Waiting
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Completed Today: <strong className="text-emerald-400 font-mono-num">{completedCount}</strong>
          </div>
        </div>

        {waitingQueue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Token #</th>
                  <th className="py-3 px-3">Patient Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Tokens Ahead</th>
                  <th className="py-3 px-3">Est. Wait Time</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {waitingQueue.map((token) => (
                  <tr
                    key={token._id || token.tokenNumber}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      token.status === 'EMERGENCY' ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono-num font-extrabold text-sm text-cyan-400">
                      #{token.tokenNumber}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{token.patientName}</div>
                      {token.phoneNumber && (
                        <div className="text-[11px] text-slate-400 font-mono">{token.phoneNumber}</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadgeStyle(token.status)}`}>
                        {getStatusLabel(token.status)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-300 font-mono-num">
                      {token.tokensAhead === 0 ? (
                        <span className="text-emerald-400 font-bold">Next in Line</span>
                      ) : (
                        `${token.tokensAhead} patient${token.tokensAhead > 1 ? 's' : ''}`
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-200 font-mono-num font-semibold">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        ~{token.estimatedWaitMinutes} mins
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {token.status === 'BOOKED' && (
                          <button
                            onClick={() => checkInToken({ tokenNumber: token.tokenNumber })}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-medium transition-colors"
                          >
                            Check-In
                          </button>
                        )}
                        <button
                          onClick={() => skipPatient(token.tokenNumber)}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-medium transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No patients currently waiting in queue.
          </div>
        )}
      </div>

      {/* Skipped Buffer Section */}
      {skippedTokens && skippedTokens.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border-amber-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h4 className="font-bold text-sm text-slate-200">Skipped / Absent Patients ({skippedTokens.length})</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skippedTokens.map((token) => (
              <div
                key={token._id || token.tokenNumber}
                className="bg-slate-900/60 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-amber-300 font-mono-num">#{token.tokenNumber} - {token.patientName}</div>
                  <div className="text-[11px] text-slate-400">Skipped At: {formatTimeShort(token.updatedAt)}</div>
                </div>

                <button
                  onClick={() => checkInToken({ tokenNumber: token.tokenNumber })}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40 font-medium transition-all"
                  title="Re-insert into active queue"
                >
                  <RotateCcw className="h-3 w-3" /> Recall
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
