<template>
  <div class="w-full h-full relative z-0">
    <div id="mainMap" class="w-full h-full outline-none bg-slate-200"></div>
    
    <div v-if="!isMapReady" class="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-[1000] backdrop-blur-sm">
       <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  data: { type: Array, default: () => [] },
  geofence: { type: Object, default: () => ({ enabled: false, lat: 0, lng: 0, radius: 200 }) },
  isEditing: { type: Boolean, default: false } 
});

const emit = defineEmits(['update:center']);
const map = ref(null);
const markers = {}; 
let geofenceCircle = null;
const isMapReady = ref(false);

const vehicleColors = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

// ☢️ [นิวเคลียร์ 1] ฟังก์ชันคัดกรองพิกัดขั้นสูงสุด ป้องกัน NaN ทุกรูปแบบ
const getSafeLatLng = (lat, lng) => {
  if (lat == null || lng == null) return null;
  const l1 = Number(lat);
  const l2 = Number(lng);
  // เช็คว่าต้องเป็นตัวเลขที่ใช้คำนวณได้จริงๆ และต้องไม่ใช่พิกัด 0,0
  if (!isFinite(l1) || !isFinite(l2) || isNaN(l1) || isNaN(l2) || (l1 === 0 && l2 === 0)) {
      return null;
  }
  return [l1, l2];
};

const getVehicleColor = (id) => {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return vehicleColors[Math.abs(hash) % vehicleColors.length];
};

