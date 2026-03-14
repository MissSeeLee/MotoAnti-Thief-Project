<template>
  <div class="p-10 text-center">
    <h1 v-if="loading">กำลังตรวจสอบ...</h1>
    <h1 v-else-if="success" class="text-green-500">ยืนยันสำเร็จ! 🎉</h1>
    <h1 v-else class="text-red-500">เกิดข้อผิดพลาด: {{ error }}</h1>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api'; // เช็คว่า import ถูกไฟล์

const route = useRoute();
const loading = ref(true);
const success = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    const token = route.query.token; // ดึง token จาก URL
    if (!token) throw new Error('ไม่พบ Token');

    // ยิง API ไปบอก Backend
    await api.post('/auth/verify-email', { token });
    
    success.value = true;
  } catch (err) {
    error.value = err.response?.data?.message || err.message;
  } finally {
    loading.value = false;
  }
});
</script>