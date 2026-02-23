import { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from "@/api";
import { format } from 'date-fns';

export default function BillingManagement() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`; // Default to first day of current month
  });
  const { toast } = useToast();

  const fetchBilling = async () => {
    // Prevent fetching for future dates
    const selected = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected > today) {
      toast({
        title: "Invalid Date",
        description: "Cannot fetch billing data for future dates.",
        variant: "destructive"
      });
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const formattedDate = new Date(selectedDate).toISOString().slice(0, 10);

      console.log('📊 Fetching billing for:', formattedDate);

      const data = await api(`/api/admin/billing/summary?date=${formattedDate}`);

      console.log('📦 Response:', data);

      if (!data.ok && !data.success) {
        throw new Error(data.error || "Failed to fetch billing data");
      }

      setRecords(data.records || []);
    } catch (err) {
      console.error("Billing fetch error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch billing data. Please try again.",
        variant: "destructive"
      });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBilling();
  };

  useEffect(() => {
    fetchBilling();
  }, [selectedDate]);

  // Expose fetchBilling globally for cross-component refresh
  useEffect(() => {
    window.refreshBillingPage = fetchBilling;

    // Check if billing needs refresh from localStorage
    const needsRefresh = localStorage.getItem('billingNeedsRefresh');
    if (needsRefresh === 'true') {
      localStorage.removeItem('billingNeedsRefresh');
      fetchBilling();
    }

    return () => {
      delete window.refreshBillingPage;
    };
  }, [selectedDate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return format(new Date(selectedDate), "dd-MM-yyyy");
    return format(new Date(dateStr), "dd-MM-yyyy");
  };

  const updatePayment = async (billingId, isPaid) => {
    try {
      const res = await api('/api/admin/billing/update-payment', {
        method: 'POST',
        body: JSON.stringify({
          billing_id: billingId,
          is_paid: isPaid
        })
      });

      if (res.status === 200) {
        toast({
          title: "Success",
          description: res.message,
        });
        // Refresh the billing data
        fetchBilling();
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to update payment status",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Update payment error:", err);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Billing Management</h1>
        <p className="page-description">
          View monthly mess bills for all students
        </p>
      </div>

      {/* Date Selector */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="font-medium">Select Month:</label>
          <input
            key={selectedDate}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium ${
            loading
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

        <div className="table-container p-4">
        <h2 className="font-semibold text-lg mb-3">All Billing Records</h2>

        <table className="table">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Student</th>
              <th>Date</th>
              <th>Meals</th>
              <th>Amount</th>
              <th>Payment</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  Loading billing data...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  No billing records found for the selected month.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const totalMeals =
                  Number(r.breakfast_count) +
                  Number(r.lunch_count) +
                  Number(r.dinner_count);

                return (
                  <tr key={r.billing_id || `${r.user_id}-${r.billing_date}`} className="border-b">
                    <td className="py-3">{r.full_name}</td>

                    <td>{formatDate(r.billing_date)}</td>

                    {/* 🟢 UI NOW SHOWS COUNTS FROM DB ONLY */}
                    <td>
                      ☕ {r.breakfast_count} &nbsp;&nbsp;
                      🌞 {r.lunch_count} &nbsp;&nbsp;
                      🌙 {r.dinner_count} &nbsp;&nbsp;
                      <strong>Total: {totalMeals}</strong>
                    </td>

                    {/* Amount */}
                    <td className="font-semibold">
                      ₹{Number(r.total_amount).toFixed(0)}
                    </td>

                    {/* Payment Buttons */}
                    <td>
                      <div className="flex gap-2">
                        <button
                          disabled={!r.billing_id || r.is_paid}
                          onClick={() => updatePayment(r.billing_id, true)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            r.is_paid
                              ? 'bg-green-500 text-white cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Paid
                        </button>

                        <button
                          disabled={!r.billing_id || !r.is_paid}
                          onClick={() => updatePayment(r.billing_id, false)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            !r.is_paid
                              ? 'bg-yellow-500 text-white cursor-not-allowed'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          Unpaid
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
