import dotenv from 'dotenv';
dotenv.config();

const config = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  
  EMQX_HOST: process.env.EMQX_HOST,
  EMQX_PORT: process.env.EMQX_PORT,
  EMQX_USER: process.env.EMQX_USER,
  EMQX_PASS: process.env.EMQX_PASS,
  
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  VERIFIED_SENDER_EMAIL: process.env.VERIFIED_SENDER_EMAIL,

  // [แก้!] ให้อ่านจาก .env ถ้าไม่มีให้ใช้ค่า Default
  MQTT_TOPIC_PATTERN: process.env.MQTT_TOPIC_PATTERN || 'moto/+/location' 
};

export default config;