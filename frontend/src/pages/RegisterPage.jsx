import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import FacebookLoginButton from '../components/FacebookLoginButton';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Bütün sahələri doldurmuaq lazımdır');
      return false;
    }

    if (formData.name.length < 2) {
      toast.error('Ad ən az 2 hərf olmalıdır');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Parol ən az 6 simvol olmalıdır');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Parollar uyğun gəlmir');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email düzgün formatda deyil');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    
    if (result.success) {
      toast.success('Qeydiyyat tamamlandı! Xoş gəlmisiniz!');
    } else {
      toast.error(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to home */}
        <Link 
          to="/" 
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          data-testid="back-home-link"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Ana səhifəyə qayıt</span>
        </Link>

        {/* Register Card */}
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Hesab yaradın</CardTitle>
              <p className="text-gray-600">Vivento-ya qoşulun və gözəl dəvətnamələr yaradın</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Facebook Register */}
            <FacebookLoginButton />
            
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">və ya</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Tam adınız
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Adınız və soyadınız"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 custom-input"
                    data-testid="name-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email ünvanı
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@misla.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 custom-input"
                    data-testid="email-input"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Parol
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ən az 6 simvol"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 custom-input"
                    data-testid="password-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Parol təkrarı
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Parolu təkrar edin"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 custom-input"
                    data-testid="confirm-password-input"
                    required
                  />
                </div>
              </div>

              <div className="text-xs text-gray-600 leading-relaxed">
                Qeydiyyatdan keçməklə{' '}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  İstifadə Şərtləri
                </Link>
                {' '}və{' '}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Məxfilik Siyasəti
                </Link>
                ni qəbul etmiş olursunuz.
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium btn-hover"
                disabled={isLoading}
                data-testid="register-submit-button"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Hesab yaradılır...</span>
                  </div>
                ) : (
                  'Hesab yarat'
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Artıq hesabınız var?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  data-testid="login-link"
                >
                  Giriş edin
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;