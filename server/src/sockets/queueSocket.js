import { getQueueSnapshot } from '../services/queueService.js';

export const setupQueueSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client joins room by doctorId
    socket.on('join_doctor_room', async (doctorId) => {
      if (!doctorId) return;
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
      console.log(`📌 Socket ${socket.id} left room: ${doctorId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};
