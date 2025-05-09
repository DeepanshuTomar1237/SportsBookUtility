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
