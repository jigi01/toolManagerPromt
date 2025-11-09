import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import toolRoutes from './routes/tool.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import roleRoutes from './routes/role.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import categoryRoutes from './routes/category.routes.js';
import statsRoutes from './routes/stats.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173', // Твой WEB-frontend
  'http://localhost:8081',  // Твой MOBILE-frontend (Expo web)
  'http://192.168.0.191:8081', // Expo mobile на устройстве
];

app.use(cors({
  origin: function (origin, callback) {
    // Позволить запросы без 'origin' (например, мобильные приложения, Postman) или если origin в списке
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Разрешить запросы с локальной сети для мобильных устройств
      if (origin && origin.startsWith('http://192.168.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ToolManager API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT} и доступен на всех сетевых интерфейсах`);
  console.log(`📱 Мобильное приложение: http://192.168.0.191:${PORT}/api`);
  console.log(`💻 Веб-приложение: http://localhost:${PORT}/api`);
});
