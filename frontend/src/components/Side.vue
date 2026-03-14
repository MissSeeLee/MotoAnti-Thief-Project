<template>
  <div
    class="h-full bg-[#0f172a] text-slate-300 flex flex-col font-sans overflow-hidden border-r border-slate-800 shadow-2xl relative z-40"
  >
    <div class="p-6 pb-4 flex items-center gap-4 bg-[#0f172a] z-10">
      <div
        @click="openProfileModal"
        class="relative group cursor-pointer flex items-center gap-4 w-full hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all"
      >
        <div class="relative">
          <div
            class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 ring-1 ring-slate-700/50 shadow-lg group-hover:ring-blue-500/50 transition-all"
          >
            <span class="text-lg font-bold">{{
              (userProfile.name || "U").charAt(0).toUpperCase()
            }}</span>
          </div>
          <div
            class="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0f172a] rounded-full flex items-center justify-center"
          >
            <div
              class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            ></div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3
            class="font-bold text-base text-white tracking-wide truncate group-hover:text-blue-400 transition-colors"
          >
            {{ userProfile.name || "User" }}
          </h3>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >ONLINE</span
            >
            <span
              class="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors"
              >แตะเพื่อแก้ไข</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 py-2">
      <div
        class="flex justify-between items-end text-[11px] text-slate-500 font-bold tracking-widest uppercase border-b border-slate-800 pb-2"
      >
        <span>{{ isOwner ? "All Vehicles" : "Assigned" }}</span>
        <span
          class="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md min-w-[24px] text-center shadow-sm"
        >
          {{ devices ? Object.keys(devices).length : 0 }}
        </span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
      <div
        v-for="(device, key) in devices"
        :key="key"
        @click="$emit('select-device', device.deviceId || device.id)"
        class="relative group rounded-2xl p-3 transition-all duration-300 border cursor-pointer overflow-hidden"
        :class="
          isActive(device)
            ? 'bg-blue-600/10 border-blue-500/50'
            : 'bg-[#1e293b]/40 border-slate-700/30 hover:bg-[#1e293b]'
        "
      >
        <button
          v-if="isOwner"
          @click.stop="$emit('delete-device', device)"
          class="absolute top-2 right-2 z-30 p-1.5 rounded-full text-slate-500 bg-slate-800/50 hover:bg-rose-500 hover:text-white transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2.5"
            stroke="currentColor"
            class="w-3 h-3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div
          v-if="isActive(device)"
          class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_10px_#3b82f6]"
        ></div>

        <div class="flex items-start gap-3 mb-3 pl-2 relative z-10">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner transition-all duration-300"
            :class="
              isActive(device)
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                : 'bg-slate-800 text-slate-500'
            "
          >
            🛵
          </div>
          <div class="flex-1 min-w-0 pt-0.5 pr-6">
            <h3
              class="font-bold text-sm truncate"
              :class="isActive(device) ? 'text-white' : 'text-slate-300'"
            >
              {{ device.name || "Unknown Device" }}
            </h3>
            <p class="text-[10px] font-mono text-slate-500 truncate opacity-70">
              ID: {{ (device.deviceId || device.id || "").slice(0, 8) }}...
            </p>
          </div>
        </div>

        <div
          class="grid gap-1 mt-2 pt-3 border-t border-slate-700/30 px-1 relative z-10"
          :class="isOwner ? 'grid-cols-5' : 'grid-cols-3'"
        >
          <button
            @click.stop="$emit('view-history', device.deviceId || device.id)"
            class="action-btn group/btn"
          >
            <div
              class="icon-box group-hover/btn:bg-purple-500/20 group-hover/btn:text-purple-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span class="label-text">ประวัติ</span>
          </button>
          <button
            @click.stop="$emit('find-bike', device.deviceId || device.id)"
            class="action-btn group/btn"
          >
            <div
              class="icon-box group-hover/btn:bg-blue-500/20 group-hover/btn:text-blue-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <span class="label-text">ตามหา</span>
          </button>
          <button
            @click.stop="$emit('open-geofence', device)"
            class="action-btn group/btn"
          >
            <div
              class="icon-box group-hover/btn:bg-amber-500/20 group-hover/btn:text-amber-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="currentColor"
                  class="opacity-50"
                />
              </svg>
            </div>
            <span class="label-text">ขอบเขต</span>
          </button>
          <button
            v-if="isOwner"
            @click.stop="$emit('edit-device', device)"
            class="action-btn group/btn"
          >
            <div
              class="icon-box group-hover/btn:bg-teal-500/20 group-hover/btn:text-teal-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
            <span class="label-text">แก้ไข</span>
          </button>

          <button
            v-if="isOwner"
            @click.stop="$emit('share-device', device)"
            class="action-btn group/btn"
          >
            <div
              class="icon-box group-hover/btn:bg-cyan-500/20 group-hover/btn:text-cyan-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0-10.628a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm0 10.628a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
                />
              </svg>
            </div>
            <span class="label-text">แชร์รถ</span>
          </button>
        </div>
      </div>

      <div v-if="isOwner" class="pt-4 pb-2">
        <button
          @click="$emit('add-device')"
          class="group relative w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-900/30 transition-all duration-300 ease-out hover:shadow-indigo-900/50 hover:-translate-y-1 overflow-hidden"
        >
          <div
            class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"
          ></div>
          <div
            class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-4 h-4 text-white"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span class="text-sm font-bold text-white tracking-wide"
            >เพิ่มอุปกรณ์ใหม่</span
          >
        </button>
      </div>
    </div>

    <div class="p-4 mt-auto border-t border-slate-800/50 bg-[#0f172a] z-10">
      <button
        @click="$emit('logout')"
        class="group flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="w-4 h-4 group-hover:text-rose-500 transition-colors"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
        <span class="group-hover:text-rose-400">SIGN OUT</span>
      </button>
    </div>

    <ProfileModal
      :isOpen="isProfileModalOpen"
      @close="isProfileModalOpen = false"
      @saved="handleProfileSaved"
      @toast="(payload) => $emit('toast', payload)"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import api from "../api";
