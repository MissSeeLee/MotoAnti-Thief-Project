import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendCommand } from '../services/mqtt.service.js'; // ✅ ใช้ปีกกาเพื่อเรียกชื่อฟังก์ชันตรงๆ
const prisma = new PrismaClient();

// ==========================================================
// 🔒 กลุ่ม API สำหรับ "เจ้าของรถ" (Owner)
// ==========================================================

// 1. ดึงรายการแชร์ทั้งหมดของรถคันนั้น
export const getShares = async (req, res) => {
    try {
        const { deviceId } = req.params;
        console.log("🔍 กำลังหาข้อมูลของรถ:", deviceId);

        const shares = await prisma.deviceShare.findMany({
            where: { deviceId: deviceId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, shares }); 
    } catch (error) {
    console.log("--- DEBUG ERROR ---");
    console.error(error); // 👈 บรรทัดนี้จะบอกชื่อ Error จริงๆ ใน Terminal
    console.log("-------------------");
    res.status(500).json({ 
        success: false, 
        message: error.message, // ส่งข้อความ error ไปดูที่ Browser
        code: error.code // ดูรหัส error ของ Prisma (เช่น P2025)
    });
    }
};

// 2. สร้างลิ้งค์แชร์ใหม่ (Generate Link)
export const createShare = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { label } = req.body;

        if (!label) {
            return res.status(400).json({ success: false, message: "กรุณาระบุชื่อเรียก (Label)" });
        }

        // ตรวจสอบว่ารถคันนี้มีอยู่จริงไหม
        const device = await prisma.device.findUnique({
            where: { deviceId: deviceId }
        });

        if (!device) {
            return res.status(404).json({ success: false, message: "ไม่พบข้อมูลรถในระบบ" });
        }

        // สร้าง Token สุ่ม 16 ตัวอักษร (เช่น a1b2c3d4...)
        const token = crypto.randomBytes(16).toString('hex');

        // บันทึกลงฐานข้อมูล (เบอร์/เมล ยังว่างอยู่)
        const newShare = await prisma.deviceShare.create({
            data: {
                token: token,
                label: label,
                deviceId: deviceId,
                isActive: true
            }
        });

        res.status(201).json({ success: true, message: "สร้างลิ้งค์สำเร็จ", share: newShare });
    } catch (error) {
    console.log("--- DEBUG ERROR ---");
    console.error(error); // 👈 บรรทัดนี้จะบอกชื่อ Error จริงๆ ใน Terminal
    console.log("-------------------");
    res.status(500).json({ 
        success: false, 
        message: error.message, // ส่งข้อความ error ไปดูที่ Browser
        code: error.code // ดูรหัส error ของ Prisma (เช่น P2025)
    });
    }
};

// 3. แก้ไขข้อมูลผู้ติดตาม (Edit Share)
export const updateShare = async (req, res) => {
    try {
        const { shareId } = req.params; 
        const { label, phone, email } = req.body;

        // 🔥 แก้ Bug: ดักจับทั้ง null (ค่าว่าง) และ "null" (ตัวอักษร)
        if (!shareId || shareId === 'null' || shareId === 'undefined') {
            return res.status(400).json({ success: false, message: "ไม่พบรหัสการแชร์ (Share ID is null)" });
        }

        const idInt = parseInt(shareId);
        if (isNaN(idInt)) {
            return res.status(400).json({ success: false, message: "รูปแบบ ID ไม่ถูกต้อง" });
        }

        const updatedShare = await prisma.deviceShare.update({
            where: { id: idInt },
            data: { label, phone, email }
        });

        res.status(200).json({ success: true, share: updatedShare });
   } catch (error) {
    console.log("--- DEBUG ERROR ---");
    console.error(error); // 👈 บรรทัดนี้จะบอกชื่อ Error จริงๆ ใน Terminal
    console.log("-------------------");
    res.status(500).json({ 
        success: false, 
        message: error.message, // ส่งข้อความ error ไปดูที่ Browser
        code: error.code // ดูรหัส error ของ Prisma (เช่น P2025)
    });
    }
};
// 4. ยกเลิกสิทธิ์ / เตะผู้ติดตามออก (Delete Share)
export const deleteShare = async (req, res) => {
    try {
        const { shareId } = req.params;

        // 🛠️ จุดที่ต้องแก้: แปลงค่าและเช็คว่าเป็นตัวเลขหรือไม่
        const id = parseInt(shareId);
        
        if (isNaN(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "รหัส Share ID ไม่ถูกต้อง (เป็น NaN)" 
            });
        }

        await prisma.deviceShare.delete({
            where: { id: id } // ใช้ตัวแปร id ที่เป็นตัวเลขแล้ว
        });

        res.status(200).json({ success: true, message: "ลบสำเร็จ" });
    } catch (error) {
    console.log("--- DEBUG ERROR ---");
    console.error(error); // 👈 บรรทัดนี้จะบอกชื่อ Error จริงๆ ใน Terminal
    console.log("-------------------");
    res.status(500).json({ 
        success: false, 
        message: error.message, // ส่งข้อความ error ไปดูที่ Browser
        code: error.code // ดูรหัส error ของ Prisma (เช่น P2025)
    });
    }
};

