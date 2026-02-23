import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Coffee,
  Sun,
  Moon,
  Calendar,
  Receipt,
  TrendingUp,
  Clock,
  LogOut,
  CalendarOff,
  Utensils,
  CreditCard
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const StudentDashboard = () => {
  const { user, getAuthToken, signOut, refreshUser } = useAuth();

  const [todayMeals, setTodayMeals] = useState([]);
  const [monthStats, setMonthStats] = useState({
    attended: 0,
    skipped: 0,
    onLeave: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    meals: true,
    stats: true,
    user: false // User data loads faster, start with false
  });
  const lastRefreshRef = useRef(0);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  const mealIcons = useMemo(() => ({
    breakfast: Coffee,
    lunch: Sun,
    dinner: Moon
  }), []);

  // Memoize date calculations
  const dateInfo = useMemo(() => {
    const now = new Date();
    return {
      today: format(now, "yyyy-MM-dd"),
      monthStart: format(startOfMonth(now), "yyyy-MM-dd"),
      monthEnd: format(endOfMonth(now), "yyyy-MM-dd"),
      formattedDate: format(now, "EEEE, MMM d"),
      formattedMonth: format(now, "MMMM yyyy")
    };
  }, []);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Prevent excessive API calls (throttle to once per 30 seconds unless forced)
    const now = Date.now();
    if (!forceRefresh && now - lastRefreshRef.current < 30000) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    lastRefreshRef.current = now;

    try {
      // Parallel API calls for better performance - no longer blocking UI
      const [todayRes, monthRes, userRes] = await Promise.allSettled([
        api(`/api/attendance/day?date=${dateInfo.today}`),
        api(`/api/attendance/summary?start=${dateInfo.monthStart}&end=${dateInfo.monthEnd}`),
        refreshUser()
      ]);

      // Handle today's meals
      if (todayRes.status === 'fulfilled') {
        const data = todayRes.value;
        if (data.ok || data.success) {
          setTodayMeals(data.meals || []);
        }
      }
      setLoadingStates(prev => ({ ...prev, meals: false }));

      // Handle monthly stats
      if (monthRes.status === 'fulfilled') {
        const data = monthRes.value;
        if (data.ok || data.success) {
          setMonthStats(data.stats || { attended: 0, skipped: 0, onLeave: 0 });
        }
      }
      setLoadingStates(prev => ({ ...prev, stats: false }));

      // Handle user refresh
      if (userRes.status === 'fulfilled') {
        setUserDataLoaded(true);
      }
      setLoadingStates(prev => ({ ...prev, user: false }));

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      // Set loading states to false even on error
      setLoadingStates({ meals: false, stats: false, user: false });
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, refreshUser, dateInfo]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchDashboardData(true); // Force refresh on initial load

    // Optimized visibility change listener with debounce
    let visibilityTimeout;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          fetchDashboardData();
        }, 500); // Debounce for 500ms
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(visibilityTimeout);
    };
  }, [user, fetchDashboardData]);

  const getMealStatus = (mealType) => {
    const meal = todayMeals.find((m) => m.meal_type === mealType);
    return meal?.status || "not_set";
  };

  const getStatusBadge = (status) => {
    const badges = {
      will_attend: { class: "status-badge status-attend", label: "Attending" },
      skip: { class: "status-badge status-skip", label: "Skipped" },
      leave: { class: "status-badge status-leave", label: "On Leave" },
      consumed: { class: "status-badge status-consumed", label: "Consumed" },
      not_set: { class: "status-badge status-locked", label: "Not Set" }
    };

    return badges[status] || badges.not_set;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // ===== Main Dashboard - Progressive Loading =====
  return (
    <div className="space-y-8 animate-fade-in">
      {/* -------- Header -------- */}
      <div className="page-header">
        <h1 className="page-title">
          {greeting()}, {user?.fullName?.split(" ")[0] || "Student"}!
        </h1>

        <p className="page-description">
          Here's your meal attendance overview for{" "}
          {dateInfo.formattedMonth}
        </p>
      </div>

      {/* -------- Today's Meals -------- */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Today's Meals — {dateInfo.formattedDate}
        </h2>

        {loadingStates.meals ? (
          // Skeleton loader for meals
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["breakfast", "lunch", "dinner"].map((mealType, index) => (
              <Card key={mealType} className="meal-card">
                <CardContent className="pt-5">
                  <div className="animate-pulse">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["breakfast", "lunch", "dinner"].map((mealType, index) => {
              const Icon = mealIcons[mealType];
              const status = getMealStatus(mealType);
              const badge = getStatusBadge(status);
              const meal = todayMeals.find((m) => m.meal_type === mealType);

              return (
                <Card
                  key={mealType}
                  className="meal-card animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>

                        <div>
                          <h3 className="font-bold capitalize">{mealType}</h3>
                          <span className={badge.class}>{badge.label}</span>
                        </div>
                      </div>

                      {meal?.is_locked && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Locked
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* -------- Monthly Summary -------- */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Monthly Summary
        </h2>

        {loadingStates.stats ? (
          // Skeleton loader for stats
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dashboard-stat">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="dashboard-stat">
              <span className="dashboard-stat-value text-primary">
                {monthStats.attended}
              </span>
              <span className="dashboard-stat-label">Meals Attended</span>
            </div>

            <div className="dashboard-stat">
              <span className="dashboard-stat-value text-warning">
                {monthStats.skipped}
              </span>
              <span className="dashboard-stat-label">Meals Skipped</span>
            </div>

            <div className="dashboard-stat">
              <span className="dashboard-stat-value text-info">
                {monthStats.onLeave}
              </span>
              <span className="dashboard-stat-label">Leave Days</span>
            </div>

            <div className="dashboard-stat">
              <span className="dashboard-stat-value text-success">
                ₹{Number(user?.total_amount || 0).toFixed(0)}
              </span>
              <span className="dashboard-stat-label">Monthly Bill</span>
            </div>
          </div>
        )}
      </section>

      {/* -------- Quick Actions -------- */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="flex flex-wrap gap-3">
          <Link to="/student/attendance">
            <Button type="button" variant="default" className="gap-2">
              <Calendar className="w-4 h-4" />
              Mark Attendance
            </Button>
          </Link>

          <Link to="/student/leave">
            <Button type="button" variant="outline" className="gap-2">
              <CalendarOff className="w-4 h-4" />
              Apply for Leave
            </Button>
          </Link>

          <Link to="/student/billing">
            <Button type="button" variant="outline" className="gap-2">
              <Receipt className="w-4 h-4" />
              View Full Bill
            </Button>
          </Link>

          <Link to="/student/menu">
            <Button type="button" variant="outline" className="gap-2">
              <Utensils className="w-4 h-4" />
              View Menu
            </Button>
          </Link>

          <Link to="/student/payment">
            <Button type="button" variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
              <CreditCard className="w-4 h-4" />
              Make Payment
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={signOut}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
