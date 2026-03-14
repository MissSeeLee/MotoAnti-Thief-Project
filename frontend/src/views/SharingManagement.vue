<template>
  <AddShareModal 
    :isOpen="isAddModalOpen" 
    :deviceId="deviceId" 
    @close="isAddModalOpen = false"
    @refresh="loadShares" 
    @toast="showToast"
  />

  <div class="min-h-screen bg-slate-50 font-sans pb-32 select-none relative max-w-md mx-auto shadow-2xl overflow-hidden">
    
    <header class="bg-white/90 backdrop-blur-md border-b sticky top-0 z-[100] px-4 py-4 flex items-center gap-3">
      <button @click="router.back()" class="btn btn-circle btn-ghost btn-sm text-slate-500 hover:bg-slate-100">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>
      <div>
        <h1 class="text-lg font-black text-slate-800 leading-tight">จัดการการแชร์รถ</h1>
        <p class="text-[10px] text-blue-600 font-bold uppercase tracking-widest">รหัสรถ: {{ deviceId }}</p>
      </div>
    </header>

    <div class="grid grid-cols-2 gap-3 p-4">
      <div class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-200/50">
        <div class="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">ผูกสำเร็จแล้ว</div>
        <div class="text-4xl font-black">{{ activeLinksCount }} <span class="text-xs font-medium opacity-80">คน</span></div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ลิ้งค์ว่าง (รอลงทะเบียน)</div>
        <div class="text-4xl font-black text-slate-700">{{ pendingLinksCount }}</div>
      </div>
    </div>

    <div v-if="isLoadingData" class="flex justify-center py-10">
       <span class="loading loading-spinner loading-md text-blue-600"></span>
    </div>

    <div v-else class="px-4 space-y-4">
      <div v-for="share in shares" :key="share.id" 
           class="bg-white rounded-[2rem] border p-5 shadow-sm relative transition-all"
           :class="(share.phone || share.email) ? 'border-blue-100 ring-2 ring-blue-50' : 'border-dashed border-slate-200'">
        
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner"
                  :class="(share.phone || share.email) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'">
               {{ share.label ? share.label.charAt(0).toUpperCase() : '?' }}
             </div>
             <div>
                <h3 class="text-base font-black text-slate-800">{{ share.label }}</h3>
                <span v-if="(share.phone || share.email)" class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ใช้งานอยู่
                </span>
                <span v-else class="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> รอผู้รับกดลิ้งค์...
                </span>
             </div>
          </div>
          
          <div class="flex gap-1 bg-slate-50 rounded-full p-1">
            <button v-if="(share.phone || share.email)" @click="copyTrackingLink(share.token)" class="btn btn-circle btn-ghost btn-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50" title="คัดลอกลิ้งก์แผนที่">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
            </button>

            <button @click="openEditModal(share)" class="btn btn-circle btn-ghost btn-xs text-slate-500 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
            </button>
            
            <button @click="confirmDelete(share)" class="btn btn-circle btn-ghost btn-xs text-slate-400 hover:text-red-500 hover:bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-slate-50">
           <div class="text-[8px] font-black text-slate-300 uppercase tracking-[0.15em] mb-2">ช่องทางรับแจ้งเตือน</div>
           <div class="grid grid-cols-2 gap-2">
              <div class="bg-slate-50 p-2.5 rounded-xl">
                 <div class="text-[9px] text-slate-400 font-bold uppercase mb-0.5">เบอร์โทรศัพท์ (SMS)</div>
                 <div class="text-xs font-bold text-slate-700">{{ share.phone || '—' }}</div>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-xl overflow-hidden">
                 <div class="text-[9px] text-slate-400 font-bold uppercase mb-0.5">อีเมล (Email)</div>
                 <div class="text-xs font-bold text-slate-700 truncate">{{ share.email || '—' }}</div>
              </div>
           </div>
        </div>
        
        <div v-if="!(share.phone || share.email)" class="mt-3">
          <button @click="copyLink(share.token)" class="btn btn-sm btn-block bg-blue-50 text-blue-600 border-none hover:bg-blue-100 rounded-xl font-bold shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 011.927-.184" /></svg>
            คัดลอกลิ้งค์ให้ {{ share.label }}
          </button>
        </div>
      </div>

      <div v-if="shares.length === 0" class="py-16 text-center">
        <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">🔗</span>
        </div>
        <h3 class="font-bold text-slate-700 text-lg">ยังไม่มีการแชร์รถ</h3>
        <p class="text-xs text-slate-400 mt-2 px-8">สร้างลิ้งค์ส่งให้คนในครอบครัว เพื่อให้รับการแจ้งเตือนเหตุฉุกเฉินพร้อมกัน</p>
      </div>
    </div> 

    <div class="fixed bottom-8 right-0 left-0 flex justify-center z-[90] pointer-events-none max-w-md mx-auto">
       <button @click="openAddModal" 
               class="btn btn-primary rounded-full px-8 h-14 shadow-2xl shadow-blue-400 pointer-events-auto border-none bg-blue-600 hover:bg-blue-700 text-white font-black text-base gap-2 hover:scale-105 transition-transform">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
         เพิ่มผู้ติดตามใหม่
       </button>
    </div>

    <div v-if="isFormModalOpen" class="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-0 sm:p-4 max-w-md mx-auto">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="isFormModalOpen = false"></div>
      <div class="relative w-full bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-8 animate-slide-up">
        
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-slate-800">
            {{ isEditing ? 'แก้ไขข้อมูลผู้ติดตาม' : 'สร้างลิ้งค์แชร์ใหม่' }}
          </h3>
          <button @click="isFormModalOpen = false" class="btn btn-circle btn-ghost btn-sm">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อเรียก / ป้ายกำกับ</label>
            <input v-model="form.label" type="text" placeholder="เช่น ลูกชาย, ภรรยา" class="input w-full bg-slate-50 border-slate-200 mt-1 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"/>
          </div>

          <template v-if="isEditing && (form.phone || form.email)">
            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์ (SMS)</label>
              <input v-model="form.phone" type="tel" placeholder="08xxxxxxxx" class="input w-full bg-slate-50 border-slate-200 mt-1 font-bold text-slate-700"/>
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมลแจ้งเตือน</label>
              <input v-model="form.email" type="email" placeholder="email@example.com" class="input w-full bg-slate-50 border-slate-200 mt-1 font-bold text-slate-700"/>
            </div>
          </template>

          <div v-if="!isEditing" class="bg-blue-50/50 border border-blue-100 text-blue-700 text-[10px] p-3 rounded-xl leading-relaxed mt-2">
            💡 ลิ้งค์ที่สร้างจะใช้งานได้เพียงครั้งเดียว เมื่อผู้รับกรอกข้อมูลเสร็จ ลิ้งค์จะหมดอายุทันที
          </div>
        </div>

        <button @click="saveShare" :disabled="isSaving || !form.label" class="btn btn-block h-14 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-2xl shadow-xl shadow-blue-200 text-base font-black mt-8">
          <span v-if="isSaving" class="loading loading-spinner"></span>
          <span v-else>{{ isEditing ? 'บันทึกข้อมูล' : 'สร้างลิ้งค์แชร์' }}</span>
        </button>
      </div>
    </div>

    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-[3000] flex items-center justify-center p-4 max-w-md mx-auto">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isDeleteModalOpen = false"></div>
      <div class="relative w-full max-w-xs bg-white rounded-3xl p-6 text-center animate-pop shadow-2xl">
        <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🗑️</div>
        <h3 class="text-lg font-black text-slate-800 mb-2">ยกเลิกสิทธิ์?</h3>
        <p class="text-sm text-slate-500 mb-6">คุณต้องการลบ <b>{{ shareToDelete?.label }}</b> ออกจากการแชร์รถคันนี้ใช่หรือไม่? จะไม่ได้รับการแจ้งเตือนอีก</p>
        <div class="flex gap-2">
          <button @click="isDeleteModalOpen = false" class="btn flex-1 bg-slate-100 text-slate-600 border-none hover:bg-slate-200 rounded-xl">ยกเลิก</button>
          <button @click="deleteShare" class="btn flex-1 bg-red-500 text-white border-none hover:bg-red-600 rounded-xl shadow-lg shadow-red-200">
            ลบเลย
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api'; // แก้ path ให้ตรงกับโปรเจกต์คุณ
import AddShareModal from '../components/AddShareModal.vue'; 

