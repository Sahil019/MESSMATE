import { Outlet, NavLink } from "react-router-dom";
import { LogOut, LayoutGrid, Users, Receipt, CalendarOff, BarChart, Settings, Calendar, Utensils, CreditCard, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminLayout = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="dark min-h-screen bg-background text-foreground flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">

        <div className="p-4">
          <h1 className="text-xl font-bold">Mess System</h1>
          <p className="text-sm opacity-80">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <LayoutGrid className="w-4 h-4" /> Dashboard
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Users className="w-4 h-4" /> User Management
          </NavLink>

          <NavLink to="/admin/attendance" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Calendar className="w-4 h-4" /> Meal Attendance
          </NavLink>

          <NavLink to="/admin/billing" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Receipt className="w-4 h-4" /> Billing
          </NavLink>

          <NavLink to="/admin/payment" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <CreditCard className="w-4 h-4" /> Payment Management
          </NavLink>

          <NavLink to="/admin/leave" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <CalendarOff className="w-4 h-4" /> Leave Management
          </NavLink>

          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <BarChart className="w-4 h-4" /> Reports
          </NavLink>

          <NavLink to="/admin/menu" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Utensils className="w-4 h-4" /> Menu Management
          </NavLink>

          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Settings className="w-4 h-4" /> System Settings
          </NavLink>

          <NavLink to="/admin/waste-analyser" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Trash2 className="w-4 h-4" /> Waste Analyser
          </NavLink>
        </nav>

        {/* Footer profile + logout */}
        <div className="p-4 border-t">
          <div className="text-sm mb-2">
            <p className="font-medium">{profile?.full_name}</p>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>

          <button onClick={signOut} className="nav-item text-destructive">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
