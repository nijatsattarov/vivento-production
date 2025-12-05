import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { XCircle, Home, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentError = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Clear pending payment data
    localStorage.removeItem('pending_payment_id');
    localStorage.removeItem('pending_payment_amount');
    
    const errorMessage = searchParams.get('message') || 'Ödəniş zamanı xəta baş verdi';
    toast.error(errorMessage);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ödəniş Xətası
            </h1>
            <p className="text-gray-600 mb-8">
              Ödəniş zamanı texniki xəta baş verdi. Heç bir məbləğ hesabınızdan çıxılmadı.
              Zəhmət olmasa bir qədər sonra yenidən cəhd edin.
            </p>

            {/* Error Details */}
            <div className="bg-red-50 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">
                    Baş verən problem:
                  </h3>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Ödəniş gateway ilə əlaqə problemi</li>
                    <li>Bank tərəfindən ödənişin rədd edilməsi</li>
                    <li>Kartın etibarsız olması</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/add-balance')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Yenidən cəhd et
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                variant="outline"
                className="border-2"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard-a qayıt
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Problem davam edərsə, dəstək komandamız ilə əlaqə saxlayın:
                <br />
                <a href="mailto:support@vivento.az" className="text-blue-600 hover:underline">
                  support@vivento.az
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentError;
