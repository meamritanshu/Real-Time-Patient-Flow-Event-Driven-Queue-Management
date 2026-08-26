import * as queueService from '../services/queueService.js';

/**
 * Helper to emit real-time Socket.io events after state changes
 */
const broadcastStateUpdate = async (io, doctorId, eventType, extraData = {}) => {
  try {
    const freshState = await queueService.getQueueSnapshot(doctorId);
    io.to(doctorId).emit('queue:state_updated', freshState);
    if (eventType) {
      io.to(doctorId).emit(eventType, { ...extraData, state: freshState });
    }
    // Emit updated ETAs broadcast
    io.to(doctorId).emit('queue:eta_updated', {
      doctorId,
      wmaMinutes: freshState.wmaMinutes,
      waitingQueue: freshState.waitingQueue,
    });
  } catch (error) {
    console.error('Error broadcasting state update:', error.message);
  }
};

export const getState = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const snapshot = await queueService.getQueueSnapshot(doctorId);
    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const bookToken = async (req, res) => {
  try {
    const { clinicId, doctorId, patientName, phoneNumber, isEmergency } = req.body;
    if (!doctorId || !patientName) {
      return res.status(400).json({ success: false, message: 'doctorId and patientName are required' });
    }

    const result = await queueService.bookToken({
      clinicId,
      doctorId,
      patientName,
      phoneNumber,
      isEmergency,
    });

    const io = req.app.get('io');
    await broadcastStateUpdate(io, doctorId, isEmergency ? 'queue:emergency_alert' : null, {
      token: result.newToken,
    });

    return res.status(201).json({ success: true, data: result.newToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkInToken = async (req, res) => {
  try {
    const { doctorId, tokenNumber, tokenId } = req.body;
    const updatedToken = await queueService.checkInToken({ doctorId, tokenNumber, tokenId });

    const io = req.app.get('io');
    await broadcastStateUpdate(io, updatedToken.doctorId);

    return res.status(200).json({ success: true, data: updatedToken });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const callNextPatient = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId is required' });
    }

    const nextToken = await queueService.callNextPatient(doctorId);
    if (!nextToken) {
      return res.status(200).json({ success: true, message: 'No waiting patients in queue', data: null });
    }

    const io = req.app.get('io');
    await broadcastStateUpdate(io, doctorId, 'queue:next_called', { calledToken: nextToken });

    return res.status(200).json({ success: true, data: nextToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const completeConsultation = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId is required' });
    }

    const result = await queueService.completeConsultation(doctorId);

    const io = req.app.get('io');
    await broadcastStateUpdate(io, doctorId);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const skipPatient = async (req, res) => {
  try {
    const { doctorId, tokenNumber } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId is required' });
    }

    const skippedToken = await queueService.skipPatient(doctorId, tokenNumber);

    const io = req.app.get('io');
    await broadcastStateUpdate(io, doctorId);

    return res.status(200).json({ success: true, data: skippedToken });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const insertEmergencyPatient = async (req, res) => {
  try {
    const { doctorId, patientName, phoneNumber } = req.body;
    if (!doctorId || !patientName) {
      return res.status(400).json({ success: false, message: 'doctorId and patientName are required' });
    }

    const emergencyToken = await queueService.insertEmergencyPatient({ doctorId, patientName, phoneNumber });

    const io = req.app.get('io');
    await broadcastStateUpdate(io, doctorId, 'queue:emergency_alert', { emergencyToken });

    return res.status(201).json({ success: true, data: emergencyToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleQueuePause = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId is required' });
    }

    const updatedState = await queueService.toggleQueuePause(doctorId);

    const io = req.app.get('io');
    await broadcastStateUpdate(io, doctorId);

    return res.status(200).json({ success: true, data: updatedState });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
