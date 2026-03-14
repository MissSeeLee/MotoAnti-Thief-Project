<template>
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fade-in">
    
    <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-xs overflow-hidden flex flex-col relative animate-pop-up">
      
      <div class="pt-8 pb-6 px-6 text-center flex flex-col items-center">
         
         <div class="absolute top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-red-100 rounded-full animate-ping opacity-75 pointer-events-none"></div>
         
         <div class="relative z-10 text-5xl mb-4 transform transition-transform hover:scale-110">
            {{ icon || '🚨' }}
         </div>
         
         <h2 class="relative z-10 text-xl font-black text-slate-800 mb-1 tracking-tight">
            {{ title || 'แจ้งเตือน!' }}
         </h2>
         
         <p class="relative z-10 text-slate-500 font-medium text-xs leading-relaxed">
            {{ message }}
         </p>

         <span class="mt-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono bg-slate-50 px-2 py-1 rounded">
            {{ deviceId || 'UNKNOWN' }}
         </span>
      </div>

      <div class="p-4 pt-0 space-y-3 bg-white">
         
         <button 
            @click="$emit('mute-vehicle')" 
            class="btn w-full rounded-xl bg-red-500 hover:bg-red-600 border-none text-white shadow-lg shadow-red-200 group transition-all active:scale-95"
         >
            <span class="text-lg group-hover:animate-pulse">🔇</span>
            <span class="font-bold">ปิดเสียงรถ </span>
         </button>

         <button 
            @click="$emit('close')" 
            class="btn w-full rounded-xl btn-ghost text-slate-400 hover:bg-slate-50 font-normal"
         >
            <span class="text-lg">✅</span>
            <span>ตกลง </span>
         </button>

      </div>

    </div>
  </div>
</template>

<script setup>
defineProps(['title', 'message', 'icon', 'deviceId']);
defineEmits(['close', 'mute-vehicle']); // ✅ เพิ่ม Event mute-vehicle
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
.animate-pop-up { animation: popUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popUp { 
  0% { opacity: 0; transform: scale(0.9) translateY(10px); } 
  100% { opacity: 1; transform: scale(1) translateY(0); } 
}
</style>