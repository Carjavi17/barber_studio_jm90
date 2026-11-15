require('dotenv').config();
const pool = require('./db');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();



app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Barber Studio JM90 API is running' });
});

app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ database: 'connected', time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ database: 'error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});