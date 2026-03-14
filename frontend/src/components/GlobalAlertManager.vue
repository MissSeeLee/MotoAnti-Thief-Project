<template>
  <div class="flex h-dvh w-screen overflow-hidden bg-slate-900 font-sans relative select-none">
    
    <MapViewer
      v-show="hasLocation"
      ref="mapViewerRef"
      :data="deviceArray"
      :geofence="{ enabled: false }"
      class="absolute inset-0 w-full h-full z-0"
    />

    <div v-if="!hasLocation" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 bg-slate-900">
      <div class="relative w-40 h-40 flex items-center justify-center mb-8">
        <div class="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" style="animation-duration: 3s;"></div>
        <div class="absolute inset-4 border-4 border-blue-500/40 rounded-full animate-ping" style="animation-duration: 2s;"></div>
        
        <div class="relative z-10 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-10 h-10 text-white animate-pulse">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
          </svg>
        </div>
      </div>

      <h2 class="text-2xl font-black text-white mb-3 tracking-wide">
        กำลังรอสัญญาณแรก...
      </h2>
      <p class="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
        ระบบเชื่อมต่อกับอุปกรณ์แล้ว แต่กำลังรอพิกัด GPS เพื่อระบุตำแหน่งรถของคุณ
      </p>
    </div>

    <div @click="focusOnCar" 
         class="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10 bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-5 border border-slate-100 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
      
      <div class="flex justify-between items-start mb-4">
        <div>
          <h2 class="text-lg font-black text-slate-800">{{ deviceInfo.name || 'กำลังโหลดข้อมูล...' }}</h2>
          <div class="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase mt-1"
               :class="{
                 'text-emerald-500': currentStatus === 'ONLINE',
                 'text-slate-400': currentStatus === 'OFFLINE',
                 'text-amber-500': currentStatus === 'PARKED'
               }">
            <span class="w-2 h-2 rounded-full" 
                  :class="{
                    'bg-emerald-500 animate-pulse': currentStatus === 'ONLINE',
                    'bg-slate-400': currentStatus === 'OFFLINE',
                    'bg-amber-500': currentStatus === 'PARKED'
                  }"></span>
            {{ currentStatus }}
          </div>
        </div>
        
        <button v-if="hasLocation" @click.stop="toggleTracking"
                class="btn btn-circle btn-sm border-none shadow-sm transition-colors"
                :class="isTracking ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'"
                :title="isTracking ? 'ปิดโหมดตามติด' : 'เปิดโหมดตามติด'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M11.99 2.25a.75.75 0 01.75.75v1.516a8.256 8.256 0 017.001 7.001h1.516a.75.75 0 010 1.5h-1.516a8.256 8.256 0 01-7.001 7.001v1.516a.75.75 0 01-1.5 0v-1.516a8.256 8.256 0 01-7.001-7.001H2.734a.75.75 0 010-1.5h1.516a8.256 8.256 0 017.001-7.001V3a.75.75 0 01.74-.75zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center">
          <span class="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Engine</span>
          <span class="text-sm font-black" :class="deviceInfo.ign ? 'text-blue-600' : 'text-slate-400'">
            {{ deviceInfo.ign ? 'ON' : 'OFF' }}
          </span>
        </div>
        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
          <div v-if="deviceInfo.currentBattery < 20" class="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
          <span class="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Battery</span>
          <span class="text-sm font-black text-slate-700 flex items-center gap-1">
            <svg v-if="deviceInfo.currentBattery < 20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-amber-500"><path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clip-rule="evenodd" /></svg>
            {{ deviceInfo.currentBattery || 0 }}%
          </span>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-10 flex gap-3">
      <button @click="triggerFindCar" :disabled="loadingFind" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] h-14 font-black text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-transform active:scale-95 disabled:opacity-70">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
        {{ loadingFind ? 'กำลังส่งคำสั่ง...' : 'กดเพื่อหารถ' }}
      </button>
      
      <button @click="showEditModal = true" class="w-14 h-14 bg-white/90 backdrop-blur-md text-slate-600 hover:text-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-xl border border-slate-100 transition-transform active:scale-95">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
      </button>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4 max-w-md mx-auto">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showEditModal = false"></div>
      <div class="relative w-full bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-8 animate-slide-up">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-slate-800">ข้อมูลรับแจ้งเตือน</h3>
          <button @click="showEditModal = false" class="btn btn-circle btn-ghost btn-sm bg-slate-100">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์ (SMS)</label>
            <input v-model="subscriber.phone" type="tel" placeholder="08xxxxxxxx" class="input w-full bg-slate-50 border-slate-200 mt-1 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมลแจ้งเตือน</label>
            <input v-model="subscriber.email" type="email" placeholder="email@example.com" class="input w-full bg-slate-50 border-slate-200 mt-1 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <button @click="updateInfo" class="btn btn-block h-14 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-2xl shadow-xl shadow-blue-200 text-base font-black mt-8">
          บันทึกการแก้ไข
        </button>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="showToast" 
           class="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md min-w-[300px] border transition-all duration-300"
           :class="toastData.colorClass">
        <div class="text-2xl">{{ toastData.icon }}</div>
        <div class="flex-1">
          <h3 class="font-bold text-sm tracking-wide">{{ toastData.title }}</h3>
          <p class="text-xs opacity-90">{{ toastData.message }}</p>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { io } from "socket.io-client";
