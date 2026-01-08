const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    flowerType: {
      type: String,
      enum: ['green_fern', 'white_lily', 'red_rose', 'yellow_wheat', 'withered_leaf'],
      required: true,
    },
    plantedAt: {
      type: Date,
      default: Date.now,
    },
    lastWatered: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['healthy', 'wilting', 'dead'],
      default: 'healthy',
    },
    notificationSentToGuardian: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plant', PlantSchema);