const isAddModalOpen = ref(false);

const route = useRoute();
const router = useRouter();
const deviceId = route.params.deviceId; 

// --- State ---
const shares = ref([]);
const isLoadingData = ref(true);

// Modal States
const isFormModalOpen = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
// เอา registeredAt ออกจากตัวแปรตั้งต้นของ form
const form = ref({ id: null, label: '', phone: '', email: '' });

const isDeleteModalOpen = ref(false);
const shareToDelete = ref(null);

// --- Computed ---
// เปลี่ยนการนับจำนวน โดยเช็คจากการมีเบอร์โทรหรืออีเมลแทน
const activeLinksCount = computed(() => shares.value.filter(s => s.phone || s.email).length);
const pendingLinksCount = computed(() => shares.value.filter(s => !s.phone && !s.email).length);

// --- Methods ---

const loadShares = async () => {
  isLoadingData.value = true;
  try {
    const res = await api.get(`/devices/${deviceId}/sharing`);
    shares.value = res.data.shares || res.data;
  } catch (error) {
    console.error('Error fetching shares:', error);
    alert('ไม่สามารถโหลดข้อมูลการแชร์ได้');
  } finally {
    isLoadingData.value = false;
  }
};

const openAddModal = () => {
  isEditing.value = false;
  // รีเซ็ตฟอร์มโดยไม่ต้องมี registeredAt แล้ว
  form.value = { id: null, label: '', phone: '', email: '' };
  isFormModalOpen.value = true;
};

