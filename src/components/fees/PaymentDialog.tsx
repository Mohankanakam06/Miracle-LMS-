import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    CreditCard,
    Loader2,
    CheckCircle,
    ShieldCheck,
    Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Fee } from '@/hooks/useLMS';

interface PaymentDialogProps {
    fee: Fee;
    totalPending: number;
}

export default function PaymentDialog({ fee, totalPending }: PaymentDialogProps) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 16);
        return cleaned.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        return cleaned;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const rawCard = cardNumber.replace(/\s/g, '');
        if (rawCard.length < 16) {
            toast.error('Please enter a valid 16-digit card number');
            return;
        }

        setStep('processing');
        setProcessing(true);

        // Simulate payment processing (2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
            // Generate a mock transaction ID
            const transactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            const { error } = await supabase
                .from('fees')
                .update({
                    status: 'paid',
                    paid_date: new Date().toISOString(),
                    transaction_id: transactionId,
                })
                .eq('id', fee.id);

            if (error) throw error;

            setStep('success');
            queryClient.invalidateQueries({ queryKey: ['fees'] });

            // Auto-close after success
            setTimeout(() => {
                setOpen(false);
                resetForm();
                toast.success('Payment successful! Receipt is available for download.');
            }, 2000);
        } catch (error: any) {
            toast.error(error.message || 'Payment failed. Please try again.');
            setStep('form');
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
        setCardName('');
        setStep('form');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) resetForm();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="hero" size="lg">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Payment
                    </DialogTitle>
                    <DialogDescription>
                        Pay ₹{fee.amount.toLocaleString()} for {fee.description}
                    </DialogDescription>
                </DialogHeader>

                {step === 'success' ? (
                    <div className="flex flex-col items-center py-10 gap-4 animate-fade-in">
                        <div className="p-5 rounded-full bg-success/10 animate-bounce">
                            <CheckCircle className="h-12 w-12 text-success" />
                        </div>
                        <h3 className="text-xl font-bold">Payment Successful!</h3>
                        <p className="text-muted-foreground text-center">
                            ₹{fee.amount.toLocaleString()} has been paid. You can download the receipt from your fee page.
                        </p>
                    </div>
                ) : step === 'processing' ? (
                    <div className="flex flex-col items-center py-10 gap-4 animate-fade-in">
                        <div className="p-5 rounded-full bg-primary/10">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold">Processing Payment...</h3>
                        <p className="text-muted-foreground text-center">
                            Please wait while we process your transaction. Do not close this window.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Payment Summary */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Fee Description</span>
                                <span className="font-medium">{fee.description}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Due Date</span>
                                <span className="font-medium">
                                    {new Date(fee.due_date).toLocaleDateString()}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="font-semibold">Amount to Pay</span>
                                <span className="text-lg font-bold text-primary">
                                    ₹{fee.amount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Card Details */}
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="card-name">Name on Card</Label>
                                <Input
                                    id="card-name"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="e.g., John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="card-number">Card Number</Label>
                                <div className="relative">
                                    <Input
                                        id="card-number"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="1234 5678 9012 3456"
                                        required
                                        maxLength={19}
                                    />
                                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry Date</Label>
                                    <Input
                                        id="expiry"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                                        placeholder="MM/YY"
                                        required
                                        maxLength={5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvv">CVV</Label>
                                    <Input
                                        id="cvv"
                                        type="password"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        placeholder="***"
                                        required
                                        maxLength={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Note */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                            <Lock className="h-4 w-4 flex-shrink-0" />
                            <p>
                                This is a <strong>demo payment gateway</strong>. No real money will be charged.
                                Enter any valid-format card details to simulate payment.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="gap-2"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Pay ₹{fee.amount.toLocaleString()}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
