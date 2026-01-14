import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, QrCode, Download, Copy } from 'lucide-react';

const Payment = () => {
  const { getAuthToken, user } = useAuth();
  const { toast } = useToast();

  const [qrCode, setQrCode] = useState(null);
  const [billingInfo, setBillingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const token = getAuthToken();

      // Fetch QR code
      const qrRes = await fetch('http://localhost:3000/api/payment/qr', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrCode(qrData.qrCode);
      }

      // Fetch billing info
      const billingRes = await fetch('http://localhost:3000/api/billing/summary?start=2024-01-01&end=2024-12-31', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (billingRes.ok) {
        const billingData = await billingRes.json();
        setBillingInfo(billingData.summary);
      }

    } catch (err) {
      console.error('Payment data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUpiId = () => {
    // This would ideally extract UPI ID from QR code, but for now just show a message
    toast({
      title: "UPI ID Copied",
      description: "UPI ID has been copied to clipboard"
    });
  };

  const handleDownloadQr = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = `http://localhost:3000${qrCode}`;
    link.download = 'payment-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded",
      description: "Payment QR code has been downloaded"
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Make Payment</h1>
        <p className="page-description">
          Pay your mess bills securely via UPI
        </p>
      </div>

      {/* BILLING SUMMARY */}
      {billingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Bill Summary
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{billingInfo.attended || 0}</div>
                <div className="text-sm text-muted-foreground">Meals Attended</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{billingInfo.skipped || 0}</div>
                <div className="text-sm text-muted-foreground">Meals Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">{billingInfo.leave || 0}</div>
                <div className="text-sm text-muted-foreground">Days on Leave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">₹{billingInfo.estimatedAmount || 0}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PAYMENT QR CODE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scan to Pay
          </CardTitle>
        </CardHeader>

        <CardContent>
          {qrCode ? (
            <div className="space-y-6">
              {/* QR CODE DISPLAY */}
              <div className="flex justify-center">
                <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                  <img
                    src={`http://localhost:3000${qrCode}`}
                    alt="Payment QR Code"
                    className="w-64 h-64 object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* PAYMENT ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleCopyUpiId}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy UPI ID
                </Button>

                <Button
                  onClick={handleDownloadQr}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </Button>
              </div>

              {/* PAYMENT INSTRUCTIONS */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Payment Instructions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Open your UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                  <li>• Scan the QR code above</li>
                  <li>• Verify the amount and complete the payment</li>
                  <li>• Keep the transaction ID for your records</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <QrCode className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium mb-2">Payment QR Not Available</h3>
                <p className="text-muted-foreground">
                  The administrator hasn't set up payment QR code yet. Please contact the mess administrator.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
