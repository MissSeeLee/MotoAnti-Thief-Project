<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 border border-slate-50">
      
      <div class="text-center mb-8">
        <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
          🆕
        </div>
        <h2 class="text-2xl font-bold text-slate-800">ตั้งรหัสผ่านใหม่</h2>
        <p class="text-slate-400 text-sm mt-1">กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน</p>
      </div>

      <form @submit.prevent="handleResetPassword" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">รหัสผ่านใหม่</label>
          <input
            v-model="newPassword"
            type="password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold shadow-lg transition-all flex justify-center items-center gap-2"
        >
           <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
           {{ isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่' }}
        </button>
      </form>

      <div v-if="message" :class="`mt-4 p-3 rounded-lg text-sm text-center ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api";

const route = useRoute();
const router = useRouter();

const newPassword = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);
const message = ref("");
const isError = ref(false);
const token = ref("");

onMounted(() => {
  // ดึง Token จาก URL (?token=xxxx)
  token.value = route.query.token;
  if (!token.value) {
    isError.value = true;
    message.value = "Token ไม่ถูกต้องหรือหมดอายุ";
  }
});

const handleResetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    isError.value = true;
    message.value = "รหัสผ่านไม่ตรงกัน";
    return;
  }

  isLoading.value = true;
  message.value = "";

  try {
    // ส่ง Token และ รหัสใหม่ไปที่ Backend
    await api.post("/auth/reset-password", {
      token: token.value,
      newPassword: newPassword.value
    });

    isError.value = false;
    message.value = "เปลี่ยนรหัสผ่านสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...";
    
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (err) {
    isError.value = true;
    message.value = err.response?.data?.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัส";
  } finally {
    isLoading.value = false;
  }
};
</script>