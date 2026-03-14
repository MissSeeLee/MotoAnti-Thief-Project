<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-50 relative overflow-hidden">
      
      <router-link to="/login" class="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </router-link>

      <div class="text-center mb-8 mt-4">
        <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm text-indigo-600">
          🔐
        </div>
        <h2 class="text-2xl font-bold text-slate-800">ลืมรหัสผ่าน?</h2>
        <p class="text-slate-400 text-sm mt-2 px-4">
          ไม่ต้องกังวล! กรอกอีเมลที่ผูกกับบัญชีของคุณ <br>เราจะส่งขั้นตอนการตั้งรหัสผ่านใหม่ไปให้
        </p>
      </div>

      <div v-if="isSuccess" class="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in-up">
        <div class="text-green-500 text-4xl mb-2">✅</div>
        <h3 class="text-green-800 font-bold mb-1">ส่งอีเมลเรียบร้อย!</h3>
        <p class="text-green-600 text-sm">
          กรุณาตรวจสอบกล่องจดหมายของคุณ (และ Junk Mail) เพื่อรีเซ็ตรหัสผ่าน
        </p>
        <router-link to="/login" class="block mt-4 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors">
          กลับไปเข้าสู่ระบบ
        </router-link>
      </div>

      <form v-else @submit.prevent="handleResetRequest" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">อีเมลของคุณ</label>
          <input
            v-model="email"
            type="email"
            placeholder="example@email.com"
            class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            required
            autofocus
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
        >
           <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
           {{ isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน' }}
        </button>
      </form>

      <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100 flex items-center justify-center gap-2">
        ⚠️ {{ errorMessage }}
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "../api"; 

const email = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const isSuccess = ref(false);

const handleResetRequest = async () => {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    // ⚠️ ตรวจสอบว่า Backend มี Route นี้หรือไม่: POST /auth/forgot-password
    await api.post("/auth/forgot-password", {
      email: email.value
    });

    // UX: แสดงหน้า Success แทน Form
    isSuccess.value = true;
    
  } catch (err) {
    console.error(err);
    errorMessage.value = err.response?.data?.message || "ไม่พบอีเมลนี้ในระบบ หรือเกิดข้อผิดพลาด";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Animation เล็กน้อยเพื่อให้ดู Smooth */
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>