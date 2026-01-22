import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFees, useProfiles, Fee } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, IndianRupee, Calendar, CheckCircle, AlertCircle, 
  Clock, Download, Search, Filter, FileText, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import AddFeeDialog from '@/components/fees/AddFeeDialog';
import UpdateFeeDialog from '@/components/fees/UpdateFeeDialog';
import { generateFeeReceipt } from '@/lib/generateFeeReceipt';

export default function Fees() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // For admin, fetch all fees; for students, fetch their own fees
  const { data: fees, isLoading } = useFees(isAdmin ? undefined : user?.id);
  const { data: profiles } = useProfiles();
  
  // Get current user's profile for receipt
  const currentProfile = profiles?.find(p => p.id === user?.id);

  const handleDownloadReceipt = (fee: Fee, studentId?: string) => {
    const studentProfile = profiles?.find(p => p.id === (studentId || user?.id));
    generateFeeReceipt({
      fee,
      studentName: studentProfile?.full_name || 'Student',
      studentEmail: studentProfile?.email || undefined,
    });
  };

  // Calculate fee statistics
  const feeStats = useMemo(() => {
    if (!fees) return { totalDue: 0, paid: 0, pending: 0, history: [] };

    const paid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const pending = fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);
    const totalDue = paid + pending;

    return {
      totalDue,
      paid,
      pending,
      history: fees.map(f => ({
        ...f,
        date: f.paid_date || f.due_date
      }))
    };
  }, [fees]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-success/10 text-success border-success/30">Paid</Badge>;
      case 'partial': return <Badge className="bg-warning/10 text-warning border-warning/30">Partial</Badge>;
      case 'pending': return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case 'overdue': return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Overdue</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">Fee Management</h1>
              <p className="text-muted-foreground">Track and manage student fee payments</p>
            </div>
            <div className="flex gap-2">
              <AddFeeDialog />
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-card bg-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">₹{feeStats.paid.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">₹{feeStats.pending.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-destructive/5 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">
                      {fees?.filter(f => f.status === 'overdue').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IndianRupee className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{feeStats.totalDue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Expected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Fee Records */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Fee Records</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 w-64" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {fees && fees.length > 0 ? (
                <div className="space-y-3">
                  {fees.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          fee.status === 'paid' ? "bg-success/10" : "bg-warning/10"
                        )}>
                          {fee.status === 'paid' ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <Clock className="h-5 w-5 text-warning" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{fee.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {fee.status === 'paid' 
                              ? `Paid on ${format(new Date(fee.paid_date!), 'MMM dd, yyyy')}` 
                              : `Due on ${format(new Date(fee.due_date), 'MMM dd, yyyy')}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-semibold">₹{fee.amount.toLocaleString()}</p>
                        {getStatusBadge(fee.status || 'pending')}
                        <UpdateFeeDialog fee={fee} />
                        {fee.status === 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadReceipt(fee, fee.student_id)}
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No fee records found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Fee Details</h1>
          <p className="text-muted-foreground">View your fee structure and payment history</p>
        </div>

        {/* Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fee</p>
                  <p className="text-3xl font-display font-bold">₹{feeStats.totalDue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <IndianRupee className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-3xl font-display font-bold text-success">₹{feeStats.paid.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-warning/5 border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-display font-bold text-warning">₹{feeStats.pending.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pay Now */}
        {feeStats.pending > 0 && (
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Pay your pending fee</p>
                    <p className="text-sm text-muted-foreground">Amount due: ₹{feeStats.pending.toLocaleString()}</p>
                  </div>
                </div>
                <Button variant="hero" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {fees && fees.length > 0 ? (
              <div className="space-y-3">
                {fees.map((item) => (
                  <div key={item.id} className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    item.status === 'paid' ? "bg-success/5" : "bg-warning/5"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.status === 'paid' ? "bg-success/10" : "bg-warning/10"
                      )}>
                        {item.status === 'paid' ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Clock className="h-5 w-5 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.status === 'paid' 
                            ? `Paid on ${format(new Date(item.paid_date!), 'MMM dd, yyyy')}` 
                            : `Due on ${format(new Date(item.due_date), 'MMM dd, yyyy')}`
                          }
                        </p>
                        {item.transaction_id && (
                          <p className="text-xs text-muted-foreground">ID: {item.transaction_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold">₹{item.amount.toLocaleString()}</p>
                      {getStatusBadge(item.status || 'pending')}
                      {item.status === 'paid' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadReceipt(item, item.student_id)}
                          title="Download Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No payment history</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
