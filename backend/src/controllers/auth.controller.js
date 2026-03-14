import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid'; 
import { sendVerificationEmail } from '../utils/mailer.js';
import { sendCommand } from '../services/mqtt.service.js';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// 1. ลงทะเบียน (Register)
// ==========================================
export const register = async (req, res) => {
  try {
    // รับค่า 4 อย่าง: username, email, phone, password
    const { username, email, phone, password } = req.body;

    // เช็คค่าว่าง
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // เช็คว่า Username หรือ Email ซ้ำหรือไม่?
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) return res.status(400).json({ error: 'Username นี้มีผู้ใช้งานแล้ว' });
      if (existingUser.email === email) return res.status(400).json({ error: 'Email นี้ถูกใช้งานแล้ว' });
    }

    // เข้ารหัสรหัสผ่าน + สร้าง Token ยืนยัน
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    // สร้าง User ใหม่
    const newUser = await prisma.user.create({
      data: {
        username, // ใช้ Login
        email,    // ใช้รับ Alert
        phone: phone || '',   // ใช้รับ SMS
        password: hashedPassword,
        name: username,
        role: 'ADMIN',
        isVerified: false,
        verificationToken: verificationToken
      }
    });

    // ส่งอีเมลยืนยัน (ถ้าส่งไม่ผ่าน ก็ไม่เป็นไร User ยังถูกสร้างแล้ว)
    try {
        await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
    }

    res.status(201).json({ 
        message: 'สมัครสมาชิกสำเร็จ! กรุณาเช็คอีเมลเพื่อยืนยันตัวตน', 
        userId: newUser.id 
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// ==========================================
// 2. เข้าสู่ระบบ (Login)
// ==========================================
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอก Username และ Password' });
    }

    // 1. ค้นหาจาก Username
    const user = await prisma.user.findUnique({
      where: { username: username } 
    });

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบชื่อผู้ใช้นี้ (Username Not Found)' });
    }

    // 2. เช็ค Password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // 3. เช็คสถานะยืนยันอีเมล
    if (user.isVerified === false) {
       return res.status(403).json({ 
           message: 'กรุณายืนยันอีเมลก่อนเข้าใช้งาน (เช็คใน Inbox หรือ Junk Mail)' 
       });
    }

    // 4. สร้าง Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // ส่งข้อมูลกลับ
    res.json({ 
        token, 
        user: { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            phone: user.phone,
            role: user.role 
        } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
};

// ==========================================
// 3. ยืนยันอีเมล (Verify Email)
// ==========================================
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body; 

        if (!token) return res.status(400).json({ message: "ไม่พบ Token" });

        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });

        if (!user) {
            return res.status(400).json({ message: "ลิงก์ยืนยันไม่ถูกต้อง หรือถูกใช้งานไปแล้ว" });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null
            }
        });

        res.json({ success: true, message: "ยืนยันอีเมลสำเร็จ! คุณสามารถเข้าสู่ระบบได้ทันที" });

    } catch (error) {
        console.error("Verify Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. ดึงข้อมูลส่วนตัว (Get Me)
// ==========================================
export const getMe = async (req, res) => {
  try {
    // เช็คก่อนว่า Middleware ส่งค่า User มาไหม
    if (!req.user || !req.user.userId) {
       console.error("❌ Error: No user ID in request. Middleware might be missing.");
       return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { 
        id: true, 
        username: true, 
        name: true,    // ✅ ต้องเพิ่มบรรทัดนี้ เพื่อให้ดึงชื่อมาแสดง
        email: true, 
        phone: true, 
        role: true 
      } 
    });
    
    res.json(user);

  } catch (error) {
    // 🔥 บรรทัดนี้สำคัญมาก! มันจะบอกใน Terminal ว่า Error อะไร
    console.error("❌ GetMe Error:", error); 
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==========================================
// 5. อัปเดตโปรไฟล์ (Update Profile)
// ==========================================
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const userId = req.user.userId;

    // -------------------------------------------------------
    // ✅ 1. เช็คว่า "อีเมล" ซ้ำกับคนอื่นไหม?
    // -------------------------------------------------------
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { 
            email: email, 
            NOT: { id: userId } // ไม่นับตัวเอง
        }
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'อีเมลนี้มีผู้ใช้งานแล้ว (Email already taken)' });
      }
    }

    // -------------------------------------------------------
    // ✅ 2. เช็คว่า "เบอร์โทร" ซ้ำกับคนอื่นไหม? (เพิ่มส่วนนี้)
    // -------------------------------------------------------
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { 
            phone: phone, 
            NOT: { id: userId } // ไม่นับตัวเอง
        }
      });
      if (existingPhone) {
        return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว (Phone number already taken)' });
      }
    }

    // -------------------------------------------------------
    // 3. อัปเดตข้อมูลลง Database
    // -------------------------------------------------------
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, email },
      select: { id: true, username: true, name: true, email: true, phone: true }
    });

    // -------------------------------------------------------
    // 4. ส่ง MQTT ไปหา ESP32
    // -------------------------------------------------------
    if (phone) { 
        console.log(`📞 Phone updated to ${phone}. Syncing to all devices...`);
        try {
            const userDevices = await prisma.device.findMany({
                where: { userId: userId }
            });

            if (userDevices.length > 0) {
                userDevices.forEach(device => {
                    const payload = {
                        command: "update_phone",
                        number: phone
                    };
                    console.log(`   -> Sending MQTT to ${device.deviceId}:`, payload);
                    sendCommand(device.deviceId, payload);
                });
            }
        } catch (mqttError) {
            console.error("⚠️ MQTT Error:", mqttError);
        }
    }

    res.json({ message: 'บันทึกข้อมูลสำเร็จ', user: updatedUser });

  } catch (error) {
    console.error("❌ Update Profile Error:", error);

    // ดัก Error P2002 เผื่อหลุดการตรวจสอบด้านบน
    if (error.code === 'P2002') {
        // เช็คว่า Error ที่ฟิลด์ไหน
        const target = error.meta?.target || [];
        if (target.includes('phone')) {
            return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' });
        } else if (target.includes('email')) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }
        return res.status(400).json({ message: 'ข้อมูลซ้ำกับในระบบ' });
    }
    
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};
export const changePassword = async (req, res) => {
  try {

    // ✅ แบบใหม่: รับแค่ newPassword อย่างเดียว
    const { newPassword } = req.body;
    
    // ดึง userId จาก Token (ตัวยืนยันตัวตนเดียวที่มีอยู่ตอนนี้)
    const userId = req.user.userId; 

    // 🔒 Validation นิดหน่อยกันพลาด
    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    // 1. เข้ารหัสรหัสผ่านใหม่ทันที
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 2. บันทึกลง Database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว' });

  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // A. เช็คว่ามีอีเมลนี้ในระบบไหม
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    // B. สร้าง Token รีเซ็ต (หมดอายุ 15 นาที)
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // C. สร้างลิงก์ (เปลี่ยน localhost เป็นโดเมนจริงของคุณถ้าขึ้น Server แล้ว)
    // หรือใช้ค่าจาก process.env.FRONTEND_URL ก็ได้
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // D. ส่งอีเมลด้วย Resend 🚀
    const { data, error } = await resend.emails.send({
      from: 'Moto-AntiThief <noreply@artip.site>', 
      to: [email], // ส่งไปที่อีเมล user
      subject: '🔑 รีเซ็ตรหัสผ่าน Moto Anti-Thief',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>คุณได้แจ้งลืมรหัสผ่าน</h2>
          <p>คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิ้งก์มีอายุ 15 นาที):</p>
          <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">ตั้งรหัสผ่านใหม่</a>
          <p style="margin-top: 20px; color: #666;">หากไม่ได้ขอรีเซ็ต โปรดเพิกเฉยอีเมลฉบับนี้</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({ message: 'ส่งอีเมลไม่สำเร็จ', error });
    }

    res.json({ message: 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว', data });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 1. ตรวจสอบ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. อัปเดตใน Database
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};