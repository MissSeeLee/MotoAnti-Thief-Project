<template>
  <div class="flex flex-col h-dvh bg-slate-100 relative font-sans overflow-hidden select-none">
    
    <div class="absolute top-20 left-0 right-0 z-[2000] flex flex-col items-center gap-2 pointer-events-none px-4">
      <transition-group name="toast-slide">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          class="flex items-center gap-3 px-4 py-3 rounded-full shadow-xl border backdrop-blur-md pointer-events-auto min-w-[200px] max-w-sm bg-white/95 ring-1 ring-black/5"
          :class="getToastStyle(toast.type)"
        >
          <span class="text-xl filter drop-shadow-sm">{{ toast.icon }}</span>
          <div class="flex flex-col">
              <span class="text-sm font-bold leading-tight text-slate-800">{{ toast.title }}</span>
              <span v-if="toast.message" class="text-[10px] text-slate-500 font-medium">{{ toast.message }}</span>
          </div>
          <button @click="removeToast(toast.id)" class="ml-auto opacity-50 hover:opacity-100 p-1 hover:bg-black/5 rounded-full transition-colors">✕</button>
        </div>
      </transition-group>
    </div>

    <div class="absolute top-4 left-4 right-4 z-[500] pointer-events-none flex flex-col gap-2 items-center">
      <div class="bg-white/90 backdrop-blur-md shadow-lg rounded-full p-2 pr-5 border border-white/50 pointer-events-auto flex items-center gap-3 w-full max-w-lg mx-auto ring-1 ring-black/5 transition-all hover:shadow-xl relative group">
        <input 
            type="date" 
            ref="dateInput"
            v-model="selectedDate" 
            @change="loadHistory"
            @click="showPicker"
            class="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
        />
        <button @click="router.push('/')" class="btn btn-circle btn-sm btn-ghost text-slate-400 hover:bg-slate-100 z-20 relative">✕</button>
        <div class="flex-1 flex flex-col justify-center pointer-events-none pl-2">
           <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-blue-500 transition-colors">DATE</div>
           <div class="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight flex items-center gap-2">
              {{ formattedDateDisplay }} <span class="text-[10px] text-slate-400">▼</span>
           </div>
        </div>
      </div>
    </div>

    <div id="historyMap" class="w-full h-full z-0 bg-slate-200"></div>

    <transition name="fade">
      <div v-if="loading" class="absolute inset-0 z-[1500] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div class="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
            <span class="loading loading-spinner loading-lg text-blue-600"></span>
            <span class="text-slate-500 font-bold text-sm animate-pulse">กำลังโหลดเส้นทาง...</span>
          </div>
      </div>
    </transition>

    <transition name="slide-up">
      <div v-if="historyData.length > 0" class="absolute bottom-8 left-4 right-4 z-[1000] max-w-lg mx-auto pointer-events-none">
        <div class="pointer-events-auto flex flex-col gap-3">
            
            <div class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-4 relative ring-1 ring-black/5 transition-all"
                 :class="{'ring-2 ring-red-500 bg-red-50/95': currentAlertAtPointer}">
                <div class="flex justify-between items-end">
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span class="bg-slate-100 p-1 rounded px-2" :class="{'bg-red-500 text-white': currentAlertAtPointer}">🕒 TIME</span>
                            <span v-if="currentAlertAtPointer" class="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-bounce flex items-center gap-1">
                               🚨 {{ currentAlertAtPointer.type || 'EVENT' }}
                            </span>
                            <span v-else-if="isPlaying" class="text-green-500 animate-pulse text-[10px] font-bold flex items-center gap-1">
                              <span class="w-2 h-2 bg-green-500 rounded-full"></span> PLAYING
                            </span>
                        </div>
                        <div class="text-4xl font-black text-slate-800 tabular-nums leading-none tracking-tight mt-2 font-mono"
                             :class="{'text-red-600': currentAlertAtPointer}">
                            {{ formatTime(historyData[currentIndex]?.createdAt) }}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SPEED</div>
                        <div class="text-2xl font-bold text-blue-600 tabular-nums leading-none mt-1">
                            {{ historyData[currentIndex]?.speed || 0 }} <span class="text-xs text-slate-400 font-medium">km/h</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white/90 backdrop-blur-md rounded-full shadow-xl p-2 pl-2 flex items-center gap-3 border border-white/50 ring-1 ring-black/5">
                <button @click="togglePlay" class="btn btn-circle btn-primary text-white shadow-md border-none hover:scale-105 transition-all flex-shrink-0 active:scale-95"
                    :class="isPlaying ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'">
                    <span v-if="!isPlaying" class="pl-1">▶</span>
                    <span v-else>⏸</span>
                </button>

                <div class="flex-1 relative h-10 flex items-center group mx-1 cursor-pointer">
                    <div class="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-200 rounded-full overflow-hidden transform -translate-y-1/2 group-hover:h-2 transition-all">
                        <div class="h-full bg-blue-500 transition-all duration-100 ease-linear" :style="{ width: progressPercentage + '%' }"></div>
                    </div>
                    
                    <div class="absolute top-1/2 left-0 right-0 h-3 pointer-events-none transform -translate-y-1/2">
                        <div v-for="tick in alertTimelineTicks" :key="tick.id"
                             class="absolute w-[2px] h-[80%] top-[10%] bg-red-500 rounded-full z-10 opacity-90"
                             :style="{ left: tick.percent + '%' }"></div>
                    </div>
                    
                    <input type="range" min="0" :max="historyData.length - 1" v-model.number="currentIndex" @input="handleSliderChange"
                        class="range range-xs w-full cursor-pointer touch-none z-20 relative opacity-0 h-full" />
                </div>

                <div class="dropdown dropdown-top dropdown-end mr-1">
                    <label tabindex="0" class="btn btn-circle btn-xs btn-ghost text-[10px] font-bold text-slate-500 border border-slate-200 w-9 h-9">
                      {{ playbackSpeed }}x
                    </label>
                    <ul tabindex="0" class="dropdown-content menu p-1 shadow-xl bg-white rounded-xl w-16 mb-2 text-xs border border-slate-100 z-[600]">
                        <li v-for="s in [1, 5, 10, 20]" :key="s">
                          <a @click="playbackSpeed = s" :class="{active: playbackSpeed === s}" class="py-2 justify-center font-bold">{{ s }}x</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api'; 