// ==========================================================
// 🌐 กลุ่ม API สำหรับ "ผู้รับลิ้งค์" (Public)
// ==========================================================

// 5. ตรวจสอบสถานะของ Token (เช็คว่ายังใช้งานได้ไหม)
export const verifyShareToken = async (req, res) => {
    try {
        const { token } = req.params;

        const share = await prisma.deviceShare.findUnique({
            where: { token: token }
        });

        // ถ้าไม่มี Token นี้ในระบบ
        if (!share) {
            return res.status(404).json({ success: false, message: "ลิ้งค์นี้ไม่ถูกต้องหรือถูกยกเลิกไปแล้ว" });
        }

        // ถ้าลิ้งค์นี้มีคนลงทะเบียนไปแล้ว (One-time usage check)
        if (share.registeredAt) {
            return res.status(403).json({ success: false, message: "ลิ้งค์นี้ถูกใช้งานไปแล้ว" });
        }

        // ถ้ายอมให้ผ่าน ส่งข้อมูลเบื้องต้นไปให้หน้าเว็บแสดงผล
        res.status(200).json({ 
            success: true, 
            share: {
                label: share.label,
                deviceId: share.deviceId
            }
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(500).json({ success: false, message: "ระบบขัดข้อง" });
    }
};

// 6. ลงทะเบียนผู้ติดตาม (เซฟเบอร์/เมล ลงฐานข้อมูล)
export const registerSubscriber = async (req, res) => {
    try {
        const { token } = req.params;
        const { phone, email } = req.body;

        if (!phone || !email) {
            return res.status(400).json({ success: false, message: "กรุณากรอกเบอร์โทรศัพท์และอีเมลให้ครบถ้วน" });
        }

        // หาข้อมูลลิ้งค์ก่อน
        const share = await prisma.deviceShare.findUnique({
            where: { token: token }
        });

        if (!share) {
            return res.status(404).json({ success: false, message: "ไม่พบลิ้งค์นี้ในระบบ" });
        }

        if (share.registeredAt) {
            return res.status(403).json({ success: false, message: "ลิ้งค์นี้หมดอายุ (ถูกใช้งานไปแล้ว)" });
        }

        // อัปเดตข้อมูล และประทับเวลาว่าถูกใช้งานแล้ว
        await prisma.deviceShare.update({
            where: { token: token },
            data: {
                phone: phone,
                email: email, // ประทับเวลาปัจจุบัน (ทำให้ลิ้งค์นี้ใช้ซ้ำไม่ได้อีก)
            }
        });

        res.status(200).json({ success: true, message: "ลงทะเบียนรับแจ้งเตือนสำเร็จ" });
    } catch (error) {
        console.error("Error registering subscriber:", error);
        res.status(500).json({ success: false, message: "ไม่สามารถลงทะเบียนได้" });
    }
};

export const getLiveTracking = async (req, res) => {
    try {
        const { token } = req.params;
        const share = await prisma.deviceShare.findUnique({
            where: { token },
            include: { device: true } 
        });

        if (!share || !share.isActive) return res.status(403).json({ success: false, message: "สิทธิ์ถูกยกเลิก" });

        res.json({ success: true, device: share.device, subscriber: { label: share.label, phone: share.phone, email: share.email } });
    } catch (error) { res.status(500).json({ success: false }); }
};

// 2. แก้ไขข้อมูลผู้ติดตาม (เบอร์/อีเมล ของตัวเอง)
export const updateSubscriberInfo = async (req, res) => {
    try {
        const { token } = req.params;
        const { phone, email } = req.body;
        await prisma.deviceShare.update({
            where: { token },
            data: { phone, email }
        });
        res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
    } catch (error) { res.status(500).json({ success: false }); }
};

export const triggerFindDevice = async (req, res) => {
    try {
        const { token } = req.params;

        // 2. ตรวจสอบ Token และดึงข้อมูลรถ (ต้องมีส่วนนี้เพื่อให้ได้ deviceId)
        const share = await prisma.deviceShare.findUnique({
            where: { token: token },
            include: { device: true }
        });

        // ตรวจสอบว่ามีลิ้งก์นี้จริงและยังใช้งานได้อยู่ไหม
        if (!share || !share.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: "ไม่พบข้อมูลการแชร์ หรือสิทธิ์ถูกยกเลิกแล้ว" 
            });
        }

        const deviceId = share.deviceId;

        // 3. 🎯 เรียกใช้งาน sendCommand (ไม่ต้องมี mqttService. นำหน้า)
        const isSent = sendCommand(deviceId, { command: "find_bike" });

        if (isSent) {
            console.log(`✅ [Guest Tracking] ส่งคำสั่งหารถสำเร็จ: ${deviceId}`);
            res.status(200).json({ success: true, message: "ส่งคำสั่งสำเร็จ" });
        } else {
            res.status(500).json({ success: false, message: "MQTT ขาดการติดต่อ" });
        }
        
    } catch (error) {
        console.error("Error in triggerFindDevice:", error);
        res.status(500).json({ success: false, message: "ระบบขัดข้อง" });
    }
};