const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    riskScore: { type: Number, min: 1, max: 10, default: 0 },
    detectedThreats: [{ type: String }], // Array of detected threats from AI
  },
  { timestamps: true }
);

module.exports = mongoose.model('Journal', JournalSchema);
