import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateFeeStatus, Fee } from '@/hooks/useLMS';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';

interface UpdateFeeDialogProps {
  fee: Fee;
}

export default function UpdateFeeDialog({ fee }: UpdateFeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'pending' | 'paid' | 'overdue'>(fee.status);
  const [transactionId, setTransactionId] = useState(fee.transaction_id || '');
  
  const { mutate: updateFee, isPending } = useUpdateFeeStatus();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateFee({
      feeId: fee.id,
      status,
      transactionId: status === 'paid' ? transactionId : null,
    }, {
      onSuccess: () => {
        toast.success('Fee status updated successfully');
        setOpen(false);
      },
      onError: (error) => {
        toast.error('Failed to update fee: ' + error.message);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckCircle className="h-4 w-4 mr-1" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Fee Status</DialogTitle>
          <DialogDescription>
            Update payment status for: {fee.description} (₹{fee.amount.toLocaleString()})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'pending' | 'paid' | 'overdue')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {status === 'paid' && (
              <div className="grid gap-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
