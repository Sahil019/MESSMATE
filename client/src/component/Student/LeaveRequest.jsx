import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { 
  CalendarOff,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

import { format, parseISO, isBefore } from 'date-fns';

const LeaveRequests = () => {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchLeaveRequests();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchLeaveRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 🔄 Load leave requests from backend
  const fetchLeaveRequests = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const res = await api(`/api/leave?user_id=${user.id}`);

      setLeaveRequests(res?.leaveRequests || []);

    } catch (err) {
      console.error("Leave fetch error:", err);

      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive"
      });

    } finally {
      setIsLoading(false);
    }
  };

  // 📨 Submit leave request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!startDate || !endDate) {
      return toast({
        title: "Validation Error",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
    }

    if (isBefore(parseISO(endDate), parseISO(startDate))) {
      return toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive"
      });
    }

    setIsSubmitting(true);

    try {
      await api("/api/leave", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim() || null
        })
      });

      toast({
        title: "Leave Request Submitted",
        description: `Leave applied from ${format(parseISO(startDate),"MMM d")} to ${format(parseISO(endDate),"MMM d")}`
      });

      setStartDate('');
      setEndDate('');
      setReason('');
      setShowForm(false);

      fetchLeaveRequests();

    } catch (err) {
      console.error("Leave submit error:", err);

      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive"
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { icon: Clock, class: "bg-warning/15 text-warning-foreground", label: "Pending" },
      approved: { icon: CheckCircle, class: "bg-success/15 text-success", label: "Approved" },
      reject: { icon: XCircle, class: "bg-destructive/15 text-destructive", label: "Rejected" }
    };
    return map[status] || map.pending;
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-description">
            Apply for leave — meals during leave are auto-skipped.
          </p>
        </div>

        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {/* IMPORTANT NOTICE */}
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-600 text-sm font-bold">!</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">Important Notice</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Students are required to give a minimum of 24 hours' notice prior to resuming mess services after returning from leave.
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <Card className="animate-slide-up border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Apply for Leave</CardTitle>
            <CardDescription>
              Meals during this period will be skipped automatically.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    min={format(new Date(),'yyyy-MM-dd')}
                    onChange={(e)=>setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || format(new Date(),'yyyy-MM-dd')}
                    onChange={(e)=>setEndDate(e.target.value)}
                    required
                  />
                </div>

              </div>

              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e)=>setReason(e.target.value)}
                  placeholder="Going home / medical / exam..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={()=>setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* LIST */}
      {isLoading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : leaveRequests.length === 0 ? (

        <Card className="text-center py-12">
          <CardContent>
            <CalendarOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Leave Requests</h3>
            <p className="text-muted-foreground mb-4">
              You haven't applied for leave yet.
            </p>
            <Button variant="outline" onClick={()=>setShowForm(true)}>
              Apply Leave
            </Button>
          </CardContent>
        </Card>

      ) : (

        <div className="space-y-4">
          {leaveRequests.map((req, i) => {
            const badge = getStatusBadge(req.status);
            const Icon = badge.icon;

            return (
              <Card key={req.id} className="animate-slide-up" style={{animationDelay:`${i*50}ms`}}>
                <CardContent className="pt-6">

                  <div className="flex justify-between items-start">

                    <div className="space-y-1">
                      <div className="flex gap-2 items-center">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {format(parseISO(req.start_date),'MMM d, yyyy')} — {format(parseISO(req.end_date),'MMM d, yyyy')}
                        </span>
                      </div>

                      {req.reason && (
                        <p className="text-sm text-muted-foreground pl-6">{req.reason}</p>
                      )}

                      <p className="text-xs text-muted-foreground pl-6">
                        Applied on {format(parseISO(req.created_at),'MMM d, yyyy')}
                      </p>
                    </div>

                    <span className={`status-badge ${badge.class}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>

                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>

      )}

    </div>
  );
};

export default LeaveRequests;
