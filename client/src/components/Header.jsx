import React from 'react';
import { Activity, Stethoscope, Smartphone, Layers, RefreshCw, Zap } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const Header = ({ activeView, setActiveView }) => {
  const { isConnected, doctorId, setDoctorId, refreshState, queueState } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight text-slate-100">
                Medi<span className="text-cyan-400">Q</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                Event-Driven Flow Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Real-Time Patient Flow & Dynamic ETA Queue Management</p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveView('desk')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'desk'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Clinic Control Desk</span>
          </button>

          <button
            onClick={() => setActiveView('patient')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'patient'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Patient View</span>
          </button>

          <button
            onClick={() => setActiveView('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'split'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Side-by-Side Dual View</span>
          </button>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3">
          {/* Doctor Switcher */}
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="dr_sharma_01">Dr. Ananya Sharma (Cardiology)</option>
            <option value="dr_mehta_02">Dr. Rajesh Mehta (Orthopedics)</option>
          </select>

          {/* Live Socket Connection Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              )}
            </span>
            <span className="text-xs font-medium text-slate-300">
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-emerald-400" /> Live WebSocket
                </span>
              ) : (
                'Connecting...'
              )}
            </span>
          </div>

          <button
            onClick={refreshState}
            title="Refresh Queue State"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
