import { createRouter, createWebHistory } from "vue-router";

// 1. Import Views ทั้งหมด
import LoginView from "./views/LoginView.vue";
import RegisterView from "./views/RegisterView.vue";
import DashboardView from "./views/DashboardView.vue";
import HistoryView from "./views/HistoryView.vue";
import VerifyEmail from "./views/VerifyEmail.vue";
import ChangePasswordView from "./views/ChangePassword.vue";
import ForgotPasswordView from "./views/ForgotPasswordView.vue";
import ResetPasswordView from "./views/ResetPasswordView.vue";

// 🔥 นำเข้า View สำหรับระบบ Family Security Network
import SharingManagement from "./views/SharingManagement.vue"; // หน้าจัดการลิ้งค์ของ Owner
import GuestTracking from "./views/GuestTracking.vue"; // หน้าแผนที่สำหรับ Guest (ฉบับสมบูรณ์)

// ⚠️ โค้ดที่รอการยุบรวม (หน้าฟอร์มกรอกข้อมูลสำหรับ Guest)
import RegisterShare from "./views/RegisterShare.vue"; 

const routes = [
  // ==========================================
  // 🔓 Public Routes (ไม่ต้อง Login)
  // ==========================================
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: ForgotPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPasswordView,
    meta: { requiresAuth: false },
  },
  {
    path: "/verify-email",
    name: "VerifyEmail",
    component: VerifyEmail,
    meta: { requiresAuth: false },
  },
  // ✅ เชื่อมลิงก์จากอีเมล เข้าสู่หน้าแผนที่ฉบับสมบูรณ์ทันที
  {
    path: "/track-public/:token",
    alias: "/track/:token", // 👈 เพิ่มบรรทัดนี้! (เข้าลิงก์ไหนก็มาโผล่หน้านี้)
    name: "GuestTracking",
    component: GuestTracking,
    meta: {
      requiresAuth: false,
      layout: "empty", 
    },
  },
  // ⚠️ 2 หน้านี้เดี๋ยวเราจะยุบรวมกันในขั้นตอนต่อไป
  {
    path: "/register-share/:token",
    name: "RegisterShare",
    component: RegisterShare,
    meta: { requiresAuth: false },
  },

  // ==========================================
  // 🔒 Private Routes (ต้อง Login)
  // ==========================================
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/history/:deviceId",
    name: "History",
    component: HistoryView,
    meta: { requiresAuth: true },
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: ChangePasswordView,
    meta: { requiresAuth: true },
  },
  {
    path: "/sharing-management/:deviceId",
    name: "SharingManagement",
    component: SharingManagement,
    meta: { requiresAuth: true },
  },

  // ==========================================
  // 🔄 Redirects & Catch All
  // ==========================================
  {
    path: "/",
    redirect: "/dashboard",
  },
  // กันลิงก์มั่ว (Catch All) -> ดีดไป Login
  {
    path: "/:pathMatch(.*)*",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔥 Logic การตรวจบัตรผ่านทาง (Router Guard)
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem("token");

  // 1. ถ้าหน้านั้นต้องการ Login แต่ไม่มี Token -> ดีดไป Login
  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/login");
  }
  // 2. ถ้าเข้าหน้า Login/Register แต่มี Token อยู่แล้ว -> ดีดไป Dashboard
  else if ((to.path === "/login" || to.path === "/register") && isLoggedIn) {
    next("/dashboard");
  }
  // 3. กรณีอื่นๆ -> ปล่อยผ่าน
  else {
    next();
  }
});

export default router;