import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [newBalance, setNewBalance] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const confirmPayment = async () => {
      // Get payment info from localStorage
      const paymentAmount = localStorage.getItem('pending_payment_amount');
      
      if (!token) {
        // Wait for token
        setTimeout(() => confirmPayment(), 500);
        return;
      }

      try {
        // Call balance endpoint - it will auto-confirm pending payments
        const response = await axios.get(`${API_BASE_URL}/api/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setNewBalance(response.data.balance);
        setPaymentDetails({
          amount: paymentAmount || '?',
          status: 'completed'
        });

        // Clear localStorage
        localStorage.removeItem('pending_payment_id');
        localStorage.removeItem('pending_payment_amount');

        toast.success('Ödəniş uğurla tamamlandı!');
        
      } catch (error) {
        console.error('Balance fetch error:', error);
        // Still show success - payment was made
        setPaymentDetails({
          amount: paymentAmount || '?',
          status: 'completed'
        });
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [token, API_BASE_URL]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!loading && paymentDetails) {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, paymentDetails, navigate]);

  if (loading) {
    return <LoadingSpinner text="Ödəniş təsdiqlənir..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            {/* Success Icon with Animation */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-green-600 mb-3">
              ✓ Ödəniş Uğurla Tamamlandı!
            </h1>
            <p className="text-gray-600 mb-8">
              Balansınız yeniləndi. Artıq dəvətnamələr göndərə bilərsiniz.
            </p>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  Ödəniş Detalları
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Əlavə edilən məbləğ:</span>
                    <span className="font-bold text-green-600 text-lg">
                      +{parseFloat(paymentDetails.amount).toFixed(2)} AZN
                    </span>
                  </div>
                  {newBalance !== null && (
                    <div className="flex justify-between border-t border-green-200 pt-3">
                      <span className="text-gray-600">Yeni balans:</span>
                      <span className="font-bold text-blue-600 text-xl">
                        {parseFloat(newBalance).toFixed(2)} AZN
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">
                      ✓ Uğurlu
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-redirect notice */}
            <p className="text-sm text-gray-500 mb-6">
              {redirectCountdown > 0 
                ? `${redirectCountdown} saniyə sonra Dashboard-a yönləndiriləcəksiniz...`
                : 'Yönləndirilir...'
              }
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard-a keç
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
