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

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS, 
    methods: ["GET", "POST"],
    credentials: true
  },
  path: "/socket.io/"
});

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

// 🔥 ดัก 404 สำหรับ API (ไม่ใช้ดอกจัน)
app.use('/api', (req, res) => {
    res.status(404).json({ error: "API Route Not Found" });
});

// ==========================================
// 🟢 ส่วนที่ 2: Serve Frontend (SPA Fallback)
// ==========================================
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // 🔥 ท่าไม้ตาย! ใช้ app.use แบบ "ไม่ใส่พาร์ทอะไรเลย" 
    // ถ้าไม่มี Route ไหนตรง มันจะส่งไฟล์หน้าบ้านให้ทันที ไม่มีทางติด PathError 100%
    app.use((req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // 🔥 ใช้ app.use แบบไม่ใส่พาร์ทเหมือนกันเพื่อความชัวร์
    app.use((req, res) => {
        res.send(`Backend Server is Running! (Port: ${config.PORT})`);
    });
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is alive',
    uptime: Math.floor(process.uptime()) + ' seconds', // บอกว่ารันมานานแค่ไหนแล้ว
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage().rss / 1024 / 1024 + ' MB' // เช็กว่ากินแรมไหม
  });
});

// ==========================================
// 🟢 ส่วนที่ 3: Start Server
// ==========================================
startMqttWorker(io);

server.listen(config.PORT, '0.0.0.0', () => {
  console.log(`✅ [SUCCESS] Server is UP! No more PathErrors.`);
});