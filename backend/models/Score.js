const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  playerName: { type: String, required: false },
  score: { type: Number, required: true, default: 0 },
  level: { type: Number, required: false },
  timeCompleted: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  savedAt: { type: Date },
});

// Índice para consultas de leaderboard
scoreSchema.index({ score: -1 });

module.exports = mongoose.model("Score", scoreSchema);
