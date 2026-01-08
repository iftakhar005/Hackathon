const User = require('../models/User');

// POST /api/auth/login
// User enters a PIN. If it's realPin, they get access to dashboard.
// If it's fakePin, return "Error" to maintain disguise.
// If it's panicPin, trigger wipe.

const handleLogin = async (req, res) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ message: 'Username and PIN required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Panic PIN: Trigger self-destruct
    if (pin === user.panicPin) {
      // Simulate wipe: reset evidence and journals
      user.evidenceVault = [];
      user.journals = [];
      user.guardianAlertSent = false;
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'DURESS_DETECTED',
        action: 'WIPE_DATA',
      });
    }

    // Fake PIN: Return "Error" to maintain disguise
    if (pin === user.fakePin) {
      return res.status(403).json({
        success: false,
        message: 'Error',
        action: 'SHOW_CALCULATOR',
      });
    }

    // Real PIN: Grant dashboard access + update lastActiveAt
    if (pin === user.realPin) {
      user.lastActiveAt = Date.now();
      user.isSilenced = false;
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Access Granted',
        action: 'UNLOCK_DASHBOARD',
        userId: user._id,
        riskLevel: user.riskLevel,
      });
    }

    // Invalid PIN
    return res.status(401).json({ message: 'Invalid PIN' });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error during login',
      error: err.message,
    });
  }
};

// POST /api/auth/register
const handleRegister = async (req, res) => {
  try {
    const { username, guardianEmail, fakePin, realPin, panicPin } = req.body;

    if (!username || !guardianEmail) {
      return res.status(400).json({ message: 'Username and Guardian Email required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = await User.create({
      username,
      guardianEmail,
      fakePin: fakePin || '1234',
      realPin: realPin || '9999',
      panicPin: panicPin || '0000',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      userId: newUser._id,
      username: newUser.username,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error during registration',
      error: err.message,
    });
  }
};

module.exports = { handleLogin, handleRegister };
