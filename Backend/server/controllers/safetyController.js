const User = require('../models/User');

// GET /api/safety/status/:userId
// Checks if user is "silent" (no check-in for >24h)
// Returns: GREEN (safe), YELLOW (warning), RED (critical), BLACK (duress)

const getStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = Date.now();
    const lastActive = new Date(user.lastActiveAt).getTime();
    const silenceDuration = now - lastActive;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    let riskLevel = 'GREEN';
    let alertSent = false;

    if (silenceDuration > TWENTY_FOUR_HOURS) {
      riskLevel = 'BLACK';
      user.isSilenced = true;
      alertSent = !user.guardianAlertSent; // True if first time alert

      if (!user.guardianAlertSent) {
        user.guardianAlertSent = true;
        await user.save();
        // TODO: Send email to guardianEmail with alert
      }
    } else if (silenceDuration > 12 * 60 * 60 * 1000) {
      riskLevel = 'RED';
    } else if (silenceDuration > 6 * 60 * 60 * 1000) {
      riskLevel = 'YELLOW';
    }

    return res.status(200).json({
      userId: user._id,
      username: user.username,
      riskLevel,
      lastActiveAt: user.lastActiveAt,
      silenceDuration: Math.floor(silenceDuration / 1000 / 60), // minutes
      alertSentToGuardian: alertSent,
      isSilenced: user.isSilenced,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error fetching status',
      error: err.message,
    });
  }
};

// POST /api/safety/checkin/:userId
// User manually checks in (updates lastActiveAt)

const handleCheckIn = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastActiveAt = Date.now();
    user.isSilenced = false;
    await user.save();

    return res.status(200).json({
      message: 'Check-in successful',
      lastActiveAt: user.lastActiveAt,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error during check-in',
      error: err.message,
    });
  }
};

// POST /api/safety/journal
// User logs a journal entry. Backend runs sentiment analysis (simulated).

const logJournal = async (req, res) => {
  try {
    const { userId, entry } = req.body;

    if (!userId || !entry) {
      return res.status(400).json({ message: 'UserId and entry required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Simulated sentiment analysis (keywords detection)
    const riskKeywords = [
      'danger',
      'hurt',
      'afraid',
      'scared',
      'threat',
      'abuse',
      'help',
    ];
    const detectedThreats = riskKeywords.filter((keyword) =>
      entry.toLowerCase().includes(keyword)
    );

    const riskScore = detectedThreats.length > 0 ? detectedThreats.length * 2 : 1;

    user.journals.push({
      entry,
      riskScore: Math.min(riskScore, 10),
      detectedThreats,
    });

    // Update user risk level based on journal analysis
    if (riskScore >= 8) {
      user.riskLevel = 'RED';
    } else if (riskScore >= 5) {
      user.riskLevel = 'YELLOW';
    }

    await user.save();

    return res.status(201).json({
      message: 'Journal entry logged',
      riskScore: Math.min(riskScore, 10),
      detectedThreats,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error logging journal',
      error: err.message,
    });
  }
};

// GET /api/guardian/users/:guardianId
// Get all connected users for a guardian
const getConnectedUsers = async (req, res) => {
  try {
    const { guardianId } = req.params;

    const guardian = await User.findById(guardianId).populate('connectedUsers', 'username riskLevel lastActiveAt');
    if (!guardian) {
      return res.status(404).json({ message: 'Guardian not found' });
    }

    if (guardian.role !== 'GUARDIAN') {
      return res.status(403).json({ message: 'User is not a guardian' });
    }

    return res.status(200).json({
      guardianUsername: guardian.username,
      connectedUsers: guardian.connectedUsers || [],
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error fetching users',
      error: err.message,
    });
  }
};

module.exports = { getStatus, handleCheckIn, logJournal, getConnectedUsers };
