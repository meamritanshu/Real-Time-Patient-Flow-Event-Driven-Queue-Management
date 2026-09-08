import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'EMERGENCY'],
      default: 'BOOKED',
      index: true,
    },
    bookingTime: {
      type: Date,
      default: Date.now,
    },
    checkInTime: {
      type: Date,
    },
    consultationStartTime: {
      type: Date,
    },
    consultationEndTime: {
      type: Date,
    },
    priorityScore: {
      type: Number,
      default: 0, // Emergency triage = 100
    },
  },
  {
    timestamps: true,
  }
);

tokenSchema.index({ doctorId: 1, status: 1 });
tokenSchema.index({ doctorId: 1, tokenNumber: 1 });
tokenSchema.index({ doctorId: 1, bookingTime: 1, status: 1 });
tokenSchema.index({ doctorId: 1, bookingTime: 1, tokenNumber: 1 });

export const Token = mongoose.model('Token', tokenSchema);
