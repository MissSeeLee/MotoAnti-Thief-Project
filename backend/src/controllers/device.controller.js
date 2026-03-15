import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; 
import { sendCommand } from '../services/mqtt.service.js'; // 
import { sendEmergencyAlert } from '../utils/mailer.js';
import  {getAlertsByDevice} from '../services/alert.service.js';
const prisma = new PrismaClient();

// ==========================================
// 1. เพิ่มรถใหม่
// ==========================================
export const addDevice = async (req, res) => {
  try {
    const { deviceId, name} = req.body; 
    
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found' });
    }
    const userId = req.user.userId;

    // 1. เช็คว่ามีรถคันนี้ในระบบหรือไม่ (ค้นหาจากที่ผู้พัฒนาสร้างรอไว้)
    const existingDevice = await prisma.device.findUnique({ where: { deviceId } });
    
    if (!existingDevice) {
      return res.status(404).json({ message: 'ไม่พบอุปกรณ์นี้ในระบบ กรุณาตรวจสอบรหัส (Serial Number) อีกครั้ง' });
    }

    // 2. เช็คว่าอุปกรณ์นี้ถูกคนอื่นเป็นเจ้าของไปแล้วหรือยัง (ถ้ามี userId แปลว่ามีเจ้าของแล้ว)
    if (existingDevice.userId !== null) {
      return res.status(400).json({ message: 'อุปกรณ์นี้ถูกลงทะเบียนไปแล้ว' });
    }

    // 3. ทำการผูกอุปกรณ์เข้ากับ User ปัจจุบัน (ใช้ UPDATE แทน CREATE)
    const updatedDevice = await prisma.device.update({
      where: { deviceId },
      data: { 
        name: name || existingDevice.name || "รถของฉัน", 
        userId: userId, // 👈 จุดสำคัญ: นำ ID ของผู้ใช้มาใส่เพื่อแสดงความเป็นเจ้าของ
        alarmDuration: 0, 
        updatedAt: new Date(), 
        currentStatus: "OFFLINE"
      }
    });

    res.status(200).json({ message: 'เพิ่มอุปกรณ์สำเร็จ', device: updatedDevice });
  } catch (error) {
    console.error("Add Device Error:", error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

// ==========================================
// 2. ดูรายการรถของฉัน
// ==========================================
export const getMyDevices = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ ใช้ Prisma ดึงข้อมูลทีเดียว (ตัด Raw SQL ออกเพื่อลดความซับซ้อน)
    // หมายเหตุ: ตรวจสอบ schema.prisma ว่ามี field 'alarmDuration' แล้วหรือยัง
    const devices = await prisma.device.findMany({
  where: { userId: userId },
  orderBy: { createdAt: "desc" },
  include: {
    locationHistories: { // ✅ เติม ies ให้ตรงกับ Schema
      take: 1,
      orderBy: { createdAt: "desc" }
    }
  }
});

    res.json(devices);

  } catch (error) {
    console.error("Get Devices Error:", error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

// ==========================================
// 3. แก้ไขข้อมูลรถ (Update)
// ==========================================
export const updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params; 
    const { name, geofence, alarmDuration } = req.body;       
    const userId = req.user.userId;

    // 1. เช็คสิทธิ์เจ้าของ
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device || device.userId !== userId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขอุปกรณ์นี้' });
    }

    // 2. เตรียมข้อมูลอัปเดต (รวมทุกอย่างใน object เดียว)
    let updateData = {};
    if (name !== undefined) updateData.name = name;
    
    // อัปเดต Geofence
    if (geofence) {
        updateData.isGeofenceActive = geofence.enabled;
        updateData.geofenceLat = parseFloat(geofence.lat);
        updateData.geofenceLng = parseFloat(geofence.lng);
        updateData.geofenceRadius = parseInt(geofence.radius);
    }

    // อัปเดต Alarm Duration (Timer)
    if (alarmDuration !== undefined && alarmDuration !== null) {
        updateData.alarmDuration = Number(alarmDuration);
    }

    // 3. บันทึกลง Database (Prisma จัดการให้ทีเดียว)
    const updatedDevice = await prisma.device.update({
        where: { deviceId },
        data: updateData
    });
 

    // กรณีเปลี่ยน Timer
    if (alarmDuration !== undefined && alarmDuration !== null) {
        sendCommand(deviceId, { 
            "command": "set_timer", 
            "seconds": Number(alarmDuration) 
        });
        console.log(`📡 [MQTT] Sent set_timer: ${alarmDuration}s`);
    }

    res.json({ message: 'แก้ไขข้อมูลสำเร็จ', device: updatedDevice });

  } catch (error) {
    console.error("🔥 Update Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 4. สั่งงานอุปกรณ์ (Find Bike, Stop Alarm, Set Timer)
// ==========================================
export const controlDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { command, seconds } = req.body; 
        const userId = req.user.userId;

        // เช็คสิทธิ์เจ้าของ
        const device = await prisma.device.findUnique({ where: { deviceId } });
        if (!device || device.userId !== userId) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์สั่งงานอุปกรณ์นี้' });
        }

        let mqttCmd = {};
        
        // ตรวจสอบคำสั่งและสร้าง Payload ตาม Spec ของ ESP32
        if (command === 'find_bike') {
            mqttCmd = { command: "find_bike" };
        } 
        else if (command === 'stop_alarm') {
            mqttCmd = { command: "stop_alarm" };
        } 
        else if (command === 'set_timer') {
            if (seconds === undefined || seconds === null) {
                return res.status(400).json({ message: 'กรุณาระบุจำนวนวินาที (seconds)' });
            }
            mqttCmd = { 
                command: "set_timer", 
                seconds: Number(seconds) 
            };
            
            // อัปเดตค่าล่าสุดลง DB ด้วย เพื่อให้หน้าเว็บแสดงค่าตรงกัน
            await prisma.device.update({
                where: { deviceId },
                data: { alarmDuration: Number(seconds) }
            });
        } 
        else {
            return res.status(400).json({ message: 'ไม่รู้จักคำสั่งนี้ (Unknown command)' });
        }

        // ส่งคำสั่ง MQTT
        console.log(`🚀 Sending MQTT: ${JSON.stringify(mqttCmd)} to ${deviceId}`);
        const success = sendCommand(deviceId, mqttCmd);

        if (success) {
            res.json({ success: true, message: `ส่งคำสั่ง ${command} สำเร็จ` });
        } else {
            res.status(503).json({ success: false, message: 'MQTT Offline or Failed to send' });
        }

    } catch (error) {
        console.error("Control Device Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 5. ลบรถ
// ==========================================
export const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.userId;

    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device || device.userId !== userId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบอุปกรณ์นี้' });
    }

    // ✅ 1. ลบข้อมูลการแชร์กุญแจ (Guest) ของรถคันนี้ทิ้งทั้งหมดก่อน เพื่อความปลอดภัย
    // (ถ้ามีตาราง DeviceShare นะครับ ถ้าไม่มีบรรทัดนี้ลบทิ้งได้เลย)
    try {
      await prisma.deviceShare.deleteMany({ where: { deviceId } });
    } catch (e) {
      console.log("ไม่มีตารางแชร์ หรือลบแชร์แล้ว");
    }

    // ✅ 2. เปลี่ยนจากการลบ (Delete) เป็นการปลดล็อค (Unbind)
    await prisma.device.update({
      where: { deviceId },
      data: {
        userId: null,                 // ปลดชื่อเจ้าของออก (ทำให้ว่าง)
        name: `Device ${deviceId}`,   // คืนค่าชื่อกลับเป็นค่าเริ่มต้น
        publicToken: null,            // ล้างค่า Token ความปลอดภัย
        // currentStatus: "OFFLINE"   // (ถ้าอยากให้สถานะกลับเป็นออฟไลน์ด้วย ปลดคอมเมนต์บรรทัดนี้ได้ครับ)
      }
    });

    res.json({ message: 'ลบอุปกรณ์และปลดล็อค Serial Number สำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 6. ดูประวัติการเดินทาง
// ==========================================
export const getDeviceHistory = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end } = req.query;
    
    // TODO: ควรเพิ่มการเช็ค userId ว่าเป็นเจ้าของรถหรือไม่ตรงนี้ด้วย

    let queryCondition = { deviceId: deviceId };

    if (start || end) {
      queryCondition.createdAt = {}; 
      if (start) queryCondition.createdAt.gte = new Date(start);
      if (end) queryCondition.createdAt.lte = new Date(end);
    }

    const history = await prisma.locationHistory.findMany({
      where: queryCondition,
      orderBy: { createdAt: 'asc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 7. สร้างลิงก์สำหรับแชร์รถ
// ==========================================
export const createShareLink = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { label } = req.body;
    
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.userId;

    const device = await prisma.device.findFirst({ where: { deviceId, userId } });
    if (!device) {
      return res.status(403).json({ message: 'คุณไม่ใช่เจ้าของรถคันนี้' });
    }

    const token = uuidv4(); 
    const share = await prisma.deviceShare.create({
      data: {
        token: token,
        deviceId: deviceId,
        label: label || 'Driver',
        isActive: true
      }
    });

    // แนะนำ: ควรใช้ Environment Variable สำหรับ Domain
    const domain = process.env.FRONTEND_URL || "https://motoanti-thief.artip.site";
    const shareLink = `${domain}/join/${token}`;
    
    res.json({ success: true, link: shareLink, token: token, shareId: share.id });
  } catch (error) {
    res.status(500).json({ message: 'สร้างกุญแจไม่สำเร็จ', error: error.message });
  }
};

// ==========================================
// 8. ดึงข้อมูลรถจาก Token (สำหรับคนรับลิงก์)
// ==========================================
export const getDeviceByShareToken = async (req, res) => {
  try {
    const { token } = req.params;

    const share = await prisma.deviceShare.findUnique({
      where: { token },
      include: { device: true }
    });

    if (!share || !share.isActive) {
      return res.status(404).json({ message: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' });
    }

    const device = share.device;

    const lastLocation = await prisma.locationHistory.findFirst({
      where: { deviceId: device.deviceId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      deviceId: device.deviceId,
      name: device.name,
      shareLabel: share.label,
      lat: lastLocation ? lastLocation.lat : 0,
      lng: lastLocation ? lastLocation.lng : 0,
      lastUpdate: lastLocation ? lastLocation.createdAt : null,
      geofence: {
        enabled: device.isGeofenceActive || false,
        lat: device.geofenceLat || 0,
        lng: device.geofenceLng || 0,
        radius: device.geofenceRadius || 200
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 9. สั่งงานผ่านลิงก์แชร์
// ==========================================
export const sendCommandByShareToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // รับค่า command และ seconds (เผื่อกรณี set_timer)
    const cmdVal = req.body.command || req.body.cmd || req.body.action; 
    const seconds = req.body.seconds;

    console.log(`📥 [API Share] คำสั่ง: ${cmdVal} (Token: ${token.substring(0,5)}...)`);

    if (!cmdVal) {
        return res.status(400).json({ message: "ไม่พบคำสั่ง (command is required)" });
    }

    const share = await prisma.deviceShare.findUnique({
      where: { token },
      include: { device: true }
    });

    if (!share || !share.isActive) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์สั่งงาน หรือลิงก์หมดอายุ' });
    }

    // สร้าง MQTT Payload
    let mqttCmd = { command: cmdVal };
    
    // ถ้าเป็นคำสั่ง set_timer ต้องแนบวินาทีไปด้วย
    if (cmdVal === 'set_timer') {
        if (!seconds) return res.status(400).json({ message: "Missing seconds for timer" });
        mqttCmd.seconds = Number(seconds);
    }

    // ส่งเข้า MQTT
    console.log(`🚀 [MQTT Share] Sending '${JSON.stringify(mqttCmd)}' to ${share.deviceId}`);
    const success = sendCommand(share.deviceId, mqttCmd);

    if (success) {
      res.json({ success: true, message: "ส่งคำสั่งแล้ว" });
    } else {
      res.status(503).json({ success: false, message: "MQTT Offline" });
    }

  } catch (error) {
    console.error("❌ [API Share Error]:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 10. (Optional) Public Token
// ==========================================
export const getDeviceByPublicToken = async (req, res) => {
  try {
    const { token } = req.params;

    const device = await prisma.device.findFirst({
      where: {
        publicToken: token,
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'ลิงก์ติดตามนี้ไม่ถูกต้อง หรือถูกยกเลิกแล้ว' });
    }

    // ดึงพิกัดล่าสุดจากตาราง Device โดยตรง (ที่เราเพิ่งเพิ่มเข้าไป)
    res.json({
      name: device.name,
      lat: device.lat || 0,
      lng: device.lng || 0,
      updatedAt: device.updatedAt,
      status: device.currentStatus
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
export const triggerTheftAlert = async (deviceId) => {
  try {
    // 1. สร้าง Token ชั่วคราวสำหรับการติดตาม
    const publicToken = uuidv4();
    
    // 2. อัปเดตลงฐานข้อมูล
    const device = await prisma.device.update({
      where: { deviceId },
      data: { publicToken },
      include: { user: true } // ดึงข้อมูลเจ้าของเพื่อเอา Email
    });

    // 3. ส่งเมลผ่าน Resend
    if (device.user && device.user.email) {
      await sendEmergencyAlert(device.user.email, {
        name: device.name,
        deviceId: device.deviceId,
        publicToken: publicToken
      });
      console.log(`📧 [Alert] Email sent to ${device.user.email}`);
    }
  } catch (error) {
    console.error("❌ Alert Trigger Error:", error);
  }
};
// เพิ่มฟังก์ชันนี้ลงไปในไฟล์ device.controller.js

export const getDeviceAlerts = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end } = req.query;

    // ตรวจสอบความถูกต้องของข้อมูล
    if (!start || !end) {
      return res.status(400).json({ message: "กรุณาระบุช่วงเวลา (start, end) ให้ครบถ้วน" });
    }

    // ✅ เรียกใช้งานผ่าน Service ตามโครงสร้างที่วางไว้
    const alerts = await getAlertsByDevice(deviceId, start, end);

    res.status(200).json(alerts);
  } catch (error) {
    console.error("🔥 Controller Error (getDeviceAlerts):", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งเตือนจาก Server" });
  }
};