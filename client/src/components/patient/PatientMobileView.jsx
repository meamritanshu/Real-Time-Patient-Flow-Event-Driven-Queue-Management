import React, { useState, useEffect } from 'react';
import { Smartphone, Ticket, QrCode, CheckCircle2, UserCheck, Sparkles, PlusCircle } from 'lucide-react';
import { TokenCard } from './TokenCard';
import { DynamicEtaDisplay } from './DynamicEtaDisplay';
import { BookingModal } from './BookingModal';
import { useSocket } from '../../context/SocketContext';

export const PatientMobileView = () => {
  const { queueState, checkInToken, isConnected } = useSocket();
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const waitingQueue = queueState?.waitingQueue || [];
  const currentlyServing = queueState?.currentlyServing;
  const completedTokens = queueState?.completedTokens || [];

  // Combine active tokens for patient selection preview
  const allTokens = [
    ...(currentlyServing ? [currentlyServing] : []),
    ...waitingQueue,
    ...completedTokens,
  ];

  // Default select token #15 (Rahul Verma) if present, or first available token
  useEffect(() => {
    if (!selectedTokenId && allTokens.length > 0) {
      const defaultToken = allTokens.find(t => t.tokenNumber === 15) || allTokens[0];
      setSelectedTokenId(defaultToken._id || defaultToken.tokenNumber);
    }
  }, [allTokens, selectedTokenId]);

  const selectedToken = allTokens.find(
    (t) => (t._id && t._id === selectedTokenId) || t.tokenNumber === selectedTokenId
  ) || allTokens[0];

  const handleSelfCheckIn = async () => {
    if (!selectedToken) return;
    await checkInToken({ tokenNumber: selectedToken.tokenNumber });
  };

  return (
    <div className="max-w-md mx-auto py-2 px-4 space-y-4">
      {/* Simulation Selector Bar */}
      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <label className="text-[11px] font-semibold text-slate-400 shrink-0">Simulate Token:</label>
          <select
            value={selectedTokenId || ''}
            onChange={(e) => setSelectedTokenId(e.target.value)}
            className="bg-slate-950 text-xs text-cyan-300 font-mono font-bold border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {allTokens.map((t) => (
              <option key={t._id || t.tokenNumber} value={t._id || t.tokenNumber}>
                #{t.tokenNumber} - {t.patientName} ({t.status})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsBookingOpen(true)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-bold transition-all shrink-0"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Book Token
        </button>
      </div>

      {/* Smartphone Mockup Frame */}
      <div className="bg-slate-950 border-4 border-slate-800 rounded-[38px] p-4 shadow-2xl relative overflow-hidden">
        {/* Phone Speaker Notch */}
        <div className="w-32 h-4 bg-slate-900 mx-auto rounded-b-xl mb-4 flex items-center justify-center">
          <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
        </div>

        <div className="space-y-4">
          {/* Clinic Header Banner */}
          <div className="text-center border-b border-slate-900 pb-3">
            <h3 className="font-extrabold text-base text-slate-100">Apollo Health Clinic</h3>
            <p className="text-xs text-slate-400">Dr. Ananya Sharma • Cardiology OPD</p>
          </div>

          {/* Dynamic Token Hero Card */}
          <TokenCard
            selectedToken={selectedToken}
            currentServingToken={queueState?.currentServingToken}
            isConnected={isConnected}
          />

          {/* Dynamic ETA Display */}
          <DynamicEtaDisplay
            selectedToken={selectedToken}
            wmaMinutes={queueState?.wmaMinutes || 10}
            queueStatus={queueState?.status || 'ACTIVE'}
          />

          {/* Self Check-In Action Button */}
          {selectedToken && selectedToken.status === 'BOOKED' && (
            <button
              onClick={handleSelfCheckIn}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] transition-all"
            >
              <QrCode className="h-5 w-5" />
              <span>Self Check-In (Confirm Arrival)</span>
            </button>
          )}

          {selectedToken && selectedToken.status === 'CHECKED_IN' && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-cyan-300 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Checked-In Successfully</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">You are verified in the clinic waiting lounge.</p>
            </div>
          )}
        </div>

        {/* Bottom Phone Home Indicator Bar */}
        <div className="w-28 h-1 bg-slate-800 rounded-full mx-auto mt-6"></div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSelectNewToken={(newToken) => setSelectedTokenId(newToken._id || newToken.tokenNumber)}
      />
    </div>
  );
};
