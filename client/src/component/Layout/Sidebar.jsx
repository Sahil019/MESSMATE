import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

export const LeaveRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchLeaveRequests();
    }
  }, [user]);

  const fetchLeaveRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!startDate || !endDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }

    if (isBefore(parseISO(endDate), parseISO(startDate))) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Leave Request Submitted',
        description: `Your leave request from ${format(
          parseISO(startDate),
          'MMM d'
        )} to ${format(parseISO(endDate), 'MMM d')} has been submitted.`,
      });

      setStartDate('');
      setEndDate('');
      setReason('');
      setShowForm(false);

      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit leave request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, class: 'bg-warning/15 text-warning-foreground', label: 'Pending' },
      approved: { icon: CheckCircle, class: 'bg-success/15 text-success', label: 'Approved' },
      rejected: { icon: XCircle, class: 'bg-destructive/15 text-destructive', label: 'Rejected' },
    };

    return config[status] || config.pending;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-description">
            Apply for leave to automatically skip meals during your absence.
          </p>
        </div>

        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {showForm && (
        <Card className="animate-slide-up border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Apply for Leave</CardTitle>
            <CardDescription>
              All meals during the leave period will be automatically marked as skipped.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Going home for the weekend"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse-subtle text-muted-foreground">Loading...</div>
        </div>
      ) : leaveRequests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Leave Requests</h3>
            <p className="text-muted-foreground mb-4">
              You haven't applied for any leave yet.
            </p>

            <Button onClick={() => setShowForm(true)} variant="outline">
              Apply for Leave
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaveRequests.map((request, index) => {
            const statusBadge = getStatusBadge(request.status);
            const StatusIcon = statusBadge.icon;

            return (
              <Card
                key={request.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">
                          {format(parseISO(request.start_date), 'MMM d, yyyy')} —{' '}
                          {format(parseISO(request.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {request.reason && (
                        <p className="text-sm text-muted-foreground pl-6">
                          {request.reason}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground pl-6">
                        Applied on {format(parseISO(request.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>

                    <span className={`status-badge ${statusBadge.class}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.label}
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
