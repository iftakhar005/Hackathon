const express = require('express');
const router = express.Router();
const { getStatus, handleCheckIn, logJournal, getConnectedUsers } = require('../controllers/safetyController');

/**
 * @swagger
 * /api/safety/status/{userId}:
 *   get:
 *     summary: Check user's safety status (Dead Man's Switch)
 *     tags:
 *       - Safety
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 username:
 *                   type: string
 *                 riskLevel:
 *                   type: string
 *                   enum: [GREEN, YELLOW, RED, BLACK]
 *                 silenceDuration:
 *                   type: number
 *                   description: Minutes since last activity
 *                 alertSentToGuardian:
 *                   type: boolean
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */
router.get('/status/:userId', getStatus);

/**
 * @swagger
 * /api/safety/checkin/{userId}:
 *   post:
 *     summary: Manual check-in to reset the Dead Man's Switch timer
 *     tags:
 *       - Safety
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Check-in successful
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */
router.post('/checkin/:userId', handleCheckIn);

/**
 * @swagger
 * /api/safety/journal:
 *   post:
 *     summary: Log a journal entry with AI sentiment analysis
 *     tags:
 *       - Safety
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - entry
 *             properties:
 *               userId:
 *                 type: string
 *               entry:
 *                 type: string
 *                 example: "The house is very quiet today, like a storm coming."
 *     responses:
 *       201:
 *         description: Journal entry logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 riskScore:
 *                   type: number
 *                 detectedThreats:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
router.post('/journal', logJournal);

/**
 * @swagger
 * /api/safety/guardian/users/{guardianId}:
 *   get:
 *     summary: Get all connected users for a guardian
 *     tags:
 *       - Guardian
 *     parameters:
 *       - in: path
 *         name: guardianId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of connected users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 guardianUsername:
 *                   type: string
 *                 connectedUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: User is not a guardian
 *       404:
 *         description: Guardian not found
 *       500:
 *         description: Server Error
 */
router.get('/guardian/users/:guardianId', getConnectedUsers);

module.exports = router;
