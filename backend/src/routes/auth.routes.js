import { Router } from 'express';
// ✅ 1. เพิ่ม getMe และ updateProfile เข้าไปในปีกกา
import { register, login, verifyEmail, getMe, updateProfile,changePassword,forgotPassword,resetPassword} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// ==============================
// 🟢 Auth Routes
// ==============================

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ✅ 2. ตอนนี้บรรทัดเหล่านี้จะทำงานได้แล้ว
router.get('/me', authenticateToken, getMe);       
router.put('/me', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;