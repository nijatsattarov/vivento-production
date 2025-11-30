import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Settings as SettingsIcon, Mail, Lock, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Settings = () => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailData.newEmail || !emailData.password) {
      toast.error('Bütün sahələri doldurun');
      return;
    }

    setIsEmailLoading(true);

    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/email`,
        {
          new_email: emailData.newEmail,
          password: emailData.password
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Email uğurla dəyişdirildi! Yenidən daxil olun.');
      setEmailData({ newEmail: '', password: '' });
      
      // Logout after email change
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Email change error:', error);
      toast.error('Email dəyişdirilə bilmədi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Bütün sahələri doldurun');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni parollar uyğun gəlmir');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Yeni parol ən azı 6 simvol olmalıdır');
      return;
    }

    setIsPasswordLoading(true);

    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/password`,
        {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Parol uğurla dəyişdirildi!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Parol dəyişdirilə bilmədi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <SettingsIcon className="h-6 w-6" />
              <span>Parametrlər</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="email" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email Dəyişdir</TabsTrigger>
                <TabsTrigger value="password">Parol Dəyişdir</TabsTrigger>
              </TabsList>

              {/* Email Change Tab */}
              <TabsContent value="email">
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-600">Hazırki Email</Label>
                      <p className="text-base font-medium text-gray-900 mt-1">{user?.email}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newEmail">Yeni Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="newEmail"
                          name="newEmail"
                          type="email"
                          placeholder="Yeni email ünvanınız"
                          value={emailData.newEmail}
                          onChange={handleEmailChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailPassword">Cari Parol</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="emailPassword"
                          name="password"
                          type="password"
                          placeholder="Parolunuzu təsdiq edin"
                          value={emailData.password}
                          onChange={handleEmailChange}
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">Təhlükəsizlik üçün parolunuzu daxil edin</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isEmailLoading}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isEmailLoading ? 'Saxlanılır...' : 'Email-i dəyişdir'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Password Change Tab */}
              <TabsContent value="password">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Cari Parol</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          placeholder="Hazırki parolunuz"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Yeni Parol</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          placeholder="Yeni parolunuz (ən azı 6 simvol)"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Yeni Parolu Təsdiq Et</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Yeni parolunuzu yenidən daxil edin"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isPasswordLoading}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isPasswordLoading ? 'Saxlanılır...' : 'Parolu dəyişdir'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
