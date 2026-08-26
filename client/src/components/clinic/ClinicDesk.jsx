import React, { useState } from 'react';
import { ActiveConsultationCard } from './ActiveConsultationCard';
import { ControlBar } from './ControlBar';
import { QueueTable } from './QueueTable';
import { EmergencyModal } from './EmergencyModal';
import { useSocket } from '../../context/SocketContext';
import { Stethoscope, Building2 } from 'lucide-react';

export const ClinicDesk = () => {
  const { queueState, loading, error } = useSocket();
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  if (loading && !queueState) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
        <p className="text-sm text-slate-400">Loading Clinic Control Desk...</p>
      </div>
    );
  }

  if (error && !queueState) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center max-w-lg mx-auto my-10">
        <h3 className="text-rose-400 font-bold text-lg">Error Loading Queue</h3>
        <p className="text-xs text-rose-300 mt-1">{error}</p>
      </div>
    );
  }

  const doctorName = queueState?.doctorId === 'dr_sharma_01' ? 'Dr. Ananya Sharma' : 'Dr. Rajesh Mehta';
  const clinicName = 'Apollo Health Clinic (Cardiology Dept)';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Desk Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Stethoscope className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              {doctorName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>{clinicName}</span>
              <span>•</span>
              <span className="font-mono">Date: {queueState?.date}</span>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Issued</div>
            <div className="text-base font-extrabold font-mono-num text-cyan-400">#{queueState?.lastIssuedToken || 0}</div>
          </div>

          <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Currently Serving</div>
            <div className="text-base font-extrabold font-mono-num text-emerald-400">
              {queueState?.currentServingToken ? `#${queueState.currentServingToken}` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Consultation Hero Card */}
      <ActiveConsultationCard
        currentlyServing={queueState?.currentlyServing}
        queueStatus={queueState?.status || 'ACTIVE'}
        wmaMinutes={queueState?.wmaMinutes || 10}
      />

      {/* Action Controls */}
      <ControlBar onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)} />

      {/* Live Queue Table & Buffer */}
      <QueueTable
        waitingQueue={queueState?.waitingQueue || []}
        skippedTokens={queueState?.skippedTokens || []}
        completedCount={queueState?.completedCount || 0}
      />

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </div>
  );
};
