import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, LogOut } from "lucide-react";
import { format } from "date-fns";

const AdminDashboard = () => {
  const { getAuthToken, signOut } = useAuth();

  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttending: 0,
    onLeave: 0,

    breakfast: 0,
    lunch: 0,
    dinner: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch users
      const usersData = await api("/api/admin/users");
      const totalStudents = usersData?.users?.length || 0;

      // Fetch today's attendance
      const attData = await api(`/api/attendance?startDate=${today}&endDate=${today}`);

      const todayAttendance = attData?.attendance || [];

      const todayAttending = todayAttendance.filter(
        a => ["will_attend", "consumed"].includes(a.status)
      ).length;

      // leave attendance table me nahi hota
      const onLeave = 0;

      // -------- Meal-wise counts --------
      const breakfast = todayAttendance.filter(
        a =>
          a.meal_type === "breakfast" &&
          ["will_attend", "consumed"].includes(a.status)
      ).length;

      const lunch = todayAttendance.filter(
        a =>
          a.meal_type === "lunch" &&
          ["will_attend", "consumed"].includes(a.status)
      ).length;

      const dinner = todayAttendance.filter(
        a =>
          a.meal_type === "dinner" &&
          ["will_attend", "consumed"].includes(a.status)
      ).length;

      setStats({
        totalStudents,
        todayAttending,
        onLeave,
        breakfast,
        lunch,
        dinner
      });

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-subtle text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* HEADER */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-description">
            Mess overview for {format(new Date(), "MMMM yyyy")}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={signOut}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* ================= TODAY'S MEAL CARDS (MATCH STUDENT UI) ================= */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Today’s Meals — {format(new Date(), "EEEE, MMM d")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* BREAKFAST */}
          <div className="meal-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10
                              flex items-center justify-center text-primary text-lg font-semibold">
                {stats.breakfast}
              </div>

              <div>
                <h3 className="font-semibold">Breakfast</h3>
                <span className="status-badge status-attend">
                  Students Attending
                </span>
              </div>
            </div>
          </div>

          {/* LUNCH */}
          <div className="meal-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10
                              flex items-center justify-center text-primary text-lg font-semibold">
                {stats.lunch}
              </div>

              <div>
                <h3 className="font-bold">Lunch</h3>
                <span className="status-badge status-attend">
                  Students Attending
                </span>
              </div>
            </div>
          </div>

          {/* DINNER */}
          <div className="meal-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10
                              flex items-center justify-center text-primary text-lg font-semibold">
                {stats.dinner}
              </div>

              <div>
                <h3 className="font-bold">Dinner</h3>
                <span className="status-badge status-attend">
                  Students Attending
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= MONTHLY SUMMARY (PIXEL MATCH) ================= */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Monthly Summary
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="dashboard-stat">
            <span className="dashboard-stat-value text-primary">
              {stats.totalStudents}
            </span>
            <span className="dashboard-stat-label">
              Total Students
            </span>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat-value text-success">
              {stats.todayAttending}
            </span>
            <span className="dashboard-stat-label">
              Attending Today
            </span>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat-value text-info">
              {stats.onLeave}
            </span>
            <span className="dashboard-stat-label">
              On Leave Today
            </span>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat-value text-warning">
              {stats.todayAttending + stats.onLeave}
            </span>
            <span className="dashboard-stat-label">
              Total Meal Records
            </span>
          </div>

        </div>
      </section>

    </div>
  );
};

export default AdminDashboard;
