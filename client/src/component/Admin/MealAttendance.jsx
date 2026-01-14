import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useToast } from "@/hooks/use-toast";

import {
  Coffee,
  Sun,
  Moon,
  Check,
  X,
  Calendar,
  Users
} from "lucide-react";

import { format } from "date-fns";


const AdminMealAttendance = () => {

  const { getAuthToken } = useAuth();
  const { toast } = useToast();

  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  // Track double-click timing for each button
  const [clickTimes, setClickTimes] = useState(new Map());

  // 🔹 admin can choose ANY date
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );


  const mealConfig = {
    breakfast: { icon: Coffee, label: "Breakfast" },
    lunch: { icon: Sun, label: "Lunch" },
    dinner: { icon: Moon, label: "Dinner" }
  };


  useEffect(() => {
    fetchData();
  }, [selectedDate]);


  const fetchData = async () => {

    setIsLoading(true);
    const token = getAuthToken();

    try {

      // Fetch students
      const usersRes = await fetch(
        "http://localhost:3000/api/admin/users",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const usersData = await usersRes.json();
      setUsers(usersData?.users || []);


      // Fetch attendance for selected date
      const attRes = await fetch(
        `http://localhost:3000/api/attendance?startDate=${selectedDate}&endDate=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const attData = await attRes.json();
      setAttendance(attData?.attendance || []);

    } catch (err) {

      console.error("Fetch Error:", err);

      toast({
        title: "Error",
        description: "Unable to load attendance",
        variant: "destructive"
      });

    } finally {
      setIsLoading(false);
    }
  };


  const getUserAttendance = (userId, mealType) =>
    attendance.find(a => a.user_id === userId && a.meal_type === mealType);


  // 🔁 Clicking cycles through statuses
  const nextStatus = status => {

    if (status === "will_attend") return "skip";
    if (status === "skip") return "leave";
    return "will_attend";
  };


  const updateAttendance = async (userId, mealType, forceStatus) => {

    const token = getAuthToken();

    const record = getUserAttendance(userId, mealType);
    const current = record?.status || "skip";

    const newStatus = forceStatus || nextStatus(current);

    setSaving(`${userId}-${mealType}`);

    try {

      await fetch("http://localhost:3000/api/attendance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          meal_date: selectedDate,
          meal_type: mealType,
          status: newStatus
        })
      });

      await fetchData();

      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });

// 🔄 refresh Billing Management page if it's open
if (window.refreshBillingPage) {
  window.refreshBillingPage();
}

// Flag billing for refresh when BillingManagement opens
localStorage.setItem('billingNeedsRefresh', 'true');

    } catch (err) {

      toast({
        title: "Update Failed",
        description: "Attendance not saved",
        variant: "destructive"
      });

    } finally {
      setSaving(null);
    }
  };


  // 🔹 Helper for cell status
  const getCellStatus = (record) => {
    if (!record) return "locked"; // default state before marking
    return record.status || "skip";
  };

  // 🎨 Status button styles
  const renderStatusButton = (record, mealType, userId) => {

    const status = getCellStatus(record);
    const isSaving = saving === `${userId}-${mealType}`;

    // Show target status immediately when saving a locked button
    const displayStatus = isSaving && status === "locked" ? "will_attend" : status;

    const buttonClasses = {
      locked: "attendance-button attendance-locked",
      will_attend: "attendance-button attendance-attend",
      skip: "attendance-button attendance-skip",
      leave: "attendance-button attendance-leave"
    };

    const icons = {
      locked: <Calendar className="w-4 h-4" />,
      will_attend: <Check className="w-5 h-5" />,
      skip: <X className="w-5 h-5" />,
      leave: <Calendar className="w-5 h-5" />
    };

    // clicking creates record or cycles status
    const handleClick = () => {
      const buttonKey = `${userId}-${mealType}`;
      const now = Date.now();
      const lastClickTime = clickTimes.get(buttonKey) || 0;
      const timeDiff = now - lastClickTime;

      if (status === "locked") {
        updateAttendance(userId, mealType, "will_attend"); // first click = attend
      } else if (status === "will_attend") {
        // For will_attend status, require double-click to change
        if (timeDiff < 300) { // 300ms window for double-click
          updateAttendance(userId, mealType); // double-click = cycle status
          setClickTimes(prev => {
            const newMap = new Map(prev);
            newMap.delete(buttonKey);
            return newMap;
          });
        } else {
          // Single click on will_attend - do nothing, stay green
          setClickTimes(prev => new Map(prev).set(buttonKey, now));
        }
      } else {
        // For skip/leave status, single click cycles
        updateAttendance(userId, mealType);
      }
    };

    return (
      <button
        disabled={isSaving}
        onClick={handleClick}
        className={`${buttonClasses[displayStatus]} ${isSaving && status !== "locked" ? "animate-pulse" : ""}`}
      >
        {icons[displayStatus]}
      </button>
    );
  };


  const getMealStats = meal => ({
    attending: attendance.filter(a => a.meal_type === meal && a.status === "will_attend").length,
    skipped: attendance.filter(a => a.meal_type === meal && a.status === "skip").length,
    leave: attendance.filter(a => a.meal_type === meal && a.status === "leave").length
  });


  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Loading attendance…
        </div>
      </div>
    );


  return (
    <div className="space-y-6 animate-fade-in">


      {/* PAGE HEADER */}
      <div className="page-header">
        <h1 className="page-title">Admin Meal Attendance</h1>
        <p className="page-description">
          Select a date and mark student attendance in grid format.
        </p>
      </div>


      {/* DATE PICKER */}
      <div className="flex gap-4 items-center">
        <span className="font-medium">Select Date:</span>

        <Input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="w-56"
        />
      </div>


      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {["breakfast","lunch","dinner"].map(meal => {

          const Icon = mealConfig[meal].icon;
          const stats = getMealStats(meal);

          return (
            <Card key={meal}>
              <CardContent className="pt-6">

                <div className="flex items-center gap-3">
                  <Icon className="w-7 h-7 text-primary" />
                  <strong>{mealConfig[meal].label}</strong>
                </div>

                <div className="mt-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Attending</span>
                    <b className="text-success">{stats.attending}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Skipped</span>
                    <b className="text-warning">{stats.skipped}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>On Leave</span>
                    <b className="text-info">{stats.leave}</b>
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}

      </div>


      {/* STUDENT GRID */}
<Card className="shadow-sm border border-border/60 rounded-2xl">
  <CardHeader className="border-b bg-muted/40 rounded-t-2xl">
    <CardTitle className="flex items-center gap-3">
      <Users className="w-5 h-5 text-primary" />
      <span className="tracking-tight">Student Attendance Grid</span>
    </CardTitle>
  </CardHeader>

  <CardContent className="p-0">

    <div className="overflow-x-auto">
      <table className="w-full border-collapse">

        {/* HEADER */}
        <thead>
          <tr className="bg-muted/30 text-sm">
            <th className="p-4 text-left font-semibold text-muted-foreground sticky left-0 bg-muted/30 backdrop-blur rounded-l-xl">
              Student
            </th>

            {["Breakfast","Lunch","Dinner"].map(h => (
              <th
                key={h}
                className="p-4 text-center font-semibold text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {users.map((user, rowIndex) => (
            <tr
              key={user.id}
              className={`
                border-t transition
                ${rowIndex % 2 === 0 ? "bg-background" : "bg-muted/10"}
                hover:bg-primary/5
              `}
            >

              {/* STUDENT COLUMN */}
              <td className="p-4 sticky left-0 bg-inherit backdrop-blur rounded-l-xl">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {user.full_name || user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </td>

              {/* MEAL CELLS */}
              {["breakfast","lunch","dinner"].map(meal => {
                const record = getUserAttendance(user.id, meal);

                return (
                  <td key={meal} className="p-3 text-center">
                    <div className="flex justify-center">
                      {renderStatusButton(record, meal, user.id)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

      </table>
    </div>

  </CardContent>
</Card>



      {/* LEGEND */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4 text-success" /> Attending
        </div>
        <div className="flex items-center gap-1">
          <X className="w-4 h-4 text-warning" /> Skipped
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-info" /> On Leave
        </div>
      </div>


    </div>
  );
};

export default AdminMealAttendance;
