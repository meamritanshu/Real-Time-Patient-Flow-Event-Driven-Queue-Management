import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [doctorId, setDoctorId] = useState('dr_sharma_01');
  const [queueState, setQueueState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketUri = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/';
    const socketInstance = io(socketUri, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected:', socketInstance.id);
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch initial REST state and join doctor room
  const fetchQueueState = useCallback(async (targetDoctorId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/queue/state/${targetDoctorId}`);
      const data = await res.json();
      if (data.success) {
        setQueueState(data.data);
        setLastUpdated(new Date().toISOString());
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track disconnection time for automated state resync
  const disconnectTimeRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handleDisconnect = () => {
      disconnectTimeRef.current = Date.now();
    };
    const handleConnect = () => {
      if (disconnectTimeRef.current && Date.now() - disconnectTimeRef.current > 5000) {
        console.log('🔄 Reconnected after > 5s, fetching fresh state...');
        fetchQueueState(doctorId);
      }
      disconnectTimeRef.current = null;
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
    }
  }, [socket, doctorId, fetchQueueState]);

  // Handle room joining & real-time socket events
  useEffect(() => {
    if (!socket || !doctorId) return;

    // Join doctor socket room
    socket.emit('join_doctor_room', doctorId);
    fetchQueueState(doctorId);

    const handleStateUpdated = (updatedSnapshot) => {
      console.log('📡 Real-time queue:state_updated received', updatedSnapshot);
      if (updatedSnapshot.doctorId === doctorId) {
        setQueueState(updatedSnapshot);
        setLastUpdated(new Date().toISOString());
      }
    };

    const handleNextCalled = (data) => {
      if (data.calledToken) {
        setToastNotification({
          type: 'info',
          title: '📢 Next Patient Called',
          message: `Token #${data.calledToken.tokenNumber} - ${data.calledToken.patientName}`,
        });
        setTimeout(() => setToastNotification(null), 4000);
      }
    };

    const handleEmergencyAlert = (data) => {
      const emergency = data.token || data.emergencyToken;
      setToastNotification({
        type: 'danger',
        title: '🚨 Emergency Triage Alert',
        message: `Urgent insertion for Token #${emergency?.tokenNumber || ''} (${emergency?.patientName || 'Patient'})`,
      });
      setTimeout(() => setToastNotification(null), 5000);
    };

    socket.on('queue:state_updated', handleStateUpdated);
    socket.on('queue:next_called', handleNextCalled);
    socket.on('queue:emergency_alert', handleEmergencyAlert);

    return () => {
      socket.emit('leave_doctor_room', doctorId);
      socket.off('queue:state_updated', handleStateUpdated);
      socket.off('queue:next_called', handleNextCalled);
      socket.off('queue:emergency_alert', handleEmergencyAlert);
    };
  }, [socket, doctorId, fetchQueueState]);

  // Action helpers calling backend REST endpoints (which emit socket updates)
  const callNext = async () => {
    try {
      const res = await fetch('/api/queue/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to call next:', err);
    }
  };

  const completeConsultation = async () => {
    try {
      const res = await fetch('/api/queue/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to complete consultation:', err);
    }
  };

  const skipPatient = async (tokenNumber) => {
    try {
      const res = await fetch('/api/queue/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, tokenNumber }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to skip patient:', err);
    }
  };

  const insertEmergency = async ({ patientName, phoneNumber }) => {
    try {
      const res = await fetch('/api/queue/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, patientName, phoneNumber }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to insert emergency:', err);
    }
  };

  const togglePause = async () => {
    try {
      const res = await fetch('/api/queue/toggle-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to toggle pause:', err);
    }
  };

  const bookToken = async ({ patientName, phoneNumber }) => {
    try {
      const res = await fetch('/api/queue/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, patientName, phoneNumber }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to book token:', err);
    }
  };

  const checkInToken = async ({ tokenNumber, tokenId }) => {
    try {
      const res = await fetch('/api/queue/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, tokenNumber, tokenId }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to check in token:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        doctorId,
        setDoctorId,
        queueState,
        loading,
        error,
        toastNotification,
        lastUpdated,
        refreshState: () => fetchQueueState(doctorId),
        callNext,
        completeConsultation,
        skipPatient,
        insertEmergency,
        togglePause,
        bookToken,
        checkInToken,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
