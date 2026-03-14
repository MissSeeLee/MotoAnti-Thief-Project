<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fade-in">
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
      
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-gray-800 text-lg">เพิ่มอุปกรณ์ใหม่</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">✖</button>
      </div>

      <div class="p-6 space-y-4">
        
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Device ID (Serial Number)</label>
          <input 
            v-model="form.deviceId" 
            type="text" 
            class="w-full bg-white text-slate-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm placeholder-gray-400"
            placeholder="เช่น lilygo-test-01"
            required
          /> 
          </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-1">ตั้งชื่อรถ</label>
          <input 
            v-model="form.name" 
            type="text" 
            class="w-full bg-white text-slate-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400"
            placeholder="เช่น รถคันเก่ง"
            required
          />
          </div>

        <div v-if="errorMessage" class="text-red-500 text-xs bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
          <span>⚠️ {{ errorMessage }}</span>
        </div>

      </div>

      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
        <button 
          @click="$emit('close')" 
          class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          ยกเลิก
        </button>
        <button 
          @click="submit" 
          :disabled="loading"
          class="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          {{ loading ? 'กำลังบันทึก...' : 'เพิ่มอุปกรณ์' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import api from '../api';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close', 'added']);

const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  deviceId: '',
  name: ''
});

// Reset Form เมื่อ Modal เปิดขึ้นมาใหม่
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.deviceId = '';
    form.name = '';
    errorMessage.value = '';
    loading.value = false;
  }
});

const submit = async () => {
  errorMessage.value = '';

  // Validation พื้นฐาน
  if (!form.deviceId.trim() || !form.name.trim()) {
    errorMessage.value = "กรุณากรอกข้อมูลให้ครบถ้วน";
    return;
  }
  
  loading.value = true;
  try {
    // ส่งข้อมูลไป Backend (ตัด emergencyPhone ออกแล้ว)
    await api.post('/devices', {
      deviceId: form.deviceId.trim(),
      name: form.name.trim()
      // emergencyPhone: ไม่ส่งแล้ว ให้ Backend ใช้เบอร์จาก User Profile
    });

    emit('added'); // แจ้ง Parent Component ว่าเพิ่มเสร็จแล้ว (ให้ refresh list)
    emit('close'); // ปิด Modal
    
  } catch (err) {
    console.error("Add Device Error:", err);
    // ดึง Error Message จาก Backend มาแสดง
    const msg = err.response?.data?.message || err.response?.data?.error || "เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์";
    errorMessage.value = msg;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Animation สำหรับ Modal */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>