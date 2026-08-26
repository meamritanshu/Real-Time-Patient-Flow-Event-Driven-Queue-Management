import express from 'express';
import * as queueController from '../controllers/queueController.js';

const router = express.Router();

router.get('/state/:doctorId', queueController.getState);
router.post('/book', queueController.bookToken);
router.post('/checkin', queueController.checkInToken);
router.post('/next', queueController.callNextPatient);
router.post('/complete', queueController.completeConsultation);
router.post('/skip', queueController.skipPatient);
router.post('/emergency', queueController.insertEmergencyPatient);
router.post('/toggle-pause', queueController.toggleQueuePause);

export default router;
