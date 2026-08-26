import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Header } from './components/Header';
import { ClinicDesk } from './components/clinic/ClinicDesk';
import { PatientMobileView } from './components/patient/PatientMobileView';
import { AlertCircle, X, Sparkles } from 'lucide-react';

const AppContent = () => {
  const [activeView, setActiveView] = useState('split');
  const { toastNotification } = useSocket();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Header activeView={activeView} setActiveView={setActiveView} />

      {/* Global Real-Time Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md max-w-sm ${
            toastNotification.type === 'danger'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
              : 'bg-cyan-950/90 border-cyan-500/50 text-cyan-100'
          }`}>
            <Sparkles className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <h4 className="font-extrabold text-sm">{toastNotification.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{toastNotification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6">
        {activeView === 'desk' && <ClinicDesk />}

        {activeView === 'patient' && <PatientMobileView />}

        {activeView === 'split' && (
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Clinic Control Desk (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span>👨‍⚕️ Interface 1: Clinic Control Desk</span>
                </h3>
                <span className="text-[11px] text-slate-400">Doctor / Receptionist View</span>
              </div>
              <ClinicDesk />
            </div>

            {/* Right Column: Patient Mobile View (5 Cols) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span>📱 Interface 2: Patient Mobile View</span>
                </h3>
                <span className="text-[11px] text-slate-400">Live Sync Preview</span>
              </div>
              <PatientMobileView />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        MediQ • Real-Time Patient Flow & Event-Driven Queue Management Engine
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
