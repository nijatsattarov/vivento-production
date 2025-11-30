import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { XCircle, Home, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const PaymentCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear pending payment data
    localStorage.removeItem('pending_payment_id');
    localStorage.removeItem('pending_payment_amount');
    
    toast.info('Ödəniş ləğv edildi');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            {/* Cancel Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>

            {/* Cancel Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ödəniş Ləğv Edildi
            </h1>
            <p className="text-gray-600 mb-8">
              Ödəniş prosesi ləğv edildi və heç bir məbləğ çıxılmadı.
              İstədiyiniz zaman yenidən cəhd edə bilərsiniz.
            </p>

            {/* Info Box */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-yellow-900 mb-3">
                ℹ️ Nə baş verdi?
              </h3>
              <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
                <li>Ödəniş prosesi istifadəçi tərəfindən ləğv edildi</li>
                <li>Heç bir məbləğ sizin hesabınızdan çıxılmadı</li>
                <li>Balansınız dəyişmədi</li>
                <li>İstədiyiniz zaman yenidən cəhd edə bilərsiniz</li>
              </ul>
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
                Problem yaşayırsınızsa, dəstək komandamız ilə əlaqə saxlaya bilərsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCancel;
