import express from 'express';
import * as shareController from '../controllers/share.controller.js';
// ⚠️ เช็คให้ดีว่าไฟล์ชื่อ auth.middleware.js หรือเปล่า (ตามรูปคือใช่)
import { authenticateToken } from '../middleware/auth.middleware.js'; 

const router = express.Router();

// กลุ่ม Owner (จัดการแชร์)
router.get('/devices/:deviceId/sharing', authenticateToken, shareController.getShares);
router.post('/devices/:deviceId/sharing', authenticateToken, shareController.createShare);
router.put('/devices/:deviceId/sharing/:shareId', authenticateToken, shareController.updateShare);
router.delete('/devices/:deviceId/sharing/:shareId', authenticateToken, shareController.deleteShare);

// กลุ่ม Public (คนรับลิ้งค์)
router.get('/sharing/verify/:token', shareController.verifyShareToken);
router.post('/sharing/register/:token', shareController.registerSubscriber);
router.get('/sharing/live/:token', shareController.getLiveTracking);

// ปุ่มกดหารถ (Find My Car)
router.post('/sharing/find/:token', shareController.triggerFindDevice);

// แก้ไขข้อมูลส่วนตัวผู้รับลิงก์ (Phone, Email)
router.put('/sharing/subscriber/:token', shareController.updateSubscriberInfo);
router.post('/sharing/find/:token', shareController.triggerFindDevice);
export default router;