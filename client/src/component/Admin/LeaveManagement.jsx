import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import {
  CalendarOff,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

import { format, parseISO } from 'date-fns';

const LeaveManagement = () => {
  const { getAuthToken } = useAuth();
  const { toast } = useToast();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // 🔄 Load leave requests from backend
  const fetchLeaveRequests = async () => {
    setIsLoading(true);

    try {
      const { ok, status, ...data } = await api("/api/admin/leaves");

      if (!ok) {
        throw new Error(data.message || `Failed to load leave requests (${status})`);
      }

      setLeaveRequests(data?.leaveRequests || []);

    } catch (err) {
      console.error("Leave fetch error:", err);

      toast({
        title: "Error",
        description: err.message || "Failed to load leave requests",
        variant: "destructive"
      });

    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Approve leave request
  const handleApprove = async (id) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Invalid leave request selected",
        variant: "destructive"
      });
      return;
    }

    setProcessingId(id);

    try {
      const res = await api(`/api/admin/leaves/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: 'approved' })
      });

      if (res.status !== 200) {
        throw new Error(res.error || "Failed to approve leave request");
      }

      toast({
        title: "Leave Approved",
        description: "The leave request has been approved and attendance updated."
      });

      setLeaveRequests(prev => prev.map(leave => leave.id === id ? { ...leave, status: 'approved' } : leave));

    } catch (err) {
      console.error("Approve leave error:", err);

      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive"
      });

    } finally {
      setProcessingId(null);
    }
  };

  // ❌ Reject leave request
  const handleReject = async (id) => {
    setProcessingId(id);

    try {
      const res = await api(`/api/admin/leaves/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: "rejected" })
      });

      if (res.status !== 200) {
        throw new Error(res.error || "Failed to reject leave request");
      }

      toast({
        title: "Leave Rejected",
        description: "The leave request has been rejected."
      });

      setLeaveRequests(prev => prev.map(leave => leave.id === id ? { ...leave, status: 'rejected' } : leave));

    } catch (err) {
      console.error("Reject leave error:", err);

      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive"
      });

    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { icon: Clock, class: "bg-warning/15 text-warning-foreground", label: "Pending" },
      approved: { icon: CheckCircle, class: "bg-success/15 text-success", label: "Approved" },
      rejected: { icon: XCircle, class: "bg-destructive/15 text-destructive", label: "Rejected" }
    };
    return map[status] || map.pending;
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <p className="page-description">
          Review and manage student leave requests.
        </p>
      </div>

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
              No leave requests have been submitted yet.
            </p>
          </CardContent>
        </Card>

      ) : (

        <div className="space-y-4">
          {leaveRequests.map((req, i) => {
            const badge = getStatusBadge(req.status);
            const Icon = badge.icon;

            return (
              <Card key={req.id} className="animate-slide-up" style={{animationDelay:`${i*50}ms`}}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="font-medium">{req.full_name}</span>
                        <span className="text-sm text-muted-foreground">({req.email})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(parseISO(req.start_date),'MMM d, yyyy')} — {format(parseISO(req.end_date),'MMM d, yyyy')}
                        </span>
                      </div>
                      {req.reason && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="w-4 h-4 mt-0.5" />
                          <span>{req.reason}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Applied on {format(parseISO(req.created_at),'MMM d, yyyy')}
                      </p>
                    </div>

                    <Badge className={`${badge.class} gap-1`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </Badge>
                  </div>
                </CardHeader>

                {req.status === 'pending' && (
                  <CardContent className="pt-0">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>

                      <Button
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                        variant="outline"
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

      )}

    </div>
  );
};

export default LeaveManagement;
