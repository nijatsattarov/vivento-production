import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('E-poçt ünvanı daxil edin');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Düzgün e-poçt formatı daxil edin');
      return;
    }

    setIsLoading(true);
    
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setIsSuccess(true);
      toast.success('Şifrə bərpa linki göndərildi');
    } catch (error) {
      // Don't reveal if email exists or not for security
      setIsSuccess(true);
      toast.success('Əgər bu e-poçt qeydiyyatdan keçibsə, şifrə bərpa linki göndərildi');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="glass border-0 shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">E-poçtunuzu yoxlayın</h2>
                <p className="text-gray-600">
                  Əgər <span className="font-medium">{email}</span> ünvanı ilə hesab mövcuddursa, 
                  şifrə bərpa linki göndərildi.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                  className="w-full"
                >
                  Başqa e-poçt yoxla
                </Button>
                <Link to="/login">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Giriş səhifəsinə qayıt
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to login */}
        <Link 
          to="/login" 
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Giriş səhifəsinə qayıt</span>
        </Link>

        {/* Forgot Password Card */}
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden">
              <img 
                src="/vivento-icon.png" 
                alt="Vivento Icon" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Şifrəni unutdunuz?
              </CardTitle>
              <p className="text-gray-600">
                E-poçt ünvanınızı daxil edin və şifrə bərpa linkini göndərək
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-poçt
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Göndərilir...</span>
                  </div>
                ) : (
                  'Şifrə bərpa linki göndər'
                )}
              </Button>
            </form>

            {/* Back to login */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Şifrənizi xatırladınız?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Daxil olun
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
