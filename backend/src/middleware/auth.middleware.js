import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key'; // ต้องตรงกับตอน Login

export const authenticateToken = (req, res, next) => {
  // 1. ดึง Token จาก Header (ส่งมาแบบ: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 2. ถ้าไม่มี Token -> ห้ามผ่าน (401)
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  // 3. ตรวจสอบความถูกต้อง
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid Token' });
    }
    
    // 4. ถ้าผ่าน -> แนบข้อมูล user ไปกับ request แล้วไปต่อ
    req.user = user;
    next();
  });
};