const openEditModal = (share) => {
  isEditing.value = true;
  form.value = { ...share };
  isFormModalOpen.value = true;
};

const saveShare = async () => {
  if (!form.value.label) return;
  if (isEditing.value && !form.value.id) {
    alert("ไม่พบ ID สำหรับการแก้ไข");
    return;
  }

  isSaving.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/devices/${deviceId}/sharing/${form.value.id}`, {
        label: form.value.label,
        phone: form.value.phone,
        email: form.value.email
      });
    } else {
      await api.post(`/devices/${deviceId}/sharing`, {
        label: form.value.label
      });
    }
    isFormModalOpen.value = false;
    loadShares(); 
  } catch (error) {
    alert('บันทึกไม่สำเร็จ');
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (share) => {
  shareToDelete.value = share;
  isDeleteModalOpen.value = true;
};

const deleteShare = async () => {
  if (!shareToDelete.value?.id) return;
  try {
    await api.delete(`/devices/${deviceId}/sharing/${shareToDelete.value.id}`);
    isDeleteModalOpen.value = false;
    loadShares();
  } catch (e) {
    alert("ลบไม่สำเร็จ");
  }
};

const copyLink = (token) => {
  const fullLink = `${window.location.origin}/register-share/${token}`;
  navigator.clipboard.writeText(fullLink).then(() => {
    alert('คัดลอกลิ้งค์สำเร็จแล้ว! นำไปวางใน Line ได้เลย');
  }).catch(err => {
    console.error('Copy failed', err);
  });
};

const copyTrackingLink = (token) => {
  const trackingUrl = `${window.location.origin}/track/${token}`;
  navigator.clipboard.writeText(trackingUrl).then(() => {
    alert("คัดลอกลิ้งก์ติดตามรถเรียบร้อยแล้ว! ส่งให้เพื่อนได้เลย");
  }).catch(err => {
    console.error('ไม่สามารถคัดลอกลิ้งก์ได้: ', err);
    prompt("กรุณาก็อปลิ้งก์ด้านล่างนี้ด้วยตัวเอง:", trackingUrl);
  });
};

onMounted(() => {
  loadShares();
});
</script>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-pop {
  animation: pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes pop {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>