import axios from 'axios';
import MapViewer from '../components/MapViewer.vue';

const route = useRoute();
const token = route.params.token;

const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
const socket = io(socketUrl, {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
});

const deviceInfo = ref({});
const subscriber = ref({ phone: '', email: '' });
const currentStatus = ref('OFFLINE'); 

const showEditModal = ref(false);
const loadingFind = ref(false);
const mapViewerRef = ref(null);
const isTracking = ref(true); 

const hasLocation = computed(() => {
  const lat = Number(deviceInfo.value.lat);
  const lng = Number(deviceInfo.value.lng);
  return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
});

const deviceArray = computed(() => {
  if (!hasLocation.value) return [];
  return [{
    id: deviceInfo.value.deviceId,
    name: deviceInfo.value.name,
    lat: Number(deviceInfo.value.lat),
    lng: Number(deviceInfo.value.lng),
    status: currentStatus.value, 
    ign: deviceInfo.value.ign,
    battery: deviceInfo.value.currentBattery,
    geofence: { enabled: false }
  }];
});

// 🍞 Toast Logic
const showToast = ref(false);
const toastData = reactive({ title: "", message: "", icon: "", colorClass: "" });

const triggerToast = (title, message, icon, colorCode) => {
  toastData.title = title;
  toastData.message = message;
  toastData.icon = icon;
  if (colorCode.includes("success")) toastData.colorClass = "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20";
  else if (colorCode.includes("error")) toastData.colorClass = "bg-rose-600 text-white border-rose-500 shadow-rose-900/20";
  else if (colorCode.includes("warning")) toastData.colorClass = "bg-amber-500 text-white border-amber-400 shadow-amber-900/20";
  else if (colorCode.includes("info")) toastData.colorClass = "bg-blue-600 text-white border-blue-500 shadow-blue-900/20";
  else toastData.colorClass = "bg-slate-800 text-white border-slate-700 shadow-lg";

  showToast.value = true;
  if (toastData.timer) clearTimeout(toastData.timer);
  toastData.timer = setTimeout(() => (showToast.value = false), 3000);
};

const focusOnCar = () => {
  if (!hasLocation.value) return;
  isTracking.value = true;
  if (mapViewerRef.value && deviceInfo.value.deviceId) {
    mapViewerRef.value.focusCar(deviceInfo.value.deviceId);
  }
};

const toggleTracking = () => {
  isTracking.value = !isTracking.value;
  if (isTracking.value) {
    focusOnCar();
    triggerToast("Auto-Follow", "เปิดโหมดตามติดตำแหน่งรถแล้ว", "🎯", "alert-info");
  } else {
    triggerToast("Free View", "เลื่อนดูแผนที่ได้อย่างอิสระ", "✋", "alert-warning");
  }
};

