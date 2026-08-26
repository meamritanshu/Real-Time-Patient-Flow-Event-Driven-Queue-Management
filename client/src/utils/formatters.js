export const formatMinutesToMMSS = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const formatTimeShort = (dateString) => {
  if (!dateString) return '--:--';
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'EMERGENCY':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    case 'IN_CONSULTATION':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'CHECKED_IN':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'BOOKED':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    case 'SKIPPED':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'COMPLETED':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    default:
      return 'bg-slate-700 text-slate-300 border-slate-600';
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'EMERGENCY':
      return '🚨 Emergency Triage';
    case 'IN_CONSULTATION':
      return '👨‍⚕️ In Consultation';
    case 'CHECKED_IN':
      return '✅ Checked In';
    case 'BOOKED':
      return '📌 Booked';
    case 'SKIPPED':
      return '⏸️ Skipped';
    case 'COMPLETED':
      return '🏁 Completed';
    default:
      return status;
  }
};