const route = useRoute();
const router = useRouter();
const deviceId = route.params.deviceId;

// --- State ---
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const historyData = ref([]); 
const alertLogs = ref([]); 
const currentIndex = ref(0);
const loading = ref(false);
const isPlaying = ref(false);
const playbackSpeed = ref(10);
const toasts = ref([]);
let toastId = 0;

// --- Map Objects ---
let map = null;
let polyline = null;
let currentPointMarker = null; 
let alertLayer = null;         
let playInterval = null;

// --- Computed ---
const progressPercentage = computed(() => {
    if (historyData.value.length === 0) return 0;
    return (currentIndex.value / (historyData.value.length - 1)) * 100;
});

const alertTimelineTicks = computed(() => {
  if (historyData.value.length === 0 || alertLogs.value.length === 0) return [];
  const startTime = new Date(historyData.value[0].createdAt).getTime();
  const endTime = new Date(historyData.value[historyData.value.length - 1].createdAt).getTime();
  const totalDuration = endTime - startTime;

  return alertLogs.value.map(alert => {
    const alertTime = new Date(alert.createdAt).getTime();
    const percent = ((alertTime - startTime) / totalDuration) * 100;
    return { id: alert.id, percent: Math.min(Math.max(percent, 0), 100) };
  });
});

const currentAlertAtPointer = computed(() => {
  if (!historyData.value[currentIndex.value] || alertLogs.value.length === 0) return null;
  const currentTime = new Date(historyData.value[currentIndex.value].createdAt).getTime();
  return alertLogs.value.find(alert => Math.abs(currentTime - new Date(alert.createdAt).getTime()) < 30000);
});

const formattedDateDisplay = computed(() => {
  if (!selectedDate.value) return 'เลือกวันที่';
  const [y, m, d] = selectedDate.value.split('-');
  return `${d}/${m}/${parseInt(y) + 543}`;
});

// --- Lifecycle ---
onMounted(() => { setTimeout(initMap, 100); });
onUnmounted(() => { stopPlay(); if(map) map.remove(); });

