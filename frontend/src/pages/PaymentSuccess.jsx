import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, Home, Wallet } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get payment ID from localStorage
        const paymentId = localStorage.getItem('pending_payment_id');
        const paymentAmount = localStorage.getItem('pending_payment_amount');

        if (!paymentId) {
          toast.error('Ödəniş məlumatı tapılmadı');
          navigate('/dashboard');
          return;
        }

        // Check payment status
        const response = await axios.get(
          `${API_BASE_URL}/api/payments/${paymentId}/status`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setPaymentDetails({
          ...response.data,
          amount: paymentAmount || response.data.amount
        });

        // Clear localStorage
        localStorage.removeItem('pending_payment_id');
        localStorage.removeItem('pending_payment_amount');

        // Show success toast
        toast.success('Ödəniş uğurla tamamlandı! Balansınız yeniləndi.');
      } catch (error) {
        console.error('Payment status check error:', error);
        toast.error('Ödəniş statusu yoxlanılarkən xəta baş verdi');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Ödəniş yoxlanılır..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ödəniş Uğurla Tamamlandı! 🎉
            </h1>
            <p className="text-gray-600 mb-8">
              Balansınız uğurla yeniləndi və artıq dəvətnamələr göndərə bilərsiniz.
            </p>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">Ödəniş Detalları</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Məbləğ:</span>
                    <span className="font-semibold text-gray-900">
                      {parseFloat(paymentDetails.amount).toFixed(2)} AZN
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">
                      {paymentDetails.status === 'completed' ? 'Tamamlandı' : paymentDetails.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarix:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(paymentDetails.created_at).toLocaleDateString('az-AZ', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ödəniş ID:</span>
                    <span className="font-mono text-sm text-gray-900">
                      {paymentDetails.payment_id}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard-a qayıt
              </Button>
              <Button
                onClick={() => navigate('/add-balance')}
                size="lg"
                variant="outline"
                className="border-2"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Daha çox əlavə et
              </Button>
            </div>

            {/* Info Note */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Məlumat:</strong> Balansınız dərhal yeniləndi və artıq dəvətnamələr göndərə bilərsiniz.
                Hər qonaq üçün 0.10 AZN balansdan çıxılacaq (ilk 30 qonaq pulsuz).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
