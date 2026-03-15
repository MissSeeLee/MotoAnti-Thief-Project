import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import config from './src/config.js';
import authRoutes from './src/routes/auth.routes.js';
import deviceRoutes from './src/routes/device.routes.js';
import shareRoutes from './src/routes/share.routes.js';
import { startMqttWorker } from './src/services/mqtt.service.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "https://moto.artip.site", 
    "https://motoanti-thief.artip.site"
];

// ✅ 1. Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS, 
    methods: ["GET", "POST"],
    credentials: true
  },
  path: "/socket.io/"
});

// ✅ 2. Setup Middleware
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true 
}));

app.use(express.json());

// ==========================================
// 🟢 ส่วนที่ 1: API Routes
// ==========================================

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Backend is alive' }));

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api', shareRoutes); 

// 🔥 [จุดแก้สำคัญ 1] สำหรับ Express 5: 
// ไม่ต้องใช้ดอกจันใน app.use ให้ใช้พาร์ทหลัก แล้วเช็กข้างในแทน
app.use('/api', (req, res) => {
    res.status(404).json({ 
        error: "API Route Not Found", 
        path: req.originalUrl 
    });
});

// ==========================================
// 🟢 ส่วนที่ 2: Serve Frontend (Static Files)
// ==========================================
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // 🔥 [จุดแก้สำคัญ 2] สำหรับ Express 5: ใช้ชื่อพารามิเตอร์คลุมทั้งหมด
    app.get('/:path*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send("Backend Server is Running! (Port: " + config.PORT + ")");
    });
}

// ==========================================
// 🟢 ส่วนที่ 3: Start Server
// ==========================================
startMqttWorker(io);

server.listen(config.PORT, '0.0.0.0', () => {
  console.log(`✅ Server FIXED & Ready (Port: ${config.PORT})`);
  console.log(`📡 Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
});