const express = require('express');
const cors = require('cors');
const oddsRoutes = require('./routes/oddsRoutes');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use('/api/prematchfootball', oddsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// , '173889337', '173889355', '173888707', '173888701', '173889460', '173889159', '173889141'