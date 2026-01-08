const User = require('../models/User');
const Plant = require('../models/Plant');
const { encryptJournal, transformToMetaphor, analyzeSentiment } = require('../utils/encryption');

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

// POST /api/safety/journal-with-photo
// User logs a journal entry with optional photo
const logJournalWithPhoto = async (req, res) => {
  try {
    const { userId, plantId, entry } = req.body;
    const photoFile = req.file;

    if (!userId || !entry) {
      return res.status(400).json({ message: 'UserId and entry required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plant = plantId ? await Plant.findById(plantId) : null;

    // Simulated sentiment analysis
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

    // Save journal entry
    const journalEntry = {
      entry,
      riskScore: Math.min(riskScore, 10),
      detectedThreats,
      photoPath: photoFile ? `/uploads/${photoFile.filename}` : null,
      createdAt: new Date(),
      plantId: plantId || null,
    };

    if (!user.journals) {
      user.journals = [];
    }
    user.journals.push(journalEntry);

    // Update plant lastWatered if associated with a plant
    if (plant) {
      plant.lastWatered = new Date();
      await plant.save();
    }

    // Update user risk level based on journal analysis
    if (riskScore >= 8) {
      user.riskLevel = 'RED';
    } else if (riskScore >= 5) {
      user.riskLevel = 'YELLOW';
    }

    await user.save();

    return res.status(201).json({
      message: 'Journal entry with photo logged',
      riskScore: Math.min(riskScore, 10),
      detectedThreats,
      photoPath: journalEntry.photoPath,
    });
  } catch (err) {
    console.error('❌ Journal with photo error:', err);
    return res.status(500).json({
      message: 'Server error logging journal',
      error: err.message,
    });
  }
};
  try {
    const { guardianId } = req.params;

    const guardian = await User.findById(guardianId);
    if (!guardian) {
      return res.status(404).json({ message: 'Guardian not found' });
    }

    if (guardian.role !== 'GUARDIAN') {
      return res.status(403).json({ message: 'User is not a guardian' });
    }

    // Find all users who have this guardian as their guardianId
    const connectedUsers = await User.find({
      guardianId: guardianId,
      role: 'USER',
    }).select('_id username riskLevel lastActiveAt');

    return res.status(200).json({
      guardianUsername: guardian.username,
      connectedUsers: connectedUsers || [],
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error fetching users',
      error: err.message,
    });
  }
};

// GET /api/guardian/users/:guardianId/plants
// Get all plants for all connected users
const getConnectedUsersPlants = async (req, res) => {
  try {
    const { guardianId } = req.params;

    const guardian = await User.findById(guardianId);
    if (!guardian) {
      return res.status(404).json({ message: 'Guardian not found' });
    }

    if (guardian.role !== 'GUARDIAN') {
      return res.status(403).json({ message: 'User is not a guardian' });
    }

    // Find all users connected to this guardian
    const connectedUsers = await User.find({
      guardianId: guardianId,
      role: 'USER',
    }).select('_id username riskLevel lastActiveAt');

    // Fetch plants for all connected users
    const usersWithPlants = [];
    for (const user of connectedUsers) {
      const plants = await Plant.find({ userId: user._id }).sort({ plantedAt: -1 });
      usersWithPlants.push({
        _id: user._id,
        username: user.username,
        riskLevel: user.riskLevel,
        lastActiveAt: user.lastActiveAt,
        plants: plants,
        plantCount: plants.length,
      });
    }

    return res.status(200).json({
      guardianUsername: guardian.username,
      connectedUsers: usersWithPlants,
      totalUsers: usersWithPlants.length,
    });
  } catch (err) {
    console.error('❌ Get connected users plants error:', err);
    return res.status(500).json({
      message: 'Server error fetching plants',
      error: err.message,
    });
  }
};

// ===== NEW PLANT GARDEN SYSTEM =====

// POST /api/safety/plant
// User plants a new flower. Notifies caregiver.
const plantFlower = async (req, res) => {
  try {
    const { userId, flowerType } = req.body;

    if (!userId || !flowerType) {
      return res.status(400).json({ message: 'userId and flowerType required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new plant
    const plant = new Plant({
      userId,
      flowerType,
      plantedAt: new Date(),
    });

    await plant.save();

    // Get flower display name
    const flowerNames = {
      green_fern: 'Green Fern',
      white_lily: 'White Lily',
      red_rose: 'Red Rose',
      yellow_wheat: 'Yellow Wheat',
      withered_leaf: 'Withered Leaf',
    };

    return res.status(201).json({
      message: 'Plant created successfully',
      plant,
      flowerName: flowerNames[flowerType],
      notificationSent: true, // TODO: Send to guardian
    });
  } catch (err) {
    console.error('❌ Plant creation error:', err);
    return res.status(500).json({
      message: 'Server error planting flower',
      error: err.message,
    });
  }
};

// GET /api/safety/plants/:userId
// Get all plants for a user
const getPlantedFlowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plants = await Plant.find({ userId }).sort({ plantedAt: -1 });

    return res.status(200).json({
      message: 'Plants retrieved successfully',
      plants,
      count: plants.length,
    });
  } catch (err) {
    console.error('❌ Get plants error:', err);
    return res.status(500).json({
      message: 'Server error fetching plants',
      error: err.message,
    });
  }
};

// POST /api/safety/water-plant/:plantId
// Water a specific plant (interaction)
const waterPlant = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { userId } = req.body;

    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // Check ownership
    if (plant.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized: plant not owned by user' });
    }

    plant.lastWatered = new Date();
    await plant.save();

    return res.status(200).json({
      message: 'Plant watered successfully',
      plant,
      notificationSent: true, // TODO: Send to guardian
    });
  } catch (err) {
    console.error('❌ Water plant error:', err);
    return res.status(500).json({
      message: 'Server error watering plant',
      error: err.message,
    });
  }
};

// DELETE /api/safety/remove-plant/:plantId
// Remove a plant from garden
const removePlant = async (req, res) => {
  try {
    const { plantId } = req.params;
    const { userId } = req.body;

    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // Check ownership
    if (plant.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized: plant not owned by user' });
    }

    await Plant.findByIdAndDelete(plantId);

    return res.status(200).json({
      message: 'Plant removed successfully',
      notificationSent: true, // TODO: Send to guardian
    });
  } catch (err) {
    console.error('❌ Remove plant error:', err);
    return res.status(500).json({
      message: 'Server error removing plant',
      error: err.message,
    });
  }
};

module.exports = {
  getStatus,
  handleCheckIn,
  logJournal,
  logJournalWithPhoto,
  getConnectedUsers,
  getConnectedUsersPlants,
  plantFlower,
  getPlantedFlowers,
  waterPlant,
  removePlant,
};
