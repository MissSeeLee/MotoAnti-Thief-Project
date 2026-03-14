# ---------------------------------------
# Dockerfile สำหรับโครงสร้างไฟล์แบบกองรวมกัน (Root)
# ---------------------------------------
FROM node:20-alpine

# ตั้งโฟลเดอร์ทำงาน
WORKDIR /app

# 1. ก๊อปปี้ package.json (จาก Root)
COPY package*.json ./

# 2. ติดตั้ง Dependencies
RUN npm install --production

# 3. (สำคัญ) ถ้าใช้ Prisma ต้อง Generate Client ด้วย
# (เห็นในรูปมีโฟลเดอร์ prisma)
COPY prisma ./prisma
RUN npx prisma generate

# 4. ก๊อปปี้ไฟล์โค้ดทั้งหมด (รวมถึงโฟลเดอร์ dist ที่คุณวางไว้แล้ว)
COPY . .

# เปิด Port
EXPOSE 3000

# รัน Server
CMD ["npm", "start"]