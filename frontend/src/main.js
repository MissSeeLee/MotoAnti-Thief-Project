import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// ✅ คุณบอกว่าลงแล้ว งั้นเปิดบรรทัดนี้ได้เลย
import 'leaflet/dist/leaflet.css'; 

const app = createApp(App)

// 🔥 ถ้าพัง ให้โชว์ Error บนหน้าจอ (จะได้ไม่ต้องกด F12)
app.config.errorHandler = (err) => {
  console.error(err);
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; background: white; font-size: 18px; border: 5px solid red;">
      <h1>☠️ แอปพังครับ (Error)</h1>
      <p><b>สาเหตุ:</b> ${err.message}</p>
      <p><b>วิธีแก้:</b> แคปหน้าจอนี้ส่งมาครับ รู้เรื่องแน่นอน</p>
    </div>
  `;
}

app.use(router).mount('#app')