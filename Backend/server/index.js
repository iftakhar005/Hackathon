// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// --- 1. IMPORT SWAGGER ---
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- 2. CONFIGURE SWAGGER ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mycelium Safety API',
      version: '1.0.0',
      description: 'A Polymorphic Safety Tool for Domestic Violence Survivors',
    },
    servers: [
      { url: `http://localhost:${PORT}` },
    ],
  },
  apis: ['./routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// --- 3. CREATE THE DOCUMENTATION PAGE ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- 4. IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const safetyRoutes = require('./routes/safetyRoutes');

// --- 5. MOUNT ROUTES ---
app.get('/', (req, res) => {
  res.json({ message: 'Mycelium Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/safety', safetyRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});