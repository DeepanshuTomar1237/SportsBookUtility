// server.js
const express = require('express');
const cors = require('cors');
const oddsRoutes = require('./routes/oddsRoutes');
const connectDB = require('./config/db');


const app = express();
const PORT = 5000;
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api', oddsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});