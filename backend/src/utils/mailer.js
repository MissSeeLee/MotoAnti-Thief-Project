import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// สร้าง Instance ของ Resend โดยใช้ API KEY จาก .env
const resend = new Resend(process.env.RESEND_API_KEY);

// ==========================================
// 🟢 1. ฟังก์ชันส่งอีเมลยืนยันตัวตน (สำหรับตอนสมัครสมาชิก)
// ==========================================
export const sendVerificationEmail = async (toEmail, token) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "https://motoanti-thief.artip.site";
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`; 

    const { data, error } = await resend.emails.send({
      from: "Moto-AntiThief Support <security@artip.site>", // เปลี่ยนให้ตรงกับโดเมนที่คุณยืนยันกับ Resend ไว้
      to: toEmail,
      subject: "🔐 ยืนยันตัวตนเพื่อใช้งานระบบ MotoAnti-Thief",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; padding: 40px; background-color: #f8fafc;">
          <div style="background: white; max-width: 500px; margin: auto; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              <h2 style="color: #1e293b; margin-top: 0;">ยืนยันการลงทะเบียน</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.5;">ขอบคุณที่สมัครสมาชิกกับเรา!<br>กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมลและเริ่มใช้งานระบบรักษาความปลอดภัยของคุณ:</p>
              <a href="${verifyUrl}" style="background: #2563EB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px; transition: 0.3s;">
                  ✔️ ยืนยันอีเมลของฉัน
              </a>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">หากคุณไม่ได้ทำการสมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error("❌ Resend Verification Error Details:", error);
      return { success: false, error };
    }

    console.log(`✅ Verification Email sent to ${toEmail}`);
    return { success: true, data };

  } catch (err) {
    console.error("❌ Verification Exception:", err);
    return { success: false, error: err.message };
  }
};

// ==========================================
// 🔴 2. ฟังก์ชันส่งอีเมลแจ้งเตือนภัย (แยก Link ระหว่าง Owner และ Guest)
// ==========================================
export const sendEmergencyAlert = async (toEmail, vehicleData, isOwner = true) => {
  try {
    const msg = vehicleData.message || vehicleData.eventType || "";
    const baseUrl = process.env.FRONTEND_URL || "https://motoanti-thief.artip.site";
    
    // 🔗 สร้าง Link แยกตามสถานะ
    const actionUrl = isOwner 
      ? `${baseUrl}/dashboard` 
      : `${baseUrl}/track-public/${vehicleData.publicToken}`;

    // สร้างลิงก์ Google Maps 
    const googleMapLink = (vehicleData.lat && vehicleData.lng)
      ? `https://www.google.com/maps/search/?api=1&query=${vehicleData.lat},${vehicleData.lng}`
      : null;

    // 🎨 ตั้งค่าสถานะตามประเภท Alert 
    let alertConfig = {
      title: "ตรวจพบความผิดปกติ!",
      subject: `⚠️ แจ้งเตือน! รถ ${vehicleData.name} มีความเคลื่อนไหว`,
      color: "#f59e0b", // เหลืองส้ม
      desc: "ระบบตรวจพบแรงสั่นสะเทือน หรือมีการเคลื่อนที่ขณะล็อครถ",
    };

    if (msg.includes("ACCIDENT") || msg.includes("FALLEN") || msg.includes("CRASH") || msg.includes("THEFT")) {
      alertConfig = {
        title: "เหตุฉุกเฉินวิกฤต!",
        subject: `🚨 ด่วน! รถ ${vehicleData.name} เกิดเหตุฉุกเฉิน`,
        color: "#dc2626", // แดง
        desc: "ระบบตรวจพบการกระแทกอย่างรุนแรง ตัวรถล้มเอียง หรืออาจเกิดการโจรกรรม",
      };
    } else if (msg.includes("GEOFENCE")) {
      alertConfig = {
        title: "ออกนอกเขตปลอดภัย!",
        subject: `🚧 แจ้งเตือน! รถ ${vehicleData.name} ออกนอกพื้นที่`,
        color: "#7e22ce", // ม่วง
        desc: "ระบบตรวจพบว่ารถมีการเคลื่อนที่ออกนอกรัศมี Geofence ที่ตั้งไว้",
      };
    }

    // ✍️ ปรับคำทักทายและข้อความ
    const recipientGreeting = isOwner
      ? `เรียน <strong>คุณเจ้าของรถ ${vehicleData.name}</strong>,`
      : `เรียน <strong>ผู้รับแจ้งเหตุ (ติดตามรถ ${vehicleData.name})</strong>,`;

    const instructions = isOwner
      ? "กรุณาเข้าสู่ระบบผ่าน Dashboard เพื่อตรวจสอบสถานะ สั่งปิดเสียงไซเรน หรือติดตามตำแหน่งรถทันที"
      : "ระบบได้ส่งพิกัดล่าสุดมาให้คุณแล้ว กรุณาตรวจสอบตำแหน่งรถแบบ Real-time ทันทีผ่านลิงก์ด้านล่างนี้";

    const buttonText = isOwner 
      ? "💻 เข้าสู่ Dashboard (จัดการรถ)" 
      : "📍 ติดตามตำแหน่งรถ (Real-time)";

    // 📧 ส่งอีเมลผ่าน Resend
    const { data, error } = await resend.emails.send({
      from: "Security Alert <security@artip.site>",
      to: toEmail,
      subject: alertConfig.subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="background-color: ${alertConfig.color}; padding: 25px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 1px;">${alertConfig.title}</h1>
            </div>
            
            <div style="padding: 30px; line-height: 1.7; color: #333;">
                <p style="font-size: 16px;">${recipientGreeting}</p>
                <p style="font-size: 15px;">ระบบรักษาความปลอดภัยขอแจ้งให้ทราบว่าขณะนี้มีเหตุการณ์ผิดปกติเกิดขึ้นกับยานพาหนะ</p>
                
                <div style="background-color: #f8fafc; border-left: 5px solid ${alertConfig.color}; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: ${alertConfig.color};">รายละเอียดเหตุการณ์:</h3>
                    <p style="margin: 5px 0;"><strong>ประเภท:</strong> ${alertConfig.desc}</p>
                    <p style="margin: 5px 0;"><strong>ชื่อรถ:</strong> ${vehicleData.name}</p>
                    <p style="margin: 5px 0;"><strong>แบตเตอรี่อุปกรณ์:</strong> ${vehicleData.battery || 'N/A'}%</p>
                    <p style="margin: 5px 0;"><strong>เวลาเกิดเหตุ:</strong> ${new Date().toLocaleString("th-TH")}</p>
                    <p style="margin: 5px 0;"><strong>รหัสสถานะ:</strong> ${msg}</p>
                    ${googleMapLink ? `<p style="margin: 15px 0 0 0;"><strong>🌍 พิกัด:</strong> <a href="${googleMapLink}" target="_blank" style="color: ${alertConfig.color}; text-decoration: underline; font-weight: bold;">เปิดดูจุดเกิดเหตุใน Google Maps</a></p>` : ''}
                </div>

                <p style="text-align: center; color: #555; font-size: 15px; font-weight: 500;">
                    ${instructions}
                </p>

                <div style="text-align: center; margin: 35px 0;">
                    <a href="${actionUrl}" 
                       style="background-color: ${alertConfig.color}; color: white; padding: 18px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px ${alertConfig.color}44; transition: all 0.3s;">
                        ${buttonText}
                    </a>
                    ${!isOwner ? `<p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">* ลิงก์นี้เป็นสิทธิ์การเข้าถึงฉุกเฉิน ไม่ต้องเข้าสู่ระบบ</p>` : ''}
                </div>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
                ข้อความนี้ถูกส่งโดยระบบอัตโนมัติจาก <strong>MotoAnti-Thief (artip.site)</strong><br>
                เหตุฉุกเฉินครั้งนี้ถูกส่งเมื่อ: ${new Date().toLocaleString("th-TH")}
            </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend Alert Error Details:", error);
      return { success: false, error };
    }

    console.log(`✅ ${isOwner ? 'Owner' : 'Guest'} Alert Email sent to ${toEmail}`);
    return { success: true, data };

  } catch (err) {
    console.error("❌ Alert Mailer Exception:", err);
    return { success: false, error: err.message };
  }
};