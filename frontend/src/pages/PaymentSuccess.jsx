import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, Home, Wallet, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [newBalance, setNewBalance] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const confirmPayment = async (authToken) => {
    // Get payment info from multiple sources
    const paymentId = localStorage.getItem('pending_payment_id');
    const paymentAmount = localStorage.getItem('pending_payment_amount');
    const orderIdFromUrl = searchParams.get('order_id');
    
    console.log('=== Payment Confirmation Debug ===');
    console.log('Token:', authToken ? 'exists' : 'missing');
    console.log('Payment ID from localStorage:', paymentId);
    console.log('Payment Amount from localStorage:', paymentAmount);
    console.log('Order ID from URL:', orderIdFromUrl);

    if (!authToken) {
      console.error('No auth token available');
      setError('Giriş sessiyası tapılmadı. Zəhmət olmasa yenidən daxil olun.');
      setLoading(false);
      return;
    }

    try {
      setConfirming(true);
      
      // Build request body with available identifiers
      const requestBody = {};
      if (paymentId) requestBody.payment_id = paymentId;
      if (orderIdFromUrl) requestBody.order_id = orderIdFromUrl;
      
      console.log('Sending confirm request with body:', requestBody);
      
      // Confirm payment and add balance
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/confirm-success`,
        requestBody,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Confirm response:', response.data);

      if (response.data.success) {
        setPaymentDetails({
          amount: response.data.amount || paymentAmount,
          status: 'completed'
        });
        setNewBalance(response.data.new_balance);
        
        // Clear localStorage
        localStorage.removeItem('pending_payment_id');
        localStorage.removeItem('pending_payment_amount');

        toast.success(`${response.data.amount} AZN balansınıza əlavə edildi!`);
        setError(null);
      }
    } catch (err) {
      console.error('Payment confirmation error:', err.response?.data || err.message);
      
      const errorMsg = err.response?.data?.detail || 'Ödəniş təsdiqlənərkən xəta';
      
      // If payment already completed, it's success
      if (errorMsg.includes('artıq tamamlanıb') || errorMsg.includes('already')) {
        setPaymentDetails({
          amount: paymentAmount || '?',
          status: 'completed'
        });
        
        // Fetch current balance
        try {
          const balanceRes = await axios.get(`${API_BASE_URL}/api/balance`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          setNewBalance(balanceRes.data.balance);
          toast.success('Ödəniş artıq tamamlanıb!');
          setError(null);
        } catch (e) {
          console.error('Balance fetch error:', e);
        }
      } else {
        // Show amount from localStorage even if confirmation fails
        if (paymentAmount) {
          setPaymentDetails({
            amount: paymentAmount,
            status: 'pending'
          });
        }
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  const retryConfirmation = () => {
    setError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    confirmPayment(token);
  };

  useEffect(() => {
    // Wait for auth context to be ready
    const checkAndConfirm = () => {
      if (token) {
        console.log('Token available, confirming payment...');
        confirmPayment(token);
      } else if (retryCount < 5) {
        console.log(`Waiting for token... retry ${retryCount + 1}/5`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000);
      } else {
        console.error('Token not available after 5 retries');
        setError('Giriş sessiyası tapılmadı. Dashboard-a keçib yenidən cəhd edin.');
        setLoading(false);
      }
    };

    checkAndConfirm();
  }, [token, retryCount]);

  if (loading) {
    return <LoadingSpinner text="Balans yenilənir..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className={`w-24 h-24 ${error && !paymentDetails ? 'bg-orange-100' : 'bg-green-100'} rounded-full flex items-center justify-center ${!error ? 'animate-bounce' : ''}`}>
                <CheckCircle className={`h-12 w-12 ${error && !paymentDetails ? 'text-orange-600' : 'text-green-600'}`} />
              </div>
            </div>

            {/* Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {error && !paymentDetails ? 'Ödəniş Emal Olunur' : 'Ödəniş Uğurla Tamamlandı! 🎉'}
            </h1>
            <p className="text-gray-600 mb-8">
              {error && !paymentDetails
                ? 'Ödənişiniz qəbul edildi. Balans bir neçə dəqiqə ərzində yenilənəcək.'
                : 'Balansınız uğurla yeniləndi və artıq dəvətnamələr göndərə bilərsiniz.'
              }
            </p>

            {/* Error with retry */}
            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-orange-700 text-sm mb-2">{error}</p>
                <Button 
                  onClick={retryConfirmation} 
                  variant="outline" 
                  size="sm"
                  disabled={confirming}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${confirming ? 'animate-spin' : ''}`} />
                  Yenidən cəhd et
                </Button>
              </div>
            )}

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">Ödəniş Detalları</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Əlavə edilən məbləğ:</span>
                    <span className="font-semibold text-green-600 text-lg">
                      +{parseFloat(paymentDetails.amount).toFixed(2)} AZN
                    </span>
                  </div>
                  {newBalance !== null && (
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Yeni balans:</span>
                      <span className="font-bold text-blue-600 text-xl">
                        {parseFloat(newBalance).toFixed(2)} AZN
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${paymentDetails.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                      {paymentDetails.status === 'completed' ? '✓ Tamamlandı' : '⏳ Emal olunur'}
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

            {/* Help */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Məlumat:</strong> Əgər balans görünmürsə, Dashboard-a keçin və səhifəni yeniləyin.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
