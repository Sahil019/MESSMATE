import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, QrCode, CreditCard } from 'lucide-react';

const PaymentManagement = () => {
  const { getAuthToken } = useAuth();
  const { toast } = useToast();

  const [qrCode, setQrCode] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQrCode();
  }, []);

  const fetchQrCode = async () => {
    try {
      const data = await api('/api/admin/payment/qr');

      setQrCode(data.qrCode);
    } catch (err) {
      console.error('Fetch QR code error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('qrCode', file);

      const data = await api('/api/admin/payment/qr', {
        method: 'POST',
        body: formData
      });

      if (data.status === 200) {
        setQrCode(data.qrCode);
        toast({
          title: "QR Code Updated",
          description: "Payment QR code has been successfully updated"
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: "Upload Failed",
        description: "Failed to upload QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteQr = async () => {
    try {
      await api('/api/admin/payment/qr', {
        method: 'DELETE'
      });

      setQrCode(null);
      toast({
        title: "QR Code Removed",
        description: "Payment QR code has been removed"
      });
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: "Delete Failed",
        description: "Failed to remove QR code",
        variant: "destructive"
      });
    }
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
        <h1 className="page-title">Payment Management</h1>
        <p className="page-description">
          Upload and manage payment QR code for UPI payments
        </p>
      </div>

      {/* QR CODE MANAGEMENT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Payment QR Code
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* CURRENT QR CODE DISPLAY */}
          {qrCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="border-2 border-dashed border-primary/20 rounded-lg p-4">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${qrCode}`}
                    alt="Payment QR Code"
                    className="max-w-xs max-h-64 object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('qr-upload').click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Update QR Code'}
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleDeleteQr}
                  className="gap-2"
                >
                  Remove QR Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <QrCode className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium mb-2">No QR Code Uploaded</h3>
                <p className="text-muted-foreground mb-4">
                  Upload a QR code for students to scan and make UPI payments
                </p>
                <Button
                  onClick={() => document.getElementById('qr-upload').click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload QR Code'}
                </Button>
              </div>
            </div>
          )}

          {/* HIDDEN FILE INPUT */}
          <input
            id="qr-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* PAYMENT INSTRUCTIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Instructions
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Upload a clear QR code image for UPI payments</p>
            <p>• Supported formats: JPG, PNG, WebP (max 5MB)</p>
            <p>• Students will be able to scan this QR code from their dashboard</p>
            <p>• Make sure the QR code includes your UPI ID for direct payments</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManagement;
