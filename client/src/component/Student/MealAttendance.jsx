import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import {
  Coffee,
  Sun,
  Moon,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react';

import { format, addDays, startOfWeek, isBefore, isToday } from 'date-fns';

const MealAttendance = () => {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();

  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingMeal, setSavingMeal] = useState(null);
  const savingRef = useRef(new Set());

  const mealConfig = {
    breakfast: { icon: Coffee, label: 'Breakfast', time: '7:00 - 9:00 AM' },
    lunch: { icon: Sun, label: 'Lunch', time: '12:00 - 2:00 PM' },
    dinner: { icon: Moon, label: 'Dinner', time: '7:00 - 9:00 PM' }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  useEffect(() => {
    if (user) fetchAttendance();
  }, [user, currentWeekStart]);

  // 🔹 Fetch attendance from backend
  const fetchAttendance = async () => {
    if (!user) return;

    setIsLoading(true);
    const weekEnd = addDays(currentWeekStart, 6);

    try {
      const data = await api(`/api/attendance?startDate=${format(
        currentWeekStart,
        'yyyy-MM-dd'
      )}&endDate=${format(weekEnd, 'yyyy-MM-dd')}`);

      if (data.status !== 200) throw new Error('Failed to fetch attendance');

      setAttendance(data.attendance || []);
    } catch (err) {
      console.error('Attendance fetch error:', err);
      toast({
        title: 'Error',
        description: 'Unable to load attendance records',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceRecord = (date, mealType) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.find(
      a => a.meal_date === dateStr && a.meal_type === mealType
    );
  };

  const isMealLocked = (date, mealType) => {
    const record = getAttendanceRecord(date, mealType);
    if (record?.is_locked) return true;

    const now = new Date();
    return isBefore(
      date,
      new Date(now.getFullYear(), now.getMonth(), now.getDate())
    );
  };

  // 🔹 Insert / Update attendance via backend
  const toggleMealStatus = async (date, mealType) => {
    if (!user || isMealLocked(date, mealType)) return;

    const token = getAuthToken();
    const dateStr = format(date, 'yyyy-MM-dd');

    const record = getAttendanceRecord(date, mealType);
    const currentStatus = record?.status || 'skip';

    const newStatus =
      currentStatus === 'will_attend' ? 'skip' : 'will_attend';

    // Add confirmation alert before marking attendance
    const action = newStatus === 'will_attend' ? 'mark' : 'skip';
    const confirmed = window.confirm(`Are you sure you want to ${action} ${mealConfig[mealType].label} on ${format(date, 'MMM d')}?`);

    if (!confirmed) return;

    const mealKey = `${dateStr}-${mealType}`;

    // Prevent multiple clicks on the same meal
    if (savingRef.current.has(mealKey)) return;

    savingRef.current.add(mealKey);
    setSavingMeal(mealKey);

    try {
      const res = await api('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          meal_date: dateStr,
          meal_type: mealType,
          status: newStatus
        })
      });

      if (res.status !== 200) throw new Error('Failed to update meal status');

     await fetchAttendance();

// 🔄 Auto refresh billing UI
if (window.refreshBillingPage) {
  window.refreshBillingPage();
}

// Flag billing for refresh when BillingManagement opens
localStorage.setItem('billingNeedsRefresh', 'true');


      toast({
        title:
          newStatus === 'will_attend'
            ? 'Meal Marked'
            : 'Meal Skipped',
        description: `${mealConfig[mealType].label} on ${format(
          date,
          'MMM d'
        )} has been ${
          newStatus === 'will_attend' ? 'marked' : 'skipped'
        }`
      });
    } catch (err) {
      console.error('Attendance update failed:', err);
      toast({
        title: 'Error',
        description: 'Could not update attendance',
        variant: 'destructive'
      });
    } finally {
      setSavingMeal(null);
    }
  };

  const navigateWeek = dir => {
    setCurrentWeekStart(prev => addDays(prev, dir === 'next' ? 7 : -7));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Meal Attendance</h1>
        <p className="page-description">
          Mark your meal preferences for the week. Meals lock after cut-off time.
        </p>
      </div>

      {/* Week Switcher */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        <h2 className="text-lg font-semibold">
          {format(currentWeekStart, 'MMM d')} —{' '}
          {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </h2>

        <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success" /> <span>Attending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning" /> <span>Skipped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted" /> <span>Locked</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left">Meal</th>
              {weekDays.map(day => (
                <th key={day} className="p-3 text-center">
                  <div className={isToday(day) ? "text-primary font-bold" : "text-muted-foreground"}>
                    {format(day, "EEE")}
                  </div>
                  <div>{format(day, "d")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["breakfast", "lunch", "dinner"].map(mealType => {
              const config = mealConfig[mealType];
              const Icon = config.icon;

              return (
                <tr key={mealType} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-xs text-muted-foreground">{config.time}</div>
                      </div>
                    </div>
                  </td>

                  {weekDays.map(day => {
                    const record = getAttendanceRecord(day, mealType);
                    const locked = isMealLocked(day, mealType);
                    const status = record?.status || "skip";

                    const mealKey = `${format(day, 'yyyy-MM-dd')}-${mealType}`;
                    const isSaving = savingMeal === mealKey;

                    return (
                      <td key={day} className="p-2 text-center">
                        <button
                          disabled={locked || isSaving}
                          onClick={() => toggleMealStatus(day, mealType)}
                          className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            ${locked
                              ? "bg-muted text-muted-foreground"
                              : status === "will_attend"
                              ? "bg-success text-white"
                              : "bg-warning/25 text-warning"
                            }
                          `}
                        >
                          {locked ? (
                            <Lock className="w-4 h-4" />
                          ) : status === "will_attend" ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <X className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium">Cut-off Times</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Breakfast — 7:00 PM (previous day)</li>
                <li>• Lunch — 9:00 AM</li>
                <li>• Dinner — 4:00 PM</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MealAttendance;
