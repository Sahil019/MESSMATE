import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/api';
import {
  Receipt,
  Coffee,
  Sun,
  Moon,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

const StudentBilling = () => {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();

  const [billingRecords, setBillingRecords] = useState([]);
  const [currentMonthSummary, setCurrentMonthSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;

    setIsLoading(true);

    const token = getAuthToken();
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    try {
      // Billing History
      const billsRes = await api("/api/billing/history");

      if (billsRes.status !== 200) throw new Error('Failed to load billing records');
      const billsData = billsRes;
      setBillingRecords(billsData.records || []);

      // Current Month Summary - use user profile for monthly bill
      const userRes = await api("/api/auth/me");

      if (!userRes.ok && !userRes.success) throw new Error('Failed to load user profile');
      const userData = userRes;

      // Get attendance summary for stats, but use monthly bill from user profile
      const summaryRes = await api(`/api/billing/summary?start=${monthStart}&end=${monthEnd}`);

      let summaryData = { summary: { attended: 0, skipped: 0, leave: 0, estimatedAmount: 0 } };
      if (summaryRes.status === 200) {
        summaryData = summaryRes;
      }

      // Override estimatedAmount with monthly bill from user profile
      const currentSummary = summaryData.summary || {};
      currentSummary.estimatedAmount = Number(userData.user?.total_amount) || 0;

      setCurrentMonthSummary(currentSummary);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing data',
        variant: 'destructive',
      });
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
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Bills</h1>
        <p className="page-description">
          View your meal consumption and billing history.
        </p>
      </div>

      {/* Current Month Summary */}
      {currentMonthSummary && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              {format(new Date(), 'MMMM yyyy')} — Current Month
            </CardTitle>
            <CardDescription>
              Estimated bill based on meals consumed so far
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="dashboard-stat">
                <span className="dashboard-stat-value text-success">
                  {currentMonthSummary.attended}
                </span>
                <span className="dashboard-stat-label">Meals Attended</span>
              </div>

              <div className="dashboard-stat">
                <span className="dashboard-stat-value text-warning">
                  {currentMonthSummary.skipped}
                </span>
                <span className="dashboard-stat-label">Meals Skipped</span>
              </div>

              <div className="dashboard-stat">
                <span className="dashboard-stat-value text-info">
                  {currentMonthSummary.leave}
                </span>
                <span className="dashboard-stat-label">Leave Days</span>
              </div>

              <div className="dashboard-stat bg-primary/5 border-primary/20">
                <span className="dashboard-stat-value text-primary">
                  ₹{Number(currentMonthSummary.estimatedAmount || 0).toFixed(0)}
                </span>
                <span className="dashboard-stat-label">Estimated Bill</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Final bill is generated at month end</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <section>
        <h2 className="text-lg font-bold mb-4">Billing History</h2>

        {billingRecords.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bills Yet</h3>
              <p className="text-muted-foreground">
                Billing history will appear here after month-end.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {billingRecords.map((record, index) => (
              <Card
                key={record.billing_month || index}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">
                        {format(parseISO(record.billing_month), 'MMMM yyyy')}
                      </h3>

                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Coffee className="w-4 h-4" />
                          {record.breakfast_count}
                        </span>

                        <span className="flex items-center gap-1">
                          <Sun className="w-4 h-4" />
                          {record.lunch_count}
                        </span>

                        <span className="flex items-center gap-1">
                          <Moon className="w-4 h-4" />
                          {record.dinner_count}
                        </span>

                        <span className="text-foreground font-medium">
                          Total: {record.total_meals} meals
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ₹{Number(record.total_amount).toFixed(0)}
                      </div>

                      <span
                        className={`status-badge mt-2 ${
                          record.is_paid
                            ? 'bg-success/15 text-success'
                            : 'bg-warning/15 text-warning-foreground'
                        }`}
                      >
                        {record.is_paid ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pending
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentBilling;
