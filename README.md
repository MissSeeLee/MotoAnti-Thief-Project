MotoAnti-Thief-Project
> ระบบเตือนภัยการโจรกรรมรถจักรยานยนต

## 📋 รายละเอียดโปรเจกต์ (Overview)
โปรเจกต์นี้คือระบบ IoT สำหรับความปลอดภัยของรถจักรยานยนต์ โดยใช้บอร์ด IoT รับค่าพิกัด GPS และเซนเซอร์สั่นสะเทือน ส่งข้อมูลผ่านโปรโตคอล MQTT มายัง Backend และแสดงผลบนหน้า Web Dashboard แบบ Real-time ผ่าน Socket.IO

---

## ✨ คุณสมบัติหลัก (Features)
- 📍 **Real-time Tracking:** ติดตามพิกัดรถบน Google Maps ได้ทันที
- 🚨 **Theft/Crash Alert:** แจ้งเตือนเมื่อตรวจพบการเคลื่อนที่ผิดปกติหรืออุบัติเหตุ
- 🔗 **Smart Sharing:** สร้างลิงก์ชั่วคราวให้ผู้อื่นติดตามรถได้โดยไม่ต้อง Log-in
- 📊 **Status Monitoring:** ดูสถานะเครื่องยนต์ (IGN) และระดับแบตเตอรี่

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
- **Framework:** Vue.js 3 (Vite)
- **Styling:** Tailwind CSS
- **API Client:** Axios

### Backend
- **Runtime:** Node.js (Express 5)
- **Real-time:** Socket.IO & MQTT
- **ORM:** Prisma

### Infrastructure & DevOps
- **Container:** Docker & Docker Compose
- **Web Server:** Nginx (Reverse Proxy)
- **Deployment:** Vercel (Frontend), VPS (Backend)

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (LTS Version)

### 2. การติดตั้ง (Installation)
```bash
# Clone โปรเจกต์
git clone [https://github.com/MissSeeLee/MotoAnti-Thief-Project.git](https://github.com/MissSeeLee/MotoAnti-Thief-Project.git)

# เข้าไปที่โฟลเดอร์ Backend
cd MotoAnti-Thief-Project/backend

# สร้างคอนเทนเนอร์
docker compose up -d --build
