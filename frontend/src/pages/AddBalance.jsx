import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowLeft,
  CreditCard,
  Building2,
  Smartphone,
  Check,
  AlertCircle,
  DollarSign,
  Wallet
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const AddBalance = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const quickAmounts = [10, 25, 50, 100];

  const paymentMethods = [
    {
      id: 'card',
      name: 'Bank Kartı',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Visa, MasterCard'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Köçürməsi',
      icon: <Building2 className="h-5 w-5" />,
      description: 'Bank hesabından'
    },
    {
      id: 'mobile_payment',
      name: 'Mobil Ödəmə',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Azercell, Bakcell, Nar'
    }
  ];

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Balance fetch error:', error);
      toast.error('Balans məlumatları alına bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const handleAddBalance = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || amountNum <= 0) {
      toast.error('Düzgün məbləğ daxil edin');
      return;
    }

    if (amountNum > 1000) {
      toast.error('Maksimum məbləğ 1000 AZN');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/payments/create`,
        {
          amount: amountNum,
          payment_method: selectedMethod
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { payment_id, payment_url } = paymentResponse.data;

      // Simulate payment process (in real app, redirect to payment gateway)
      toast.success('Ödəmə səhifəsinə yönləndirilirik...');
      
      // For demo purposes, auto-complete the payment after 2 seconds
      setTimeout(async () => {
        try {
          await axios.post(
            `${API_BASE_URL}/api/payments/${payment_id}/complete`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          toast.success('Ödəmə uğurla tamamlandı!');
          navigate('/dashboard');
        } catch (error) {
          console.error('Payment completion error:', error);
          toast.error('Ödəmə tamamlanarkən xəta baş verdi');
        } finally {
          setIsProcessing(false);
        }
      }, 2000);

    } catch (error) {
      console.error('Payment creation error:', error);
      toast.error('Ödəmə yaradılarkən xəta baş verdi');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard-a qayıt
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Balans Əlavə Et
          </h1>
          <p className="text-gray-600">
            Hesabınıza balans əlavə edərək dəvətnamələr göndərin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-green-500" />
                  Cari Balans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {balance.toFixed(2)} AZN
                </div>
              </CardContent>
            </Card>

            {/* Amount Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Məbləğ Seçin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Amounts */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Hazır məbləğlər
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        variant={amount === quickAmount.toString() ? "default" : "outline"}
                        onClick={() => handleQuickAmount(quickAmount)}
                        className="h-12"
                      >
                        {quickAmount} AZN
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <Label htmlFor="amount">Fərdi məbləğ</Label>
                  <div className="relative mt-2">
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      max="1000"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Məbləğ daxil edin"
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      AZN
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum: 1 AZN, Maksimum: 1000 AZN
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Ödəmə Üsulu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedMethod === method.id ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {method.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                      {selectedMethod === method.id && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Button
              onClick={handleAddBalance}
              disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ödəmə edilir...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {amount ? `${parseFloat(amount).toFixed(2)} AZN Ödə` : 'Məbləğ seçin'}
                </>
              )}
            </Button>
          </div>

          {/* Pricing Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
                  Qiymət Məlumatları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span className="font-medium text-green-700">İlk 30 dəvətnamə</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">Tamamilə pulsuz</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-700">30+ dəvətnamə</span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">Hər dəvətnamə üçün 0.10 AZN</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="font-medium text-purple-700">Premium şablonlar</span>
                  </div>
                  <p className="text-purple-600 text-sm mt-1">Fərdi qiymətləndirmə</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nümunə Hesablamalar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>50 dəvətnamə:</span>
                  <span className="font-medium">2.00 AZN</span>
                </div>
                <div className="flex justify-between">
                  <span>100 dəvətnamə:</span>
                  <span className="font-medium">7.00 AZN</span>
                </div>
                <div className="flex justify-between">
                  <span>200 dəvətnamə:</span>
                  <span className="font-medium">17.00 AZN</span>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t">
                  * İlk 30 dəvətnamə pulsuz hesablanmır
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBalance;