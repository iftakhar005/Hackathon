const express = require('express');
const router = express.Router();
const { handleLogin, handleRegister, connectGuardian } = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Device-Bound PIN Login (Calculator Interface)
 *     description: Login using userId (from device binding) + PIN. The calculator has no username field, so userId is stored locally during setup.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - pin
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "65a1b2c3d4e5f6g7h8i9j0k1"
 *                 description: Device binding ID from localStorage (mycelium_device_id)
 *               pin:
 *                 type: string
 *                 example: "9999"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mode:
 *                   type: string
 *                   enum: [DASHBOARD, CALCULATOR_ERROR, PANIC_TRIGGERED]
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad Request - Missing userId or pin
 *       401:
 *         description: Invalid PIN
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.post('/login', handleLogin);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: One-Time Device Setup (Create User Account)
 *     description: First-time setup page where user registers and binds the device. Returns userId which should be saved to localStorage as 'mycelium_device_id'.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 example: alice
 *               role:
 *                 type: string
 *                 enum: [USER, GUARDIAN]
 *                 example: USER
 *               guardianEmail:
 *                 type: string
 *                 example: bob@gmail.com
 *               fakePin:
 *                 type: string
 *                 example: "1234"
 *               realPin:
 *                 type: string
 *                 example: "9999"
 *               panicPin:
 *                 type: string
 *                 example: "0000"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *                   description: CRITICAL - Save this to localStorage as 'mycelium_device_id'
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *       400:
 *         description: Bad Request
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Server Error
 */
router.post('/register', handleRegister);

/**
 * @swagger
 * /api/auth/connect-guardian:
 *   post:
 *     summary: Connect a USER to a GUARDIAN by username
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - guardianUsername
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "67801234567890abcdef1234"
 *               guardianUsername:
 *                 type: string
 *                 example: bob
 *     responses:
 *       200:
 *         description: Connected to guardian successfully
 *       400:
 *         description: Bad Request or Already connected
 *       404:
 *         description: Guardian or User not found
 *       500:
 *         description: Server Error
 */
router.post('/connect-guardian', connectGuardian);

module.exports = router;
