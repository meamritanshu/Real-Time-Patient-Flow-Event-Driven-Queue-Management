import React, { useState } from 'react';
import { AlertOctagon, X, ShieldAlert } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const EmergencyModal = ({ isOpen, onClose }) => {
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const { insertEmergency } = useSocket();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    setLoading(true);
    await insertEmergency({ patientName, phoneNumber });
    setLoading(false);
    setPatientName('');
    setPhoneNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-600 to-amber-500"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/40">
              <AlertOctagon className="h-6 w-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">Emergency Triage Insertion</h3>
              <p className="text-xs text-rose-300">Urgent priority patient queue bypass</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-4 text-xs text-rose-200 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span>
            Inserting an emergency patient immediately moves them to <strong>Top Priority (Behind Active Consultation)</strong> with Priority Score 100.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Chandra (Chest Pain)"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="+91 98765 00000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
            >
              <AlertOctagon className="h-4 w-4" />
              <span>{loading ? 'Inserting...' : 'Insert Urgent Patient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
