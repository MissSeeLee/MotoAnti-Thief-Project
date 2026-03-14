import { Router } from 'express';
import { 
  addDevice, 
  getMyDevices, 
  updateDevice, 
  deleteDevice,
  getDeviceHistory,
  getDeviceAlerts,
  createShareLink,
  getDeviceByShareToken, 
  sendCommandByShareToken,
  controlDevice,
  getDeviceByPublicToken // ✅ Import ปกติ
} from '../controllers/device.controller.js';

import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// ==========================================
// 🔓 Public Routes (โซนคนนอกเข้าได้)
// ⚠️ ต้องวางไว้บนสุด ก่อนบรรทัด router.use(authenticateToken)
// ==========================================

// 1. ดูข้อมูลรถผ่านลิงก์แชร์ปกติ
router.get('/share/:token', getDeviceByShareToken);

// 2. สั่งงานรถผ่านลิงก์แชร์
router.post('/share/:token/command', sendCommandByShareToken);

// ✅ 3. ลิงก์ฉุกเฉินสำหรับตำรวจ (ย้ายมาไว้ตรงนี้แล้ว!)
// ต้องใช้ชื่อ path ให้ตรงกับที่ Frontend เรียก (public-info)
router.get('/public-info/:token', getDeviceByPublicToken);


// ==========================================
// ⛔️ ประตูกั้น: ตั้งแต่บรรทัดนี้ไป ต้อง Login เท่านั้น
// ==========================================
router.use(authenticateToken); 


// ==========================================
// 🔒 Private Routes (โซนเจ้าของรถ)
// ==========================================
router.post('/', addDevice);
router.get('/', getMyDevices);
router.put('/:deviceId', updateDevice);
router.delete('/:deviceId', deleteDevice);
router.get('/:deviceId/history', getDeviceHistory);
router.get('/:deviceId/alerts', getDeviceAlerts);
router.post('/:deviceId/share', createShareLink);
router.get('/:deviceId/alerts', getDeviceAlerts); 

// สั่งงานรถ (เจ้าของกดเอง)
router.post('/:deviceId/command', controlDevice);

export default router;