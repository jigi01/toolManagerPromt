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

// --- Настройка CORS ---
const rawFrontendUrls = process.env.FRONTEND_URL || '';
const frontendOrigins = rawFrontendUrls.split(',').map(url => url.trim());

const allowedOrigins = [
  ...frontendOrigins,
  process.env.MOBILE_LOCAL_URL,
  process.env.MOBILE_INET_URL,
  'http://localhost:5173' 
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // 1. Разрешаем запросы без origin (серверные, мобильные приложения, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // 2. Проверяем точное совпадение со списком
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 3. Разрешаем локальную сеть (для тестов с телефона в одной Wi-Fi сети)
    if (origin.startsWith('http://192.168.')) {
      return callback(null, true);
    }

    // Иначе блокируем
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// --- Middleware ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// --- Маршруты ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ToolManager API is running' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});