// --- Logic ---
const initMap = () => {
  if(map) return;
  map = L.map('historyMap', { zoomControl: false, attributionControl: false }).setView([13.7563, 100.5018], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
  alertLayer = L.layerGroup().addTo(map);
};

const loadHistory = async () => {
  stopPlay();
  loading.value = true;
  if(polyline) map.removeLayer(polyline);
  if(currentPointMarker) map.removeLayer(currentPointMarker);
  alertLayer.clearLayers();
  
  try {
      let start = new Date(selectedDate.value); start.setHours(0,0,0,0);
      let end = new Date(selectedDate.value); end.setHours(23,59,59,999);

      const [historyRes, alertRes] = await Promise.all([
        api.get(`/devices/${deviceId}/history`, { params: { start: start.toISOString(), end: end.toISOString() } }),
        api.get(`/devices/${deviceId}/alerts`, { params: { start: start.toISOString(), end: end.toISOString() } })
      ]);

      historyData.value = historyRes.data.filter(p => p.lat && p.lng);
      alertLogs.value = alertRes.data;

      if (historyData.value.length > 0) {
          drawRoute();
          plotAlerts();
          
          currentPointMarker = L.circleMarker([historyData.value[0].lat, historyData.value[0].lng], {
              radius: 8, fillColor: '#2563eb', color: '#fff', weight: 3, opacity: 1, fillOpacity: 1
          }).addTo(map);

          currentIndex.value = 0;
          updatePosition();
          showToast('โหลดสำเร็จ', `พบข้อมูล ${historyData.value.length} จุด`);
      } else {
          showToast('ไม่พบข้อมูล', 'ไม่มีการเดินทางในวันนี้', 'warning');
      }
  } catch (e) { 
      showToast('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ Server ได้', 'error');
  } finally { loading.value = false; }
};

const drawRoute = () => {
    const latlngs = historyData.value.map(p => [p.lat, p.lng]);
    polyline = L.polyline(latlngs, { color: '#3b82f6', weight: 5, opacity: 0.6 }).addTo(map);
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
};

// ✨ แก้ไขระบบจุดแจ้งเตือนตรงนี้: เปลี่ยนมาใช้ divIcon แบบคลื่นเรดาร์
const plotAlerts = () => {
    alertLogs.value.forEach(alert => {
        if(alert.lat && alert.lng) {
            const radarIcon = L.divIcon({
                className: 'custom-radar-icon',
                html: `<div class="radar-ping"></div><div class="core-dot"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });

            L.marker([alert.lat, alert.lng], { icon: radarIcon })
             .addTo(alertLayer)
             .bindPopup(`🚨 <b>${alert.type}</b><br>${formatTime(alert.createdAt)}`);
        }
    });
};

const updatePosition = () => {
    if(!currentPointMarker || !historyData.value[currentIndex.value]) return;
    const point = historyData.value[currentIndex.value];
    currentPointMarker.setLatLng([point.lat, point.lng]);
    if(isPlaying.value) map.panTo([point.lat, point.lng], { animate: true, duration: 0.25 });
};

const togglePlay = () => { if (isPlaying.value) stopPlay(); else startPlay(); };

const startPlay = () => {
    if (historyData.value.length < 2) return;
    if (currentIndex.value >= historyData.value.length - 1) currentIndex.value = 0;
    isPlaying.value = true;
    playInterval = setInterval(() => {
        if (currentIndex.value < historyData.value.length - 1) {
            currentIndex.value++;
            updatePosition();
        } else { stopPlay(); }
    }, 1000 / playbackSpeed.value);
};

const stopPlay = () => { isPlaying.value = false; clearInterval(playInterval); };

const handleSliderChange = () => { stopPlay(); updatePosition(); };

const showToast = (title, message = '', type = 'success') => {
  const id = toastId++;
  const iconMap = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toasts.value.push({ id, title, message, type, icon: iconMap[type] });
  setTimeout(() => removeToast(id), 3000);
};

const removeToast = (id) => toasts.value = toasts.value.filter(t => t.id !== id);
const getToastStyle = (type) => type === 'error' ? 'text-red-600 border-red-100' : (type === 'warning' ? 'text-orange-600 border-orange-100' : 'text-emerald-600 border-emerald-100');
const showPicker = (e) => { if (e.target.showPicker) e.target.showPicker(); };
const formatTime = (t) => t ? new Date(t).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}) : "--:--";

watch(playbackSpeed, () => { if(isPlaying.value) startPlay(); });
</script>

<style>
/* 🎯 CSS ชุดใหม่ สำหรับจุดเรดาร์บนแผนที่ให้ดูสมูท */
.custom-radar-icon {
  position: relative;
}
.core-dot {
  width: 14px;
  height: 14px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
  position: absolute;
  top: 0;
  left: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 2;
}
.radar-ping {
  width: 100%;
  height: 100%;
  background-color: #ef4444;
  border-radius: 50%;
  position: absolute;
  z-index: 1;
  animation: radar-ping-anim 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes radar-ping-anim {
  75%, 100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

/* 🎚️ ปรับแต่ง Slider Thumb ให้ดูดีขึ้น */
input[type=range]::-webkit-slider-thumb {
  pointer-events: auto;
  width: 24px; height: 24px;
  background: #2563eb;
  border: 4px solid white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-20px) scale(0.9); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s ease-out; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100px); opacity: 0; }
</style>