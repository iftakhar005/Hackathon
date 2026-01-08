const User = require('../models/User');

// POST /api/auth/login
// Device Binding Version: Accepts { userId, pin } where userId comes from localStorage
// This PIN-only login is for devices that have been "bound" to a specific user
// If realPin matches -> Return { mode: "DASHBOARD", userId, token }
// If fakePin matches -> Return { mode: "CALCULATOR_ERROR" }
// If panicPin matches -> Return { mode: "PANIC_TRIGGERED" }
// If no userId found -> Return { mode: "CALCULATOR_ERROR" }

const handleLogin = async (req, res) => {
  try {
    const { userId, pin } = req.body;

    // Guard: Check if userId is provided
    if (!userId || !pin) {
      return res.status(400).json({ 
        mode: 'CALCULATOR_ERROR',
        message: 'Device not properly configured'
      });
    }

    // Find user by userId (not username)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        mode: 'CALCULATOR_ERROR',
        message: 'Device binding lost. Please reconfigure.'
      });
    }

    // Panic PIN: Trigger self-destruct
    if (pin === user.panicPin) {
      user.evidenceVault = [];
      user.journals = [];
      user.guardianAlertSent = false;
      await user.save();
      return res.status(200).json({
        mode: 'PANIC_TRIGGERED',
        success: true,
        message: 'DURESS_DETECTED',
      });
    }

    // Fake PIN: Return error to maintain calculator disguise
    if (pin === user.fakePin) {
      return res.status(403).json({
        mode: 'CALCULATOR_ERROR',
        success: false,
        message: 'Error',
      });
    }

    // Real PIN: Grant dashboard access + update lastActiveAt
    if (pin === user.realPin) {
      user.lastActiveAt = Date.now();
      user.isSilenced = false;
      await user.save();
      
      // Generate a simple session token (in production, use JWT)
      const token = Buffer.from(userId).toString('base64');
      
      return res.status(200).json({
        mode: 'DASHBOARD',
        success: true,
        message: 'Access Granted',
        userId: user._id,
        username: user.username,
        token: token,
        riskLevel: user.riskLevel,
      });
    }

    // Invalid PIN - return calculator error
    return res.status(401).json({ 
      mode: 'CALCULATOR_ERROR',
      message: 'Invalid PIN'
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error during login',
      error: err.message,
    });
  }
};

// POST /api/auth/register
// Device Binding Version: One-time setup to bind a device to a user
// Returns userId which must be saved to localStorage as 'mycelium_device_id'
// This userId is then used for all future PIN-based logins on this device

const handleRegister = async (req, res) => {
  try {
    // Normalize inputs to avoid whitespace/duplicate-key issues
    const cleanUsername = (req.body.username || '').trim();
    const cleanRole = (req.body.role || '').trim();
    const cleanGuardianEmail = (req.body.guardianEmail || '').trim();
    const cleanGuardianId = (req.body.guardianId || '').trim();
    const { fakePin, realPin, panicPin } = req.body;

    console.log('📝 Registration Request:', {
      username: cleanUsername,
      role: cleanRole,
      guardianEmail: cleanGuardianEmail,
      guardianId: cleanGuardianId,
      fakePin,
      realPin,
      panicPin,
    });

    if (!cleanUsername || !cleanRole) {
      return res.status(400).json({ message: 'Username and role (USER/GUARDIAN) required' });
    }

    if (!['USER', 'GUARDIAN'].includes(cleanRole)) {
      return res.status(400).json({ message: 'Role must be USER or GUARDIAN' });
    }

    // Users can provide either guardianEmail OR guardianId, but must provide at least one
    if (cleanRole === 'USER' && !cleanGuardianEmail && !cleanGuardianId) {
      return res.status(400).json({ message: 'Guardian Email OR Guardian ID is required for USER role' });
    }

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // If guardianId is provided, verify it exists and is a GUARDIAN
    if (cleanGuardianId) {
      const guardian = await User.findById(cleanGuardianId);
      if (!guardian) {
        return res.status(404).json({ message: 'Guardian ID not found' });
      }
      if (guardian.role !== 'GUARDIAN') {
        return res.status(400).json({ message: 'User with provided ID is not a Guardian' });
      }
    }

    const newUser = await User.create({
      username: cleanUsername,
      role: cleanRole,
      guardianEmail: cleanGuardianEmail || '',
      guardianId: cleanGuardianId || null,
      fakePin: fakePin || '1234',
      realPin: realPin || '9999',
      panicPin: panicPin || '0000',
    });

    console.log('✅ User created:', newUser._id);

    return res.status(201).json({
      message: 'Device setup complete. Disguise active.',
      userId: newUser._id.toString(),
      username: newUser.username,
      role: newUser.role,
    });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    console.error('Stack:', err.stack);

    // Handle duplicate key errors gracefully
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    return res.status(500).json({
      message: 'Server error during registration',
      error: err.message,
    });
  }
};

// POST /api/auth/connect-guardian
// Users can connect to guardians by username
const connectGuardian = async (req, res) => {
  try {
    const { userId, guardianUsername } = req.body;

    if (!userId || !guardianUsername) {
      return res.status(400).json({ message: 'userId and guardianUsername required' });
    }

    const guardian = await User.findOne({ username: guardianUsername, role: 'GUARDIAN' });
    if (!guardian) {
      return res.status(404).json({ message: 'Guardian not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (guardian.connectedUsers.includes(userId)) {
      return res.status(400).json({ message: 'Already connected to this guardian' });
    }

    guardian.connectedUsers.push(userId);
    await guardian.save();

    return res.status(200).json({
      message: 'Connected to guardian successfully',
      guardianUsername: guardian.username,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};

module.exports = { handleLogin, handleRegister, connectGuardian };
