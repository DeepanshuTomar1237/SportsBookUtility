const express = require('express');
const cors = require('cors');
const oddsRoutes = require('./routes/oddsRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/odds', oddsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
