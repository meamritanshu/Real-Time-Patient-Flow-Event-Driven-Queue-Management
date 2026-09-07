import { getQueueSnapshot } from '../services/queueService.js';

export const setupQueueSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client joins room by doctorId
    socket.on('join_doctor_room', async (doctorId) => {
      if (!doctorId) return;

      // Explicitly track current room and leave any existing rooms before joining new one
      if (socket.currentDoctorId) {
        socket.leave(socket.currentDoctorId);
      }

      socket.currentDoctorId = doctorId;
      socket.join(doctorId);
      console.log(`📌 Socket ${socket.id} joined room for doctor: ${doctorId}`);

      // Send initial queue state snapshot to the newly joined client
      try {
        const snapshot = await getQueueSnapshot(doctorId);
        socket.emit('queue:state_updated', snapshot);
      } catch (err) {
        console.error('Error fetching initial queue snapshot for socket:', err.message);
      }
    });

    socket.on('leave_doctor_room', (doctorId) => {
      if (!doctorId) return;
      socket.leave(doctorId);
      if (socket.currentDoctorId === doctorId) {
        socket.currentDoctorId = null;
      }
      console.log(`📌 Socket ${socket.id} left room: ${doctorId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};
