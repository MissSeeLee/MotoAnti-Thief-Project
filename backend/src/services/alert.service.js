import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { sendEmergencyAlert } from '../utils/mailer.js';

const prisma = new PrismaClient();

// 🔥 ระบบป้องกัน Spam (Alert Cooldown)
// เก็บประวัติว่ารถคันไหน เพิ่งเตือนเรื่องอะไรไป เพื่อไม่ให้ส่งซ้ำรัวๆ
const recentAlertsCache = new Map();
const ALERT_COOLDOWN_MS = 2 * 60 * 1000; // หน่วงเวลา 2 นาทีต่อ 1 ประเภทเหตุการณ์

export const handleSecurityAlert = async (deviceId, message) => {
    try {
        const isCritical = message.includes("THEFT") || 
                           message.includes("ACCIDENT") || 
                           message.includes("FALLEN") || 
                           message.includes("GEOFENCE") ||
                           message.includes("VIBRATION") ||
                           message.includes("SYSTEM_UNLOCKED") ||
                           message.includes("ARMED_STABLE") ||
                           message.includes("IGN_OFF_WAITING");

        if (!isCritical) return;

        // ==========================================
        // 🛡️ 1. เช็ค Spam (Cooldown Logic)
        // ==========================================
        const alertKey = `${deviceId}-${message}`;
        const lastSentTime = recentAlertsCache.get(alertKey);
        
        if (lastSentTime && (Date.now() - lastSentTime < ALERT_COOLDOWN_MS)) {
            console.log(`⏳ [SKIP ALERT] ระงับการส่งอีเมลซ้ำซ้อนสำหรับ ${deviceId} (${message}) - อยู่ในช่วง Cooldown`);
            return; // หยุดการทำงาน ไม่ส่งอีเมลซ้ำ
        }

        // ==========================================
        // 2. ตรวจสอบข้อมูลรถใน Database
        // ==========================================
        const device = await prisma.device.findUnique({
            where: { deviceId },
            include: { user: true }
        });

        if (!device) {
            console.log(`⚠️ ไม่สามารถส่งแจ้งเตือนได้: ไม่พบข้อมูลรถ ${deviceId}`);
            // ❌ หยุดการทำงานโดยที่ "ไม่เซ็ต Cache" เพื่อไม่ให้เสียโควต้า Cooldown ฟรี
            return;
        }

        console.log(`🚨 [ALERT INITIATED] เตรียมส่งแจ้งเตือนรถ ${deviceId} - เหตุการณ์: ${message}`);

        const token = device.publicToken || randomUUID(); 
        await prisma.device.update({
            where: { deviceId },
            data: { publicToken: token }
        });

        const baseDeviceData = {
            name: device.name,
            deviceId: device.deviceId,
            lat: device.lat,
            lng: device.lng,
            message: message 
        };

        // ==========================================
        // 🌟 3. ส่งอีเมลหา OWNER
        // ==========================================
        if (device.user?.email) {
            try {
                await sendEmergencyAlert(device.user.email, baseDeviceData, true);
                console.log(`📧 ส่งแจ้งเตือนหา OWNER สำเร็จ: ${device.user.email}`);
            } catch (err) {
                console.error(`❌ ส่งเมลหา OWNER ล้มเหลว:`, err.message);
            }
        }

        // ==========================================
        // 🌟 4. ส่งอีเมลหา GUEST
        // ==========================================
        const activeShares = await prisma.deviceShare.findMany({
            where: { 
                deviceId: deviceId,
                isActive: true,
                email: { not: null }
            }
        });

        if (activeShares.length > 0) {
            console.log(`👥 พบ Guest ${activeShares.length} คน, กำลังดำเนินการส่ง...`);
            
            await Promise.all(activeShares.map(async (share) => {
                if (!share.email) return;

                const dataForGuest = { 
                    ...baseDeviceData, 
                    publicToken: share.token 
                };

                try {
                    await sendEmergencyAlert(share.email, dataForGuest, false);
                    console.log(`📧 ส่งแจ้งเตือนหา GUEST สำเร็จ: ${share.email}`);
                } catch (err) {
                    console.error(`❌ ส่งเมลหา GUEST ล้มเหลว:`, err.message);
                }
            }));
        }

        // ==========================================
        // ✅ 5. อัปเดต Cache ในขั้นตอน "สุดท้าย"
        // (เมื่อผ่านด่านทุกอย่างมาจนถึงตรงนี้ได้ ถือว่าส่งสมบูรณ์)
        // ==========================================
        recentAlertsCache.set(alertKey, Date.now());
        console.log(`✅ [CACHE UPDATED] เริ่มนับ Cooldown ให้กับ ${alertKey} แล้ว`);

    } catch (error) {
        console.error("❌ handleSecurityAlert Error:", error);
    }
};

export const getAlertsByDevice = async (deviceId, start, end) => {
  return await prisma.alert.findMany({
    where: {
      deviceId: deviceId,
      createdAt: {
        gte: new Date(start),
        lte: new Date(end),
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};