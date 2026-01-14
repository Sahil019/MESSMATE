import { Outlet, NavLink } from "react-router-dom";
import { LogOut, LayoutGrid, Calendar, CalendarOff, Receipt, Utensils, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StudentLayout = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="dark min-h-screen bg-background text-foreground flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">

        <div className="p-4">
          <h1 className="text-xl font-bold">Mess System</h1>
          <p className="text-sm opacity-80">Student Panel</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavLink to="/student/dashboard" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <LayoutGrid className="w-4 h-4" /> Dashboard
          </NavLink>

          <NavLink to="/student/attendance" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Calendar className="w-4 h-4" /> Meal Attendance
          </NavLink>

          <NavLink to="/student/leave" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <CalendarOff className="w-4 h-4" /> Leave Requests
          </NavLink>

          <NavLink to="/student/billing" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Receipt className="w-4 h-4" /> Billing
          </NavLink>

          <NavLink to="/student/payment" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <CreditCard className="w-4 h-4" /> Make Payment
          </NavLink>

          <NavLink to="/student/menu" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>
            <Utensils className="w-4 h-4" /> Menu
          </NavLink>
        </nav>

        {/* Footer profile + logout */}
        <div className="p-4 border-t">
          <div className="text-sm mb-2">
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-muted-foreground">{user?.email}</p>
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

export default StudentLayout;
