import { io } from "socket.io-client";
import { reactive } from "vue";


// --- 1. กำหนด URL ของ Backend ---
// ใช้ค่าจาก .env หรือถ้าไม่มีให้ใช้ URL ปัจจุบันของเว็บ
const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;

// --- 2. สร้าง Reactive State สำหรับเก็บข้อมูลที่แชร์กันได้ทั้งแอป ---
export const socketState = reactive({
  connected: false,
  latestAlert: null, // เก็บแจ้งเตือนล่าสุดเพื่อให้ GlobalAlertManager นำไปแสดงผล
});

// --- 3. เริ่มการเชื่อมต่อ Socket (Singleton - เชื่อมต่อครั้งเดียว) ---
export const socket = io(socketUrl, {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

// --- 4. ดักฟังเหตุการณ์พื้นฐาน ---
socket.on("connect", () => {
  socketState.connected = true;
  console.log("🌐 [Socket] Connected to server");
});

socket.on("disconnect", () => {
  socketState.connected = false;
  console.log("🌐 [Socket] Disconnected from server");
});

// --- 5. ดักฟังการแจ้งเตือนแบบ Global ---
// ไม่ว่าคุณจะอยู่หน้าไหน หูฟังตรงนี้จะทำงานตลอดเวลา
socket.on("new_alert", (data) => {
  console.log("🚨 [Socket] New Global Alert:", data);
  
  // อัปเดตข้อมูลลงใน State กลาง
  // เพิ่ม timestamp (_ts) เพื่อให้ Vue Watcher รู้ว่ามีการอัปเดตแม้จะเป็นข้อความเดิม
  socketState.latestAlert = { 
    ...data, 
    _ts: Date.now() 
  };
});

// หมายเหตุ: ส่วนการรับพิกัด (new_location) เราจะไปดักฟังเฉพาะใน Dashboard 
// เพื่อไม่ให้เครื่องทำงานหนักเกินไปตอนอยู่หน้าอื่นครับ

export default socket;