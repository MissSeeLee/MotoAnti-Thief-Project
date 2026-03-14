<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div class="bg-[#1e293b] w-full max-w-md rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden relative transform transition-all" @click.stop>
        
        <div class="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none"></div>
        
        <button 
          @click="!isLoading && closeModal()" 
          class="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors z-10 disabled:opacity-30"
          :disabled="isLoading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="p-8 relative z-0">
          <div class="flex flex-col items-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 shadow-xl flex items-center justify-center text-3xl text-white bg-gradient-to-tr from-indigo-500 to-purple-600">
                🔑
            </div>
            <h2 class="mt-4 text-xl font-black text-white tracking-tight">ตั้งรหัสผ่านใหม่</h2>
            <p class="text-xs text-slate-400 mt-1">กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน</p>
          </div>

          <div class="space-y-5">
            <div class="group">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">รหัสผ่านใหม่</label>
              <input 
                v-model="form.newPassword" 
                type="password" 
                :disabled="isLoading"
                class="w-full px-4 py-3 bg-[#0f172a] border border-slate-700/50 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600 disabled:opacity-50" 
                placeholder="อย่างน้อย 8 ตัวอักษร"
              >
            </div>

            <div class="group">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ยืนยันรหัสผ่านใหม่</label>
              <input 
                v-model="form.confirmPassword" 
                type="password" 
                :disabled="isLoading"
                class="w-full px-4 py-3 bg-[#0f172a] border border-slate-700/50 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600 disabled:opacity-50" 
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              >
            </div>
          </div>

          <div class="mt-8 flex flex-col gap-3">
             <button 
                @click="handleUpdatePassword" 
                :disabled="isLoading" 
                class="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:grayscale disabled:opacity-50"
             >
                 <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
                 {{ isLoading ? 'กำลังอัปเดต...' : 'ยืนยันการเปลี่ยนรหัสผ่าน' }}
             </button>
             
             <button 
                v-if="!isLoading"
                @click="closeModal" 
                class="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-white transition-colors"
             >
                ยกเลิกและกลับหน้าเดิม
             </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import api from "../api";

const router = useRouter();
const isOpen = ref(true); // ✅ เปิดตลอดเวลาเพราะเป็นหน้า Page
const isLoading = ref(false);

const emit = defineEmits(["toast"]); // เอาไว้ส่ง Toast แจ้งเตือน (ถ้าใช้ App.vue รับ)

const form = reactive({
  newPassword: "",
  confirmPassword: ""
});

const handleUpdatePassword = async () => {
  if (!form.newPassword || !form.confirmPassword) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน"); // แจ้งเตือนแบบง่าย (หรือใช้ Toast)
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    alert("รหัสผ่านใหม่ไม่ตรงกัน");
    return;
  }
  if (form.newPassword.length < 8) {
    alert("รหัสผ่านต้องยาวอย่างน้อย 8 ตัว");
    return;
  }

  isLoading.value = true;
  try {
    // ✅ ส่งไปแค่รหัสใหม่ (Backend ต้องไม่เช็ครหัสเก่านะครับ)
    await api.put("/auth/change-password", {
      newPassword: form.newPassword
    });

    alert("สำเร็จ! กรุณาเข้าสู่ระบบใหม่"); // แจ้งเตือนสำเร็จ
    
    // เคลียร์ค่าและ Logout
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    setTimeout(() => {
      router.push("/login");
    }, 1000);

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "เปลี่ยนรหัสไม่สำเร็จ");
  } finally {
    isLoading.value = false;
  }
};

// ✅ ฟังก์ชันปิด Modal (จริงๆ คือพาผู้ใช้กลับไป Dashboard)
const closeModal = () => {
  // เลือกเอาว่าจะให้กลับไปไหน
  router.push('/dashboard'); 
  // หรือ router.back(); ถ้าอยากให้ย้อนกลับไปหน้าก่อนหน้า
};
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }
</style>