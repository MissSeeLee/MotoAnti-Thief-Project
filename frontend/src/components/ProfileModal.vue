<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-[#1e293b] w-full max-w-md rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden relative transform transition-all" @click.stop>
        
        <div class="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent pointer-events-none"></div>
        <button @click="closeModal" class="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="p-8 relative z-0">
          <div class="flex flex-col items-center mb-6">
            <div class="w-20 h-20 rounded-full bg-slate-800 border-4 border-[#0f172a] shadow-xl flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                {{ getInitials(form.name || form.username) }}
            </div>
            <h2 class="mt-3 text-lg font-bold text-white">{{ form.username || 'User' }}</h2>
            <p class="text-xs text-slate-400">ID: {{ form.id }}</p>
          </div>

          <div class="space-y-4">
            <div class="group">
              <label class="text-xs font-bold text-slate-400 ml-1">ชื่อที่แสดง</label>
              <input v-model="form.name" type="text" class="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700/50 rounded-xl text-slate-200 focus:border-blue-500 focus:outline-none transition-all" placeholder="ชื่อของคุณ">
            </div>
            <div class="group">
              <label class="text-xs font-bold text-slate-400 ml-1">อีเมล</label>
              <input v-model="form.email" type="email" class="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700/50 rounded-xl text-slate-200 focus:border-blue-500 focus:outline-none transition-all" placeholder="email@example.com">
            </div>
            <div class="group">
              <label class="text-xs font-bold text-slate-400 ml-1">เบอร์โทรศัพท์</label>
              <input v-model="form.phone" type="tel" maxlength="10" @input="handlePhoneInput" class="w-full px-4 py-2.5 bg-[#0f172a] border border-slate-700/50 rounded-xl text-slate-200 focus:border-blue-500 focus:outline-none transition-all" placeholder="08xxxxxxxx">
            </div>

            <div class="pt-2">
              <button @click="handleChangePassword" class="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 text-slate-300 hover:text-blue-400 text-xs font-bold transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-700/50 flex gap-3">
             <button @click="closeModal" class="px-5 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">ยกเลิก</button>
             <button @click="saveProfile" :disabled="isLoading" class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-all flex justify-center items-center gap-2">
                 <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
                 {{ isLoading ? 'กำลังบันทึก...' : 'บันทึก' }}
             </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import api from "../api";
import { useRouter } from "vue-router";

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(["close", "saved", "toast"]);
const isLoading = ref(false);
const form = reactive({ id: "", username: "", name: "", email: "", phone: "" });
const router = useRouter()
const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "?";

// โหลดข้อมูลเมื่อเปิด Modal
watch(() => props.isOpen, async (newVal) => {
    if (newVal) {
      const stored = localStorage.getItem('user');
      if(stored) {
         const u = JSON.parse(stored);
         Object.assign(form, { id: u.id, username: u.username, name: u.name, email: u.email, phone: u.phone });
      }
      try {
        // ดึงข้อมูลล่าสุดจาก Server
        const res = await api.get("/auth/me");
        const u = res.data.user || res.data;
        Object.assign(form, { id: u.id, username: u.username, name: u.name || "", email: u.email || "", phone: u.phone || "" });
      } catch (err) { console.error(err); }
    }
});

const handlePhoneInput = (e) => {
  let val = e.target.value.replace(/\D/g, "").slice(0, 10);
  form.phone = val; e.target.value = val;
};

const saveProfile = async () => {
  isLoading.value = true;
  try {
    const res = await api.put("/auth/me", { 
      name: form.name, 
      email: form.email, 
      phone: form.phone 
    });
    
    const updatedUser = res.data.user || res.data;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    // ✅ แก้ตรงนี้: ส่งเป็น Object ก้อนเดียว
    emit("toast", { 
      title: "สำเร็จ", 
      message: "บันทึกข้อมูลเรียบร้อย", 
      icon: "✅", 
      color: "alert-success" 
    });

    emit("saved", updatedUser);
    emit("close");
  } catch (err) {
    // ✅ แก้ตรงนี้ด้วย
    emit("toast", { 
      title: "ผิดพลาด", 
      message: err.response?.data?.message || "บันทึกไม่สำเร็จ", 
      icon: "❌", 
      color: "alert-error" 
    });
  } finally { isLoading.value = false; }
};
const handleChangePassword = () => {
  // Option 1: พาไปหน้าเปลี่ยนรหัสผ่าน
  router.push('/change-password');
}


const closeModal = () => emit("close");
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.95); }
.modal-fade-enter-to, .modal-fade-leave-from { opacity: 1; transform: scale(1); }
</style>