const createCustomIcon = (vehicle) => {
  const id = vehicle.id || vehicle.deviceId;
  const status = vehicle.status; 
  let color = '#94a3b8'; 
  
  if (status === 'ONLINE') color = getVehicleColor(id);
  if (status === 'PARKED') color = '#f59e0b'; 
  
  const displayName = vehicle.name ? (vehicle.name.length > 10 ? vehicle.name.substring(0, 10) + '..' : vehicle.name) : (id || 'Unknown');
  const wrapperClass = status === 'OFFLINE' ? 'marker-offline' : '';

  return L.divIcon({
    className: 'custom-marker-container', 
    html: `
      <div class="marker-wrapper ${wrapperClass}">
        <div class="marker-pin" style="background-color: ${color};"></div>
        <div class="marker-label">${displayName}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -45]
  });
};

const buildPopupContent = (v) => {
    let statusColor = 'text-slate-400', statusBg = 'bg-slate-400', statusText = v.status || 'OFFLINE';
    if (v.status === 'ONLINE') { statusColor = 'text-emerald-600'; statusBg = 'bg-emerald-500'; } 
    else if (v.status === 'PARKED') { statusColor = 'text-amber-600'; statusBg = 'bg-amber-500'; }

    return `
      <div class="text-sm min-w-[140px] p-1">
        <div class="font-black text-slate-800 text-base mb-2 border-b pb-1">${v.name || v.id}</div>
        <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">สถานะ</span>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${statusBg} ${v.status === 'ONLINE' ? 'animate-pulse' : ''}"></span>
                <span class="text-xs font-black ${statusColor}">${statusText}</span>
            </div>
        </div>
        <div class="bg-slate-50 rounded-lg p-2 border border-slate-100">
           <div class="flex justify-between items-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase">แบตเตอรี่</span>
              <span class="font-mono font-black text-slate-700">${v.battery || 0}%</span>
           </div>
        </div>
      </div>
    `;
};

const initMap = () => {
  map.value = L.map('mainMap', { zoomControl: false }).setView([13.7563, 100.5018], 10);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
  }).addTo(map.value);

  map.value.on('click', (e) => {
      const safePos = getSafeLatLng(e.latlng.lat, e.latlng.lng);
      if (props.isEditing && safePos) {
          emit('update:center', { lat: safePos[0], lng: safePos[1] });
      }
  });

  isMapReady.value = true;
  updateGeofenceDraw();
  updateMarkersDraw();
};

const updateGeofenceDraw = () => {
  if (!map.value) return;
  const gf = props.geofence;
  const safePos = (gf && gf.enabled) ? getSafeLatLng(gf.lat, gf.lng) : null;

  if (!safePos) {
    if (geofenceCircle) { map.value.removeLayer(geofenceCircle); geofenceCircle = null; }
    return;
  }

  const color = props.isEditing ? '#f59e0b' : '#9333ea'; 
  if (geofenceCircle) {
    geofenceCircle.setLatLng(safePos); 
    geofenceCircle.setRadius(gf.radius);
    geofenceCircle.setStyle({ color: color, fillColor: color });
  } else {
    geofenceCircle = L.circle(safePos, { color, fillColor: color, fillOpacity: 0.15, radius: gf.radius, weight: 2, dashArray: '5, 5' }).addTo(map.value);
  }
};

const updateMarkersDraw = () => {
    if (!map.value || !props.data) return;
    const currentIds = new Set();

    props.data.forEach(vehicle => {
        const safePos = getSafeLatLng(vehicle.lat, vehicle.lng);
        if (!safePos) return; // 🛡️ ทิ้งข้อมูลขยะ
        
        const id = vehicle.id || vehicle.deviceId;
        if (!id) return;
        currentIds.add(id);

        if (!markers[id]) {
            markers[id] = L.marker(safePos, { icon: createCustomIcon(vehicle) }).addTo(map.value);
        } else {
            markers[id].setLatLng(safePos);
            markers[id].setIcon(createCustomIcon(vehicle));
        }

        markers[id].off('click'); 
        markers[id].on('click', (e) => {
            if (props.isEditing) {
                emit('update:center', { lat: safePos[0], lng: safePos[1] });
                markers[id].closePopup();
                L.DomEvent.stopPropagation(e); 
            } else {
                markers[id].openPopup();
            }
        });

        markers[id].bindPopup(buildPopupContent(vehicle));
    });

    Object.keys(markers).forEach(id => {
        if (!currentIds.has(id)) {
            map.value.removeLayer(markers[id]);
            delete markers[id];
        }
    });
};

// ☢️ [นิวเคลียร์ 2] ตัดวงจรการ Crash ของ Leaflet Animation
const safeFlyTo = (safePos, zoom = 16) => {
    if (!map.value || !safePos) return;
    try {
        // 🔥 หยุดแอนิเมชันที่ค้างอยู่ทั้งหมดก่อนเริ่มใหม่ ป้องกัน NaN Loop
        map.value.stop(); 
        map.value.flyTo(safePos, zoom, { duration: 1.5 });
    } catch (e) {
        console.warn("[MapViewer] แอนิเมชันขัดข้อง, ใช้โหมดวาร์ปแทน", e);
        map.value.setView(safePos, zoom); // วาร์ปไปเลยถ้า flyTo รวน
    }
};

const focusCar = (deviceId) => { 
    const marker = markers[deviceId];
    if(marker) {
        const pos = marker.getLatLng();
        const safePos = getSafeLatLng(pos.lat, pos.lng);
        if (safePos) {
            safeFlyTo(safePos);
            marker.openPopup();
        }
    }
};

const focusCarWithOffset = (deviceId) => {
    const marker = markers[deviceId];
    if(marker) {
        const pos = marker.getLatLng();
        const safePos = getSafeLatLng(pos.lat, pos.lng);
        if (safePos) {
            // เลื่อน Offset ลงมานิดหน่อย
            const offsetPos = [safePos[0] - 0.003, safePos[1]]; 
            safeFlyTo(offsetPos);
            marker.openPopup();
        }
    }
};

const focusLatLn = (lat, lng, zoom = 16) => {
  const safePos = getSafeLatLng(lat, lng);
  if (safePos) {
      safeFlyTo(safePos, zoom);
  }
};

onMounted(() => { nextTick(() => { initMap(); }); });
onUnmounted(() => { if (map.value) { map.value.remove(); map.value = null; } });
watch(() => props.data, updateMarkersDraw, { deep: true });
watch(() => props.geofence, updateGeofenceDraw, { deep: true });
defineExpose({ focusCar, focusLatLn, focusCarWithOffset });
</script>

<style>
.custom-marker-container { pointer-events: none; } 
.marker-wrapper { position: relative; width: 40px; height: 40px; display: flex; justify-content: center; align-items: flex-end; transition: all 0.3s ease; }
.marker-offline { filter: grayscale(100%); opacity: 0.7; }
.marker-pin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 20; position: absolute; bottom: 2px; transition: background-color 0.3s ease; }
.marker-label { position: absolute; bottom: 25px; background: rgba(255, 255, 255, 0.9); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #333; box-shadow: 0 1px 3px rgba(0,0,0,0.2); white-space: nowrap; pointer-events: auto; z-index: 30; }
.leaflet-popup-content-wrapper { border-radius: 12px; padding: 0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
.leaflet-popup-content { margin: 12px 16px; line-height: 1.5; }
.leaflet-popup-tip { background: white; }
</style>