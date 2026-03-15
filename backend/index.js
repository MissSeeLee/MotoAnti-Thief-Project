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

// ✅ 1. Setup Socket.IO
const io = new Server(server, {
  cors: {
    // เพิ่มโดเมนใหม่เข้าไปในลิสต์ origin
    origin: ["http://localhost:5173", "https://moto.artip.site", "https://motoanti-thief.artip.site"], 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ 2. Setup Middleware
app.use(cors({
    // เพิ่มโดเมนใหม่เข้าไปตรงนี้ด้วยครับ
    origin: ["http://localhost:5173", "https://moto.artip.site", "https://motoanti-thief.artip.site"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With'],
    credentials: true 
}));

app.use(express.json());

// ==========================================
// 🟢 ส่วนที่ 1: API Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api', shareRoutes); 
app.use('/api/devices', deviceRoutes);


// 🔥 แก้ไข 1: ดักจับ API 404 ด้วย Regex (ห้ามใช้สตริง)
app.all(/^\/api\/.*$/, (req, res) => {
    res.status(404).json({ error: "API Not Found (Backend is working)" });
});

// ==========================================
// 🟢 ส่วนที่ 2: Serve Frontend (Vue.js / Dist)
// ==========================================
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    // Serve Static Files
    app.use(express.static(distPath));
    app.get(/.*/, (req, res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.warn("⚠️  Warning: ไม่พบโฟลเดอร์ 'dist' (Frontend จะไม่แสดงผล)");
    app.get('/', (req, res) => {
        res.send("Backend Server is Running! (Frontend build not found)");
    });
}

// ==========================================
// 🟢 ส่วนที่ 3: Start Server
// ==========================================
startMqttWorker(io);

server.listen(config.PORT, '0.0.0.0', () => {
  console.log(`✅ Server FIXED for Express 5`);
  console.log(`🚀 Server running on port ${config.PORT}`);
});