// 🚦 ฟังก์ชันแปลผลสถานะให้ตรงกับ Dashboard (สำคัญมาก!)
const calculateStatus = (rawIgn) => {
    const isIgnOn = (rawIgn === "ON" || rawIgn === "on" || rawIgn === true || rawIgn === 1 || String(rawIgn) === "1");
    // ถ้าเครื่องติด = ONLINE (สีเขียว), ถ้าเครื่องดับ = PARKED (สีส้ม)
    return isIgnOn ? "ONLINE" : "PARKED"; 
};

const fetchInitialData = async () => {
  try {
    const res = await axios.get(`/api/sharing/live/${token}`);
    if (res.data.success) {
      deviceInfo.value = res.data.device;
      subscriber.value = res.data.subscriber;
      
      const rawIgn = res.data.device.ign;
      deviceInfo.value.ign = (rawIgn === "ON" || rawIgn === "on" || rawIgn === true || rawIgn === 1 || String(rawIgn) === "1");

      // 🚨 แก้ไข 2: แปลผลสถานะให้ตรงกับ Dashboard (Engine OFF = PARKED)
      if (res.data.device.status === 'OFFLINE') {
          currentStatus.value = "OFFLINE"; // ถ้า API ส่งมาว่า Offline ก็ตามนั้น
      } else {
          currentStatus.value = calculateStatus(rawIgn); // ถ้าไม่ Offline ให้ดูที่กุญแจรถ
      }

      if (hasLocation.value) {
        setTimeout(() => { focusOnCar(); }, 500);
      }
    }
  } catch (err) {
    triggerToast("Error", "ไม่สามารถเข้าถึงข้อมูลรถได้ (ลิ้งก์อาจหมดอายุ)", "❌", "alert-error");
  }
};

const triggerFindCar = async () => {
  loadingFind.value = true;
  try {
    await axios.post(`/api/sharing/find/${token}`);
    triggerToast("Sent", "ส่งสัญญาณตามหาแล้ว", "📢", "alert-info");
  } catch (e) {
    triggerToast("Error", "ส่งคำสั่งไม่สำเร็จ", "❌", "alert-error");
  } finally {
    loadingFind.value = false;
  }
};

const updateInfo = async () => {
  try {
    await axios.put(`/api/sharing/subscriber/${token}`, subscriber.value);
    showEditModal.value = false;
    triggerToast("สำเร็จ", "อัปเดตข้อมูลรับแจ้งเตือนเรียบร้อย", "✅", "alert-success");
  } catch (err) {
    triggerToast("ผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "❌", "alert-error");
  }
};

onMounted(async () => {
  await fetchInitialData();

  socket.on("new_location", (data) => {
    if (deviceInfo.value.deviceId === data.deviceId) {
      deviceInfo.value.lat = Number(data.lat);
      deviceInfo.value.lng = Number(data.lng);
      deviceInfo.value.currentBattery = data.battery ?? data.batt ?? data.currentBattery ?? deviceInfo.value.currentBattery;

      const rawIgn = data.ign;
      const isIgnOn = (rawIgn === "ON" || rawIgn === "on" || rawIgn === true || rawIgn === 1 || String(rawIgn) === "1");
      deviceInfo.value.ign = isIgnOn;
      
      // 🚨 ซิงค์สถานะตาม Dashboard ทันทีที่มีข้อมูลเข้า (Engine OFF = PARKED)
      currentStatus.value = calculateStatus(rawIgn);

      if (isTracking.value && mapViewerRef.value && hasLocation.value) {
        mapViewerRef.value.focusCar(data.deviceId);
      }
    }
  });

  socket.on("device_offline", (data) => {
    if (deviceInfo.value.deviceId === data.deviceId) {
        currentStatus.value = "OFFLINE"; 
        deviceInfo.value.ign = false;
    }
  });

  socket.on("new_alert", (data) => {
    if (deviceInfo.value.deviceId === data.deviceId) {
       if (data.message.includes("FINDING START")) {
          triggerToast("Find Bike", "ส่งเสียงค้นหารถ...", "📢", "alert-info");
       } else if (data.message.includes("THEFT") || data.message.includes("ACCIDENT")) {
          triggerToast("Critical Alert", "มีการสั่นสะเทือน หรือเกิดเหตุรุนแรง!", "🚨", "alert-error");
       }
    }
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
});
</script>

<style scoped>
.animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-20px); }
</style>