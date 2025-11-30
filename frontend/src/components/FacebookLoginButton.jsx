import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Facebook } from 'lucide-react';
import { toast } from 'sonner';

const FacebookLoginButton = () => {
  const { facebookLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = () => {
    setIsLoading(true);
    
    if (window.FB) {
      window.FB.login(async (response) => {
        if (response.authResponse) {
          const result = await facebookLogin(response.authResponse);
          
          if (result.success) {
            toast.success('Uğurla giriş etdiniz!');
          } else {
            toast.error(result.error);
          }
        } else {
          toast.error('Facebook girişi ləğv edildi');
        }
        setIsLoading(false);
      }, { scope: 'public_profile,email' });
    } else {
      toast.error('Facebook SDK yüklənməyib');
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFacebookLogin}
      disabled={isLoading}
      variant="outline"
      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
      data-testid="facebook-login-button"
    >
      <Facebook className="mr-2 h-4 w-4" />
      {isLoading ? 'Giriş edilir...' : 'Facebook ilə giriş'}
    </Button>
  );
};

export default FacebookLoginButton;