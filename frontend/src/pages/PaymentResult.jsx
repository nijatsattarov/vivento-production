import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, XCircle, AlertCircle, Home, Wallet, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PaymentResult = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [newBalance, setNewBalance] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const checkPaymentStatus = useCallback(async (isManualCheck = false) => {
    if (isManualCheck) {
      setChecking(true);
    }

    try {
      // Get payment ID from localStorage
      const paymentId = localStorage.getItem('pending_payment_id');
      const pendingAmount = localStorage.getItem('pending_payment_amount');

      // CRITICAL: Always verify payment status from backend API
      // NEVER trust URL parameters - they can be manipulated by user!
      // Balance is ONLY updated via Epoint callback to backend
      
      if (paymentId) {
        const response = await axios.get(
          `${API_BASE_URL}/api/payments/${paymentId}/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const status = response.data.status;
        setPaymentDetails({
          ...response.data,
          amount: pendingAmount || response.data.amount
        });

        if (status === 'completed') {
          setPaymentStatus('completed');
          
          // Fetch updated balance
          try {
            const balanceResponse = await axios.get(
              `${API_BASE_URL}/api/balance`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewBalance(balanceResponse.data.balance);
          } catch (e) {
            console.error('Balance fetch error:', e);
          }
          
          localStorage.removeItem('pending_payment_id');
          localStorage.removeItem('pending_payment_amount');
        } else if (status === 'failed') {
          setPaymentStatus('failed');
          localStorage.removeItem('pending_payment_id');
          localStorage.removeItem('pending_payment_amount');
        } else if (status === 'expired') {
          setPaymentStatus('expired');
          localStorage.removeItem('pending_payment_id');
          localStorage.removeItem('pending_payment_amount');
        } else {
          // Still pending - payment not completed or cancelled
          // DO NOT auto-confirm! Just show pending status
          setCheckAttempts(prev => prev + 1);
          setPaymentStatus('pending');
        }
      } else {
        setPaymentStatus('unknown');
      }
      
    } catch (error) {
      console.error('Payment status check error:', error);
      setPaymentStatus('error');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  // Auto-retry for pending payments (up to 5 times, every 3 seconds)
  useEffect(() => {
    if (paymentStatus === 'pending' && checkAttempts < 5) {
      const timer = setTimeout(() => {
        checkPaymentStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, checkAttempts, checkPaymentStatus]);

  if (loading) {
    return <LoadingSpinner text="Ödəniş statusu yoxlanılır..." />;
  }

  const renderContent = () => {
    switch (paymentStatus) {
      case 'completed':
        return (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ödəniş Uğurla Tamamlandı! 🎉
            </h1>
            <p className="text-gray-600 mb-8">
              Balansınız uğurla yeniləndi. Artıq dəvətnamələr göndərə bilərsiniz.
            </p>
          </>
        );
      
      case 'failed':
        return (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ödəniş Uğursuz Oldu
            </h1>
            <p className="text-gray-600 mb-8">
              Ödəniş prosesi tamamlanmadı. Zəhmət olmasa yenidən cəhd edin.
            </p>
          </>
        );
      
      case 'pending':
        return (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ödəniş Emal Olunur...
            </h1>
            <p className="text-gray-600 mb-4">
              Ödənişiniz emal olunur. Zəhmət olmasa gözləyin.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Cəhd: {checkAttempts}/5
            </p>
          </>
        );
      
      default:
        return (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-orange-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ödəniş Statusu Məlum Deyil
            </h1>
            <p className="text-gray-600 mb-4">
              Ödəniş statusunu müəyyən edə bilmədik.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Əgər kartınızdan pul çıxıbsa, bir neçə dəqiqə gözləyin və ya dəstək ilə əlaqə saxlayın.
            </p>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            {renderContent()}

            {/* Payment Details */}
            {paymentDetails && (paymentStatus === 'completed' || paymentStatus === 'pending') && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">Ödəniş Detalları</h3>
                <div className="space-y-3">
                  {paymentDetails.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Məbləğ:</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(paymentDetails.amount).toFixed(2)} AZN
                      </span>
                    </div>
                  )}
                  {newBalance !== null && paymentStatus === 'completed' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yeni Balans:</span>
                      <span className="font-semibold text-green-600">
                        {parseFloat(newBalance).toFixed(2)} AZN
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${
                      paymentStatus === 'completed' ? 'text-green-600' : 
                      paymentStatus === 'pending' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {paymentStatus === 'completed' ? 'Tamamlandı' : 
                       paymentStatus === 'pending' ? 'Emal olunur...' : 'Gözlənilir'}
                    </span>
                  </div>
                  {paymentDetails.order_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sifariş ID:</span>
                      <span className="font-mono text-sm text-gray-900">
                        {paymentDetails.order_id}
                      </span>
                    </div>
                  )}
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
              
              {(paymentStatus === 'failed' || paymentStatus === 'unknown' || paymentStatus === 'error') && (
                <Button
                  onClick={() => navigate('/add-balance')}
                  size="lg"
                  variant="outline"
                  className="border-2"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Yenidən cəhd et
                </Button>
              )}

              {(paymentStatus === 'unknown' || paymentStatus === 'pending') && (
                <Button
                  onClick={() => checkPaymentStatus(true)}
                  size="lg"
                  variant="outline"
                  className="border-2"
                  disabled={checking}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Yoxlanılır...' : 'Statusu yoxla'}
                </Button>
              )}
            </div>

            {/* Help text for unknown status */}
            {(paymentStatus === 'unknown' || paymentStatus === 'error') && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
                <h4 className="font-semibold text-blue-800 mb-2">Kömək</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Kartınızdan pul çıxıbsa, balansınız bir neçə dəqiqə ərzində yenilənəcək</li>
                  <li>• Dashboard-da balansınızı yoxlaya bilərsiniz</li>
                  <li>• Problem davam edərsə, dəstək ilə əlaqə saxlayın</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentResult;
