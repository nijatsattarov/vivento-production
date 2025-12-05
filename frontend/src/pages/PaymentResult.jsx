import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, XCircle, AlertCircle, Home, Wallet } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PaymentResult = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    checkPaymentResult();
  }, []);

  const checkPaymentResult = async () => {
    try {
      // Get order_id from URL params (Epoint sends this)
      const orderId = searchParams.get('order_id');
      const status = searchParams.get('status');
      
      if (!orderId) {
        // Try to get from localStorage
        const paymentId = localStorage.getItem('pending_payment_id');
        
        if (paymentId) {
          const response = await axios.get(
            `${API_BASE_URL}/api/payments/${paymentId}/status`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          setPaymentDetails(response.data);
          setPaymentStatus(response.data.status);
          
          // Clear localStorage
          localStorage.removeItem('pending_payment_id');
          localStorage.removeItem('pending_payment_amount');
        } else {
          setPaymentStatus('unknown');
        }
      } else {
        // Payment info from Epoint callback
        setPaymentStatus(status === 'success' ? 'completed' : 'failed');
        setPaymentDetails({
          order_id: orderId,
          status: status
        });
      }
      
    } catch (error) {
      console.error('Payment result check error:', error);
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-gray-600 mb-8">
              Ödəniş statusunu müəyyən edə bilmədik. Dashboard-dan balansınızı yoxlaya bilərsiniz.
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
            {paymentDetails && paymentStatus === 'completed' && (
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">Tamamlandı</span>
                  </div>
                  {paymentDetails.created_at && (
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
              
              {paymentStatus === 'failed' && (
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentResult;
