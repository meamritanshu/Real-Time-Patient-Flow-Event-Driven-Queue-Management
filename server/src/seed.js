import dotenv from 'dotenv';
dotenv.config();

import { connectDB, closeDB } from './config/db.js';
import { QueueState } from './models/QueueState.js';
import { Token } from './models/Token.js';
import { invalidateRedisCache } from './services/queueService.js';

const seedData = async () => {
  console.log('🌱 Seeding default queue data for Dr. Ananya Sharma (dr_sharma_01)...');

  await connectDB();

  const doctorId = 'dr_sharma_01';
  const clinicId = 'apollo_main_01';
  
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  // Clear existing tokens and state for dr_sharma_01
  await QueueState.deleteMany({ doctorId, date });
  await Token.deleteMany({ doctorId });

  // Create QueueState
  await QueueState.create({
    clinicId,
    doctorId,
    date,
    currentServingToken: 12,
    lastIssuedToken: 16,
    status: 'ACTIVE',
    recentConsultationDurations: [12, 14, 9, 11],
  });

  const now = new Date();

  const tokens = [
    {
      tokenNumber: 10,
      patientName: 'Rajesh Kumar',
      phoneNumber: '+91 98765 43210',
      doctorId,
      status: 'COMPLETED',
      bookingTime: new Date(now.getTime() - 90 * 60 * 1000),
      checkInTime: new Date(now.getTime() - 80 * 60 * 1000),
      consultationStartTime: new Date(now.getTime() - 65 * 60 * 1000),
      consultationEndTime: new Date(now.getTime() - 51 * 60 * 1000),
      priorityScore: 0,
    },
    {
      tokenNumber: 11,
      patientName: 'Sunita Devi',
      phoneNumber: '+91 98123 45678',
      doctorId,
      status: 'COMPLETED',
      bookingTime: new Date(now.getTime() - 75 * 60 * 1000),
      checkInTime: new Date(now.getTime() - 65 * 60 * 1000),
      consultationStartTime: new Date(now.getTime() - 50 * 60 * 1000),
      consultationEndTime: new Date(now.getTime() - 39 * 60 * 1000),
      priorityScore: 0,
    },
    {
      tokenNumber: 12,
      patientName: 'Priya Patel',
      phoneNumber: '+91 99887 76655',
      doctorId,
      status: 'IN_CONSULTATION',
      bookingTime: new Date(now.getTime() - 60 * 60 * 1000),
      checkInTime: new Date(now.getTime() - 35 * 60 * 1000),
      consultationStartTime: new Date(now.getTime() - 4 * 60 * 1000), // 4 mins into consultation
      priorityScore: 0,
    },
    {
      tokenNumber: 13,
      patientName: 'Vikram Malhotra',
      phoneNumber: '+91 97112 23344',
      doctorId,
      status: 'CHECKED_IN',
      bookingTime: new Date(now.getTime() - 45 * 60 * 1000),
      checkInTime: new Date(now.getTime() - 15 * 60 * 1000),
      priorityScore: 0,
    },
    {
      tokenNumber: 14,
      patientName: 'Neha Sharma',
      phoneNumber: '+91 95432 10987',
      doctorId,
      status: 'CHECKED_IN',
      bookingTime: new Date(now.getTime() - 30 * 60 * 1000),
      checkInTime: new Date(now.getTime() - 8 * 60 * 1000),
      priorityScore: 0,
    },
    {
      tokenNumber: 15,
      patientName: 'Rahul Verma',
      phoneNumber: '+91 96543 21098',
      doctorId,
      status: 'BOOKED',
      bookingTime: new Date(now.getTime() - 20 * 60 * 1000),
      priorityScore: 0,
    },
    {
      tokenNumber: 16,
      patientName: 'Amit Singh',
      phoneNumber: '+91 91234 56789',
      doctorId,
      status: 'BOOKED',
      bookingTime: new Date(now.getTime() - 10 * 60 * 1000),
      priorityScore: 0,
    },
  ];

  await Token.insertMany(tokens);
  await invalidateRedisCache(doctorId);

  console.log('✅ Seed completed successfully! Created 7 initial tokens for dr_sharma_01.');
  await closeDB();
  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Error seeding data:', err);
  process.exit(1);
});
