const express = require('express');
const router = express.Router();
const { handleLogin, handleRegister } = require('../controllers/authController');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with PIN (Fake, Real, or Panic)
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
 *               - pin
 *             properties:
 *               username:
 *                 type: string
 *                 example: alice
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
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 action:
 *                   type: string
 *                   enum: [UNLOCK_DASHBOARD, SHOW_CALCULATOR, WIPE_DATA]
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Invalid PIN
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */
router.post('/login', handleLogin);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new Mycelium user
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
 *               - guardianEmail
 *             properties:
 *               username:
 *                 type: string
 *                 example: alice
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
 *                 username:
 *                   type: string
 *       400:
 *         description: Bad Request
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Server Error
 */
router.post('/register', handleRegister);

module.exports = router;
