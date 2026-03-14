<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-50">
      
      <div class="text-center mb-8">
        <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
          🏍️
        </div>
        <h2 class="text-2xl font-bold text-slate-800">ยินดีต้อนรับสู่ Moto-AntiThief</h2>
        <p class="text-slate-400 text-sm mt-1">เข้าสู่ระบบเพื่อจัดการรถของคุณ</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">ชื่อผู้ใช้ (Username)</label>
          <input
            v-model="username"
            type="text"
            placeholder="กรอกชื่อผู้ใช้ของคุณ"
            class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            required
            autofocus
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label class="block text-sm font-medium text-slate-700">รหัสผ่าน</label>
            <router-link 
              to="/forgot-password" 
              class="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              ลืมรหัสผ่าน?
            </router-link>
          </div>
          
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
        >
           <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
           {{ isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ' }}
        </button>
      </form>

      <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100 flex items-center justify-center gap-2">
        ⚠️ {{ errorMessage }}
      </div>

      <p class="text-center mt-8 text-sm text-slate-500">
        ยังไม่มีบัญชี?
        <router-link to="/register" class="text-blue-600 font-semibold hover:underline">
          สมัครสมาชิกเลย
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../api";

const router = useRouter();

// ✅ เปลี่ยนจาก email เป็น username
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    // ✅ ส่ง username ไปแทน email
    const res = await api.post("/auth/login", {
      username: username.value,
      password: password.value,
    });

    if (res.data.token) {
      // 1. บันทึก Token
      localStorage.setItem("token", res.data.token);

      // 2. บันทึก User ทั้งก้อน (JSON) เพื่อให้หน้าอื่นใช้ง่ายๆ
      // (เช่น เอาไปแสดงชื่อมุมขวาบน หรือเอา user.id ไปใช้)
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // เก็บ Role แยกไว้เผื่อเช็คสิทธิ์ง่ายๆ
        localStorage.setItem("user_role", res.data.user.role || "USER");
      }

      console.log("Login Success!");
      router.push("/dashboard");
    }
  } catch (err) {
    console.error("Login Error:", err);
    // ดึง Error Message จาก Backend มาแสดง
    errorMessage.value = err.response?.data?.message || err.response?.data?.error || "ไม่สามารถเข้าสู่ระบบได้";
  } finally {
    isLoading.value = false;
  }
};
</script>