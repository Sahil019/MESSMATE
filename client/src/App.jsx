import React from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Auth
import AuthForm from "./component/Auth/AuthForm";
import { useAuth } from "./contexts/AuthContext";

// Student Pages
import StudentDashboard from "./component/Student/StudentDashboard";
import MealAttendance from "./component/Student/MealAttendance";
import LeaveRequest from "./component/Student/LeaveRequest";
import StudentBilling from "./component/Student/StudentBilling";
import Menu from "./component/Student/Menu";
import Payment from "./component/Student/Payment";

// Admin Pages
import AdminDashboard from "./component/Admin/AdminDashboard";
import UserManagement from "./component/Admin/UserManagement";
import BillingManagement from "./component/Admin/BillingManagement";
import LeaveManagement from "./component/Admin/LeaveManagement";
import DailyReport from "./component/Admin/DailyReport";
import SystemSetting from "./component/Admin/SystemSetting";
import AdminMealAttendance from "./component/Admin/MealAttendance";
import AdminMenu from "./component/Admin/AdminMenu";
import PaymentManagement from "./component/Admin/PaymentManagement";
import WasteAnalyser from "./component/Admin/WasteAnalyser";

// ⭐ NEW — Admin Layout Wrapper
import AdminLayout from "./component/Layout/AdminLayout";
import StudentLayout from "./component/Layout/StudentLayout";


// 🔐 Protect routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// 🎩 Role Guard
const RoleRoute = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role)
    return <Navigate to="/student/dashboard" replace />;
  return children;
};

// 🎓 Student Role Guard
const StudentRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'student')
    return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<AuthForm />} />

      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/student" replace />} />

      {/* ===================== STUDENT AREA ===================== */}

      <Route
        path="/student"
        element={
          <StudentRoute>
            <StudentLayout />
          </StudentRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="attendance" element={<MealAttendance />} />
        <Route path="leave" element={<LeaveRequest />} />
        <Route path="billing" element={<StudentBilling />} />
        <Route path="menu" element={<Menu />} />
        <Route path="payment" element={<Payment />} />
      </Route>

      {/* ===================== ADMIN AREA (NOW HAS LAYOUT) ===================== */}

      <Route
        path="/admin"
        element={
          <RoleRoute role="admin">
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="attendance" element={<AdminMealAttendance />} />
        <Route path="billing" element={<BillingManagement />} />
        <Route path="leave" element={<LeaveManagement />} />
        <Route path="reports" element={<DailyReport />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="payment" element={<PaymentManagement />} />
        <Route path="settings" element={<SystemSetting />} />
        <Route path="waste-analyser" element={<WasteAnalyser />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
    </Routes>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
