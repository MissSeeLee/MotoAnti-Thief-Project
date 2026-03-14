<template>
  <div class="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none relative overflow-hidden">
    
    <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-600 to-indigo-800 rounded-b-[3rem] shadow-lg"></div>

    <div class="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-slide-up">
      
      <div class="px-8 pt-10 pb-10">
        
        <div v-if="status === 'loading'" class="flex flex-col items-center justify-center py-10">
          <span class="loading loading-spinner loading-lg text-blue-600 mb-4"></span>
          <p class="text-slate-500 font-bold animate-pulse text-sm">กำลังตรวจสอบข้อมูลลิงก์...</p>
        </div>

        <div v-else-if="status === 'error'" class="text-center py-6 animate-pop">
          <div class="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 class="text-2xl font-black text-slate-800 mb-2">ลิงก์นี้ไม่สามารถใช้งานได้</h2>
          <p class="text-slate-500 text-sm leading-relaxed mb-8 px-4">
            {{ errorMessage || 'ลิงก์นี้อาจถูกใช้งานไปแล้ว, ถูกยกเลิก, หรือหมดอายุเพื่อความปลอดภัย กรุณาขอลิงก์ใหม่จากเจ้าของรถ' }}
          </p>
          <button @click="closeWindow" class="btn btn-block bg-slate-100 hover:bg-slate-200 text-slate-600 border-none rounded-2xl font-bold h-14">
            ปิดหน้าต่างนี้
          </button>
        </div>

        <div v-else-if="status === 'ready'" class="animate-fade-in">
          <div class="flex flex-col items-center text-center mb-8">
            <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-5 shadow-inner rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-10 h-10 -rotate-3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
            </div>
            <h2 class="text-2xl font-black text-slate-800 leading-tight mb-2">ลงทะเบียนรับแจ้งเตือน</h2>
            <p class="text-[12px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
              สำหรับ: {{ shareData.label }}
            </p>
          </div>

          <div class="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 text-xs text-slate-500 font-medium leading-relaxed">
            คุณได้รับเชิญให้รับการแจ้งเตือนเหตุฉุกเฉิน (โจรกรรม, รถล้ม) สำหรับรถรหัส <b class="text-slate-700">{{ shareData.deviceId }}</b> กรุณากรอกช่องทางติดต่อด้านล่าง
          </div>

          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <span class="text-red-500">*</span> เบอร์โทรศัพท์ (รับ SMS)
              </label>
              <input 
                v-model="form.phone" 
                type="tel" 
                required
                placeholder="08X-XXX-XXXX" 
                class="input w-full bg-slate-50 border-slate-200 focus:border-blue-500 rounded-2xl mt-1 font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 transition-all h-14 text-lg tracking-wider"
              />
            </div>

            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <span class="text-red-500">*</span> อีเมล (รับ Email Alert)
              </label>
              <input 
                v-model="form.email" 
                type="email" 
                required
                placeholder="your@email.com" 
                class="input w-full bg-slate-50 border-slate-200 focus:border-blue-500 rounded-2xl mt-1 font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 transition-all h-14 text-base"
              />
            </div>

            <button 
              type="submit" 
              :disabled="isSubmitting" 
              class="btn btn-block h-14 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-2xl shadow-xl shadow-blue-200 text-base font-black transition-all active:scale-95 mt-8 disabled:bg-slate-300 disabled:shadow-none"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              <span v-else>ยืนยันและเปิดรับการแจ้งเตือน</span>
            </button>
          </form>
          
          <p class="text-[10px] text-center text-slate-400 mt-6 font-medium">
            ข้อมูลของคุณจะถูกใช้เพื่อการแจ้งเตือนความปลอดภัยของรถคันนี้เท่านั้น
          </p>
        </div>

        <div v-else-if="status === 'success'" class="text-center py-6 animate-pop">
          <div class="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl shadow-emerald-200 rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-12 h-12 -rotate-3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <h2 class="text-2xl font-black text-slate-800 mb-2">ลงทะเบียนสำเร็จ!</h2>
          <p class="text-slate-500 text-sm leading-relaxed mb-8 px-4 font-medium">
            ระบบได้ผูกเบอร์ <b>{{ form.phone }}</b> เข้ากับระบบรักษาความปลอดภัยแล้ว กำลังพาไปหน้าติดตามรถ...
          </p>
          <button class="btn btn-block bg-emerald-50 text-emerald-600 border-none rounded-2xl font-black h-14 shadow-sm" disabled>
            <span class="loading loading-spinner"></span> กำลังเปลี่ยนหน้า...
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';

const route = useRoute();
const router = useRouter(); 
const token = route.params.token;

const status = ref('loading'); 
const errorMessage = ref('');
const isSubmitting = ref(false);

const shareData = ref({
  label: '',
  deviceId: ''
});

const form = ref({
  phone: '',
  email: ''
});

onMounted(async () => {
  if (!token) {
    status.value = 'error';
    return;
  }

  try {
    const res = await api.get(`/sharing/verify/${token}`);
    
    if (res.data.success) {
      
      // ✅ ถ้าเคยลงทะเบียนแล้ว ให้ดีดไปหน้า Track ทันที
      if (res.data.share && res.data.share.registeredAt) {
        // ใช้ path /track-public ตามที่เราตั้งใน router
        router.push(`/track-public/${token}`); 
        return;
      }

      shareData.value = {
        label: res.data.share?.label || 'ผู้รับการแชร์',
        deviceId: res.data.share?.deviceId || '-'
      };
      
      status.value = 'ready';

    } else {
      throw new Error('Invalid token');
    }
  } catch (error) {
    console.error('Verify error:', error);
    errorMessage.value = error.response?.data?.message || 'ลิงก์นี้ถูกใช้งานไปแล้วหรือหมดอายุ';
    status.value = 'error';
  }
});

const submitForm = async () => {
  if (!form.value.phone || !form.value.email) return;
  
  isSubmitting.value = true;
  try {
    await api.post(`/sharing/register/${token}`, {
      phone: form.value.phone,
      email: form.value.email
    });
    
    status.value = 'success'; 
    
    // ✅ รอ 2.5 วินาที แล้วค่อยเปลี่ยนไปหน้าแผนที่ (แก้ไข path ตรงนี้)
    setTimeout(() => {
      router.push(`/track-public/${token}`);
    }, 2500);

  } catch (error) {
    console.error('Register error:', error);
    alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || 'ไม่สามารถลงทะเบียนได้'));
  } finally {
    isSubmitting.value = false;
  }
};

const closeWindow = () => {
  router.push('/login'); // เปลี่ยนให้กลับไปหน้าแรกแทน
};
</script>

<style scoped>
.animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slide-up { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.animate-pop { animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes pop { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }

.animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
</style>