const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    role: {
      type: String,
      enum: ['USER', 'GUARDIAN'],
      required: true,
      default: 'USER',
    },
    fakePin: {
      type: String,
      required: true,
      default: '1234',
    },
    realPin: {
      type: String,
      required: true,
      default: '9999',
    },
    panicPin: {
      type: String,
      required: true,
      default: '0000',
    },
    guardianEmail: {
      type: String,
      lowercase: true,
      default: '',
    },
    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    riskLevel: {
      type: String,
      enum: ['GREEN', 'YELLOW', 'RED', 'BLACK'],
      default: 'GREEN',
    },
    evidenceVault: [
      {
        coverImageURL: { type: String },
        realImageURL: { type: String },
        note: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        steganographicData: { type: Buffer },
      },
    ],
    journals: [
      {
        entry: { type: String },
        riskScore: { type: Number, min: 1, max: 10 },
        detectedThreats: [String],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isSilenced: {
      type: Boolean,
      default: false,
    },
    guardianAlertSent: {
      type: Boolean,
      default: false,
    },
    connectedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