import ProfileModal from "./ProfileModal.vue";

const props = defineProps({
  devices: { type: Object, default: () => ({}) },
  activeDeviceId: { type: String, default: "" },
  isOwner: { type: Boolean, default: false },
});

const emit = defineEmits([
  "select-device",
  "logout",
  "add-device",
  "delete-device",
  "edit-device",
  "open-geofence",
  "view-history",
  "find-bike",
  "share-device",
  "toast",
]);

const isProfileModalOpen = ref(false);
const userProfile = reactive({ name: "", email: "", phone: "" });

const isActive = (device) =>
  (device.deviceId || device.id) === props.activeDeviceId;

const fetchUserProfile = async () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const u = JSON.parse(storedUser);
    Object.assign(userProfile, {
      name: u.name || u.username,
      email: u.email || "",
      phone: u.phone || "",
    });
  }
  try {
    const res = await api.get("/auth/me");
    if (res.data) {
      const u = res.data.user || res.data;
      Object.assign(userProfile, {
        name: u.name,
        email: u.email,
        phone: u.phone,
      });
      localStorage.setItem("user", JSON.stringify(u));
    }
  } catch (e) {
    console.error(e);
  }
};

const openProfileModal = () => (isProfileModalOpen.value = true);
const handleProfileSaved = (u) =>
  Object.assign(userProfile, { name: u.name, email: u.email, phone: u.phone });

onMounted(() => fetchUserProfile());
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}

.action-btn {
  @apply flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all duration-200;
}
.icon-box {
  @apply p-1.5 rounded-lg bg-slate-700/30 text-slate-400 transition-all duration-300;
}
.label-text {
  @apply text-[9px] font-medium text-slate-500 transition-colors;
}

.action-btn:hover .label-text {
  @apply text-slate-300;
}
.action-btn:active {
  @apply scale-95;
}
</style>