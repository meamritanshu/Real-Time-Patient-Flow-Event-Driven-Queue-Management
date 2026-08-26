import mongoose from 'mongoose';

const queueStateSchema = new mongoose.Schema(
  {
    clinicId: {
      type: String,
      required: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      // Format YYYY-MM-DD
    },
    currentServingToken: {
      type: Number,
      default: 0,
    },
    lastIssuedToken: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED'],
      default: 'ACTIVE',
    },
    recentConsultationDurations: {
      type: [Number],
      default: [10], // Default 10 minutes baseline
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index on doctorId and date
queueStateSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const QueueState = mongoose.model('QueueState', queueStateSchema);
