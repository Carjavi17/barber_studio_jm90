import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import barberRoutes from './routes/barbers.routes.js';
import { authenticate } from './middleware/auth.js';
import appointmentRoutes from './routes/appointments.routes.js';
import offerRoutes from './routes/offers.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/barbers', barberRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/offers', offerRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Barber Studio JM90 API is running' });
});

app.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

app.get('/health/db', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() AS now`;
    res.json({ database: 'connected', time: result[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ database: 'error' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});