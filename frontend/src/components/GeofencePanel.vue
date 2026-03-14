<template>
  <Transition 
      enter-active-class="transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" 
      enter-from-class="translate-y-full opacity-0 scale-95 md:scale-100" 
      enter-to-class="translate-y-0 opacity-100 scale-100" 
      leave-active-class="transition-all duration-300 ease-in" 
      leave-from-class="translate-y-0 opacity-100 scale-100" 
      leave-to-class="translate-y-full opacity-0 scale-95 md:scale-100"
  >
    <div v-if="isOpen" 
         class="fixed z-[600] pointer-events-auto
                bottom-0 left-0 right-0 
                bg-white/95 backdrop-blur-2xl rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-white/60
                md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-[420px] md:rounded-[2rem] md:shadow-2xl md:border
                max-h-[85vh] flex flex-col overflow-hidden" 
    > 
       
       <div class="w-full flex justify-center pt-4 pb-2 md:hidden flex-none cursor-grab" @click="$emit('close')">
          <div class="w-12 h-1.5 bg-slate-200/80 rounded-full"></div>
       </div>

       <div class="flex flex-col w-full overflow-y-auto custom-scrollbar"> 
          
          <div class="px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
                       :class="localGeofence.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  </div>
                  <div>
                    <h3 class="font-black text-slate-800 text-base leading-none">Geofence</h3>
                    <div class="flex items-center gap-1.5 mt-1">
                       <span class="w-2 h-2 rounded-full" :class="localGeofence.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"></span>
                       <span class="text-[11px] font-bold" :class="localGeofence.enabled ? 'text-emerald-600' : 'text-slate-400'">
                           {{ localGeofence.enabled ? 'กำลังทำงาน' : 'ปิดการทำงาน' }}
                       </span>
                    </div>
                  </div>
              </div>
              <button @click="$emit('close')" class="btn btn-sm btn-circle btn-ghost text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
          </div>

          <div class="px-6 pb-6 space-y-5">
              
              <div class="flex items-center justify-between bg-slate-50/80 px-4 py-3.5 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                   @click="!readOnly && (localGeofence.enabled = !localGeofence.enabled, handleToggleChange())">
                  <span class="text-sm font-bold text-slate-700">แจ้งเตือนเมื่อออกนอกเขต</span>
                  <input type="checkbox" v-model="localGeofence.enabled" @change.stop="handleToggleChange" 
                         :disabled="readOnly || loading"
                         class="toggle toggle-primary toggle-sm" />
              </div>

              <div v-if="localGeofence.enabled" class="space-y-5 animate-fade-in-up">
                  
                  <div class="flex items-start gap-3 text-[11px] text-indigo-700 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100/50 leading-relaxed font-medium">
                    <span class="text-base leading-none">🎯</span>
                    <span>{{ readOnly ? 'โหมดผู้ติดตาม: ไม่สามารถแก้ไขขอบเขตได้' : 'เลื่อนแผนที่หรือปรับแถบด้านล่าง เพื่อกำหนดรัศมีแจ้งเตือน' }}</span>
                  </div>

                  <div v-if="!readOnly" class="space-y-4">
                      <div class="flex justify-between items-end px-1">
                          <span class="text-[11px] font-black text-slate-400 uppercase tracking-widest">รัศมี (Radius)</span>
                          
                          <div class="flex items-baseline gap-1 bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                              <input 
                                  v-model.number="localGeofence.radius" 
                                  type="number" 
                                  min="10" 
                                  class="input input-ghost input-sm p-0 w-16 text-right font-black text-lg text-indigo-600 focus:outline-none focus:bg-transparent h-auto" 
                              />
                              <span class="text-xs text-slate-400 font-bold">m</span>
                          </div>
                      </div>
                      
                      <div class="px-1">
                        <input 
                          v-model.number="localGeofence.radius" 
                          type="range" 
                          min="100" 
                          max="5000" 
                          step="50" 
                          class="range range-xs range-primary w-full h-2 accent-indigo-600" 
                          style="--range-shdw: #4f46e5;" 
                        />
                        <div class="w-full flex justify-between text-[10px] font-bold text-slate-300 mt-2">
                            <span class="cursor-pointer hover:text-indigo-500" @click="localGeofence.radius = 100">100m</span>
                            <span class="cursor-pointer hover:text-indigo-500" @click="localGeofence.radius = 2500">2.5km</span>
                            <span class="cursor-pointer hover:text-indigo-500" @click="localGeofence.radius = 5000">5km</span>
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-3 gap-2">
                          <button @click="localGeofence.radius = 100" class="btn btn-sm bg-white border border-slate-200 text-slate-500 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm">100m</button>
                          <button @click="localGeofence.radius = 500" class="btn btn-sm bg-white border border-slate-200 text-slate-500 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm">500m</button>
                          <button @click="localGeofence.radius = 1000" class="btn btn-sm bg-white border border-slate-200 text-slate-500 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm">1km</button>
                      </div>
                  </div>
                  
                  <div v-else class="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                      <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ระยะทางปัจจุบัน</span>
                      <div class="text-3xl font-black text-slate-700 mt-1">{{ localGeofence.radius }}<span class="text-sm text-slate-400 ml-1">m</span></div>
                  </div>

                  <div v-if="!readOnly" class="pt-2 flex gap-3">
                      <button @click="$emit('zoom-to-car')" type="button" class="btn btn-circle bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 shadow-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                      </button>

                      <button @click="save" :disabled="loading" class="flex-1 btn btn-primary rounded-2xl shadow-lg shadow-indigo-500/30 font-bold text-white text-base h-12 min-h-0 border-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98]">
                          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                          <span v-else>บันทึกขอบเขต</span>
                      </button>
                  </div>
              </div>
          </div>
       </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps(['isOpen', 'geofenceData', 'loading', 'readOnly']);
const emit = defineEmits(['close', 'save', 'update:data', 'zoom-to-car', 'disable-geofence']);

const localGeofence = reactive({ ...props.geofenceData });

// ซิงค์ข้อมูลจาก Props เมื่อมีการเปิดหน้าต่าง
watch(() => props.geofenceData, (newVal) => {
    if (!props.loading && newVal) {
        Object.assign(localGeofence, newVal);
    }
}, { deep: true, immediate: true });

// ส่งข้อมูลกลับไปให้ Dashboard ทันทีที่ลาก Slider หรือแก้ตัวเลข
watch(localGeofence, (newVal) => {
    if(!props.readOnly) emit('update:data', newVal);
}, { deep: true });

const handleToggleChange = () => {
    if (props.readOnly) return;
    if (localGeofence.enabled) {
        emit('zoom-to-car'); // เปิดปุ๊บ ซูมกลับไปที่รถทันที
    } else {
        // ถ้าต้องการให้ปิดแล้วเซฟเลย ก็เปลี่ยนตรงนี้ได้ครับ แต่ปกติควรให้กดเซฟเอง
        emit('disable-geofence');
    }
};

const save = () => {
    if (props.readOnly) return;
    emit('save', localGeofence);
};
</script>

<style scoped>
/* ซ่อนลูกศรขึ้นลงของ Input Number ให้ดูสะอาด */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
}

/* Scrollbar แบบบางๆ สวยๆ */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }

/* Animation สำหรับ Content ด้านใน */
.animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeInUp { 
    from { opacity: 0; transform: translateY(10px); } 
    to { opacity: 1; transform: translateY(0); } 
}

/* แต่งสีแถบ Range Slider (DaisyUI) */
.range-primary {
    --range-shdw: #4f46e5; 
}
</style>