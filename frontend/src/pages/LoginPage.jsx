import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import FacebookLoginButton from '../components/FacebookLoginButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Login form submitted with:', formData);
    
    if (!formData.email || !formData.password) {
      toast.error('Bütün sahələri doldurmuaq lazımdır');
      return;
    }

    setIsLoading(true);
    
    console.log('Calling login function...');
    const result = await login(formData);
    console.log('Login result:', result);
    
    if (result.success) {
      toast.success('Uğurla giriş etdiniz!');
      console.log('Login successful, redirecting to dashboard');
      // Redirect to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      console.error('Login failed:', result.error);
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

        {/* Login Card */}
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Xoş gəlmisiniz</CardTitle>
              <p className="text-gray-600">Hesabınıza giriş edin</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Facebook Login */}
            <FacebookLoginButton />
            
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">və ya</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
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
                    placeholder="Parolunuz"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 custom-input"
                    data-testid="password-input"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/forgot-password" 
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  data-testid="forgot-password-link"
                >
                  Parolunu unutmusan?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium btn-hover"
                disabled={isLoading}
                data-testid="login-submit-button"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Giriş edilir...</span>
                  </div>
                ) : (
                  'Giriş et'
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Hesabınız yoxdur?{' '}
                <Link 
                  to="/register" 
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  data-testid="register-link"
                >
                  Qeydiyyatdan keç
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;