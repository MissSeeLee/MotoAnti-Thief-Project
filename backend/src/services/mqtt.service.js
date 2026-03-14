import { PrismaClient } from "@prisma/client";
import mqtt from "mqtt";
import fs from "fs";
import { z } from "zod";
import config from "../config.js";
import { handleSecurityAlert } from "../services/alert.service.js";

const prisma = new PrismaClient();
let mqttClient = null;

const Esp32PayloadSchema = z.object({
  gps: z.object({ lat: z.number(), lng: z.number(), fix: z.number().optional().default(0) }).optional(),
  accel: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  ign: z.string().optional(),
  batt: z.number().optional(),
  event: z.string().optional(),
  status: z.string().optional(),
});

export const startMqttWorker = (io) => {
  let ca;
  try {
    ca = fs.readFileSync("./emqx.pem");
  } catch (err) {
    console.warn("⚠️ ไม่พบไฟล์ emqx.pem (จะเชื่อมต่อแบบ Insecure)");
  }

  const connectOptions = {
    host: config.EMQX_HOST,
    port: parseInt(config.EMQX_PORT, 10),
    protocol: "mqtts",
    username: config.EMQX_USER,
    password: config.EMQX_PASS,
    clientId: `backend_worker_${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000,
    ca: ca,
    rejectUnauthorized: false,
  };

  console.log(`[MQTT] 🔌 กำลังเชื่อมต่อ EMQX...`);
  mqttClient = mqtt.connect(connectOptions);

  mqttClient.on("connect", () => {
    console.log("✅ [MQTT] เชื่อมต่อสำเร็จ!");
    const topics = ["+/location", "+/alert"];
    mqttClient.subscribe(topics, (err) => {
      if (!err) console.log(`📡 [MQTT] ดักฟัง Topics: ${topics.join(", ")}`);
    });
  });

  // 🔥 เพิ่มระบบตรวจสอบการเชื่อมต่อ (สำคัญมากสำหรับ Production)
  mqttClient.on("offline", () => console.log("⚠️ [MQTT] ขาดการเชื่อมต่อกับ Broker!"));
  mqttClient.on("reconnect", () => console.log("🔄 [MQTT] กำลังพยายามเชื่อมต่อใหม่..."));

  mqttClient.on("message", async (topic, message) => {
    try {
      const payloadString = message.toString();
      const topicParts = topic.split("/");
      const deviceId = topicParts[0];
      const msgType = topicParts[1];

      if (!deviceId || !msgType) return;

      // 🔥 ดักจับ JSON พัง (กัน Server Crash)
      let rawData;
      try {
          rawData = JSON.parse(payloadString);
      } catch (parseErr) {
          console.warn(`🗑️ [MQTT] ได้รับข้อมูลขยะหรือไม่ใช่ JSON จาก ${deviceId}: ${payloadString}`);
          return; // ทิ้งข้อความนี้ไปเลย
      }

      // กรอง GPS 0,0
      if (rawData.gps && (Number(rawData.gps.lat) === 0 || Number(rawData.gps.lng) === 0)) {
          return;
      }

      const payload = Esp32PayloadSchema.parse(rawData);

      // A. ส่ง Socket (Realtime Dashboard)
      if (io && payload.gps) {
        io.emit("new_location", {
          deviceId: deviceId,
          lat: payload.gps.lat,
          lng: payload.gps.lng,
          speed: 0,
          ign: payload.ign === "ON",
          status: payload.ign === "ON" ? "ONLINE" : "PARKED",
          battery: payload.batt || 0,
        });
      }

      // B. บันทึก Database
      if (msgType === "location") {
        const rawBatt = Number(payload.batt ?? payload.battery ?? payload.vbat ?? 0);
        const currentIgnStatus = payload.ign === "ON" ? "ONLINE" : "PARKED";

        const updateData = {
          currentStatus: currentIgnStatus,
          currentBattery: rawBatt > 0 ? rawBatt : undefined,
        };

        if (payload.gps) {
          updateData.lat = Number(payload.gps.lat);
          updateData.lng = Number(payload.gps.lng);
        }

        // Upsert อัปเดตสถานะล่าสุด (อันนี้ทำได้ ไม่กินสเปค)
        const deviceRecord = await prisma.device.upsert({
          where: { deviceId: deviceId },
          update: updateData,
          create: {
            deviceId: deviceId,
            name: `Device ${deviceId}`,
            userId: 1,
            currentStatus: "NEW",
            currentBattery: rawBatt || 100,
            lat: payload.gps ? payload.gps.lat : 0,
            lng: payload.gps ? payload.gps.lng : 0,
          },
        });

        // 🔥 ป้องกันขยะเต็ม DB: บันทึก History เฉพาะตอนรถวิ่ง (IGN=ON) หรือกำลังสั่นสะเทือน
        if (payload.gps && currentIgnStatus === "ONLINE") {
          await prisma.locationHistory.create({
            data: {
              deviceId: deviceId,
              lat: Number(payload.gps.lat),
              lng: Number(payload.gps.lng),
              battery: rawBatt,
              status: currentIgnStatus,
              accel_x: payload.accel ? Number(payload.accel.x) : 0,
              accel_y: payload.accel ? Number(payload.accel.y) : 0,
              accel_z: payload.accel ? Number(payload.accel.z) : 0,
              vibration: 0,
            },
          });
        }
      }

      // C. Alert Logic
      if (msgType === "alert") {
        const eventMsg = payload.event || payload.status || "UNKNOWN";
        
        // ==========================================
        // 🌟 1. ส่งข้อมูลให้หน้าเว็บ (Frontend) ทันที!
        // เพื่อให้ StatusCard ซิงค์เปลี่ยนสีเรียลไทม์ทุก Event
        // ==========================================
        try {
          const device = await prisma.device.findUnique({
            where: { deviceId: deviceId }
          });
          const carName = device?.name || deviceId;

          if (io) {
            io.emit("new_alert", { 
              deviceId: deviceId, 
              deviceName: carName, 
              message: JSON.stringify(payload) 
            });
          }
        } catch (err) {
          console.error("❌ ส่ง Socket Alert ล้มเหลว:", err.message);
        }

        // ==========================================
        // 🌟 2. คัดกรองเฉพาะเหตุการณ์ฉุกเฉิน (ลง DB & ส่ง Email)
        // ==========================================
        const validEvents = ["THEFT_DETECTED", "ACCIDENT_FALLEN", "LOW_BATTERY", "GEOFENCE_BREACH", "BUMP_DETECTED"];

        if (validEvents.includes(eventMsg)) {
          console.log(`🚨 [ALERT] ตรวจพบเหตุการณ์ฉุกเฉิน: ${eventMsg} จาก ${deviceId}`);
          
          try {
            // หาตำแหน่งล่าสุดเพื่อบันทึกลงฐานข้อมูล Alert
            const lastLocation = await prisma.locationHistory.findFirst({
              where: { deviceId },
              orderBy: { createdAt: 'desc' }
            });

            // บันทึกประวัติการแจ้งเตือนลงตาราง Alert
            await prisma.alert.create({
              data: {
                deviceId: deviceId,
                type: eventMsg, 
                lat: lastLocation ? lastLocation.lat : 0,
                lng: lastLocation ? lastLocation.lng : 0,
              }
            });
          } catch (dbError) {
            console.error("❌ [DB Error] บันทึก Alert ลงฐานข้อมูลไม่สำเร็จ:", dbError.message);
          }

          // โยนไปให้ Alert Service จัดการต่อ (ส่ง Email ให้ Owner/Guest)
          await handleSecurityAlert(deviceId, eventMsg);
          
        } else {
          // ถ้าเป็นแค่ Event ปกติ เช่น บิดกุญแจ, ดับเครื่อง
          console.log(`⚠️ [SKIP] อัปเดตหน้าเว็บแล้ว แต่ละเว้นบันทึก DB/Email: ${eventMsg}`);
        }
      }
    } catch (e) {
      if (!(e instanceof z.ZodError)) {
        console.error("❌ MQTT Processing Error:", e.message);
      }
    }
  });

  mqttClient.on("error", (err) => console.error("❌ MQTT Connection Error:", err));
};

export const sendCommand = (deviceId, commandObj) => {
  if (!mqttClient || !mqttClient.connected) {
    console.error("⚠️ MQTT: Client not connected. Cannot send command.");
    return false;
  }

  const topic = `${deviceId}/control`;
  const payload = { target: deviceId, ...commandObj };
  const message = JSON.stringify(payload);

  mqttClient.publish(topic, message, { qos: 0 }, (err) => {
    if (err) console.error("❌ MQTT Publish Error:", err);
    else console.log(`🚀 MQTT Sent to [${topic}]: ${message}`);
  });

  return true;
};