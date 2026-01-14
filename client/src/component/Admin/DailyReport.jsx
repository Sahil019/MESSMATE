import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Users,
  Utensils,
  DollarSign,
  Calendar,
  TrendingUp,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';

const DailyReport = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  const fetchDailyReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/admin/reports/daily?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });

      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load daily report",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Fetch daily report error:", err);
      toast({
        title: "Error",
        description: "Failed to load daily report",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return <Coffee className="w-4 h-4" />;
      case 'lunch': return <Sun className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Daily Reports</h1>
        <p className="page-description">
          View daily attendance, billing, and leave statistics.
        </p>
      </div>

      {/* Date Selector */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <Button onClick={fetchDailyReport} variant="outline">
          Refresh Report
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="animate-pulse text-muted-foreground">Loading daily report...</div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{report.billing.total_students}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Meals</p>
                    <p className="text-2xl font-bold">{report.billing.total_meals}</p>
                  </div>
                  <Utensils className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.billing.total_amount)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Students on Leave</p>
                    <p className="text-2xl font-bold">{report.leaves}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Meal-wise Attendance for {new Date(report.date).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.attendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No attendance data available for this date.
                </p>
              ) : (
                <div className="space-y-4">
                  {report.attendance.map((meal) => (
                    <div key={meal.meal_type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getMealIcon(meal.meal_type)}
                          <span className="font-medium capitalize">{meal.meal_type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Total: {meal.total} students
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{meal.will_attend}</div>
                          <div className="text-sm text-muted-foreground">Will Attend</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{meal.attended}</div>
                          <div className="text-sm text-muted-foreground">Attended</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{meal.not_attended}</div>
                          <div className="text-sm text-muted-foreground">Not Attended</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Billing Summary for {new Date(report.date).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{report.billing.paid_count}</div>
                  <div className="text-sm text-muted-foreground">Paid Students</div>
                  <div className="text-lg font-semibold mt-1">
                    {formatCurrency(report.billing.total_amount * (report.billing.paid_count / Math.max(report.billing.total_students, 1)))}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {report.billing.total_students - report.billing.paid_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Payments</div>
                  <div className="text-lg font-semibold mt-1">
                    {formatCurrency(report.billing.total_amount * ((report.billing.total_students - report.billing.paid_count) / Math.max(report.billing.total_students, 1)))}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {report.billing.total_students > 0 ? Math.round((report.billing.paid_count / report.billing.total_students) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Payment Rate</div>
                  <div className="text-lg font-semibold mt-1">
                    Collection Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Failed to load daily report. Please try again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyReport;
