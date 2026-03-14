<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-50 transition-all duration-500">
      
      <div v-if="isSuccess" class="text-center animate-fade-in-up">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-4xl">🎉</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">สมัครสมาชิกสำเร็จ!</h2>
        <p class="text-slate-500 mb-6">
          บัญชีของคุณถูกสร้างบัญชีเรียบร้อยแล้ว<br>
          กรุณายืนยัน Email ก่อนเข้าสู่ระบบ <span class="font-semibold text-slate-800">Username</span> ของคุณ
        </p>
        <router-link 
          to="/login" 
          class="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all"
        >
          ไปหน้าเข้าสู่ระบบ
        </router-link>
      </div>

      <div v-else>
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-800">สร้างบัญชีใหม่ 🚀</h2>
          <p class="text-slate-400 text-sm mt-1">เริ่มต้นใช้งาน Moto-AntiThief ฟรี</p>
        </div>

        <form @submit.prevent="register" class="space-y-4">
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label>
            <input
              type="text"
              v-model="form.username"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500 outline-none transition-all"
              placeholder="ตั้งชื่อผู้ใช้"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
            <input
              type="email"
              v-model="form.email"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500 outline-none transition-all"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
  <label class="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label>
  <input
    type="tel"
    v-model="form.phone"
    @input="handlePhoneInput" 
    maxlength="10"
    class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all"
    placeholder="08xxxxxxxx (เฉพาะตัวเลข)"
    required
  />
</div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              v-model="form.password"
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl font-semibold shadow-lg transition-all mt-4 flex justify-center items-center gap-2"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
            {{ isLoading ? 'กำลังสมัคร...' : 'ยืนยันการสมัคร' }}
          </button>
        </form>

        <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
          ⚠️ {{ error }}
        </div>

        <p class="text-center mt-6 text-sm text-slate-500">
          มีบัญชีแล้ว?
          <router-link to="/login" class="text-slate-900 font-semibold hover:underline">
            เข้าสู่ระบบ
          </router-link>
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import api from "../api";

// ✅ อัปเดต form ให้มี username
const form = reactive({ 
  username: "", 
  email: "", 
  phone: "", 
  password: "" 
});

const error = ref("");
const isSuccess = ref(false);
const isLoading = ref(false);

const register = async () => {
  error.value = "";
  isLoading.value = true;
  
  try {
    // ส่งข้อมูลทั้ง 4 ตัวไป Backend
    await api.post("/auth/register", form);
    
    // แจ้งเตือนสำเร็จ
    isSuccess.value = true;
    
  } catch (e) {
    console.error("Register Error:", e);
    // แสดง Error ที่ส่งมาจาก Backend (เช่น "Username ซ้ำ")
    error.value = e.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่";
  } finally {
    isLoading.value = false;
  }
};
const handlePhoneInput = (e) => {
  // 1. เอาค่าที่ User พิมพ์มา
  let value = e.target.value;

  // 2. ใช้ Regex ลบทุกอย่างที่ไม่ใช่ตัวเลขออก (เช่น ขีด, วรรค, ตัวหนังสือ)
  value = value.replace(/\D/g, '');

  // 3. ถ้าเกิน 10 ตัว ให้ตัดทิ้ง
  if (value.length > 10) {
    value = value.slice(0, 10);
  }

  // 4. อัปเดตค่ากลับเข้าไปในตัวแปรและหน้าจอ
  form.phone = value;
  e.target.value = value;
};
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
</style>