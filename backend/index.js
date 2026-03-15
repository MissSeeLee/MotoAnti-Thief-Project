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

// 1. กำหนด Origins ที่อนุญาตให้ชัดเจน
const ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "https://moto.artip.site", 
    "https://motoanti-thief.artip.site"
];

// ✅ 1. Setup Socket.IO (ย้ายมาใช้ตัวแปร ALLOWED_ORIGINS)
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
// 🟢 ส่วนที่ 1: API Routes (จัดลำดับใหม่ให้ชัดเจน)
// ==========================================

// ตรวจสอบสุขภาพ Server
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api', shareRoutes);

// 🔥 ดักจับ API 404 (เฉพาะที่ขึ้นต้นด้วย /api แต่หา route ไม่เจอ)
app.use('/api', (req, res) => {
    res.status(404).json({ error: "API Route Not Found" });
});

// ==========================================
// 🟢 ส่วนที่ 2: Serve Frontend (Static Files)
// ==========================================
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get('/:any*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next(); // ถ้าเป็น API ให้ข้ามไป
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send("Backend Server is Running! (Frontend build not found)");
    });
}

// ==========================================
// 🟢 ส่วนที่ 3: Start Server
// ==========================================
startMqttWorker(io);

server.listen(config.PORT, '0.0.0.0', () => {
  console.log(`✅ Server ready on port ${config.PORT}`);
  console.log(`📡 Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
});