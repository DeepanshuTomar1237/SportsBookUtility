// server.js
const express = require('express');
const cors = require('cors');
const oddsRoutes = require('./routes/Index');
const connectDB = require('./config/db');

const app = express();

// Initialize middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', oddsRoutes);

// Export only the app for testing
module.exports = app;

// Start server only when not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}