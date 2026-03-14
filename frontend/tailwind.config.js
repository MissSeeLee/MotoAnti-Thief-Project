/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      // (สีพวกนี้ยังใช้ได้อยู่ แต่ DaisyUI จะมีสีของมันเองด้วย)
      colors: {
        primary: '#0f172a', // Slate 900
        accent: '#3b82f6',  // Blue 500
      }
    },
  },
  
  // --- [จุดที่ต้องเพิ่ม] ---
  plugins: [
    require('daisyui'), // <-- 1. เรียกใช้ Plugin
  ],

  // --- [ตั้งค่าเพิ่มเติม] ---
  daisyui: {
    themes: ["light", "dark", "winter"], // 2. เลือกธีมที่ชอบ (winter ดูสะอาดตามากครับ)
  },
}