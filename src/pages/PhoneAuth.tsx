import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';

// DEV ONLY: Admin bypass credentials
const DEV_ADMIN_PHONE = '9381179867';
const DEV_ADMIN_OTP = '567890';

export default function PhoneAuth() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, userRole, setUserRole, needsRoleSelection, loading } = useAuth();

  // Redirect if already logged in with role
  useEffect(() => {
    if (!loading && user && userRole && !needsRoleSelection) {
      redirectBasedOnRole(userRole);
    }
  }, [user, userRole, needsRoleSelection, loading]);

  // Show role selection if needed
  useEffect(() => {
    if (user && needsRoleSelection) {
      setStep('role');
    }
  }, [user, needsRoleSelection]);

  useEffect(() => {
    if (auth && recaptchaRef.current && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
        callback: () => {},
      });
    }
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'farmer':
        navigate('/farmer-dashboard');
        break;
      default:
        navigate('/marketplace');
    }
  };

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: t('invalidPhone'), variant: 'destructive' });
      return;
    }

    // DEV ONLY: Check for admin bypass
    if (phone === DEV_ADMIN_PHONE) {
      setIsDevMode(true);
      setStep('otp');
      toast({ title: 'DEV MODE: Enter 567890 to login as admin' });
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      if (!recaptchaVerifierRef.current || !auth) {
        throw new Error('Firebase not initialized');
      }
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      toast({ title: t('otpSent') });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
      // Reset recaptcha on error
      if (recaptchaVerifierRef.current && auth && recaptchaRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: t('invalidOtp'), variant: 'destructive' });
      return;
    }

    // DEV ONLY: Admin bypass
    if (isDevMode && phone === DEV_ADMIN_PHONE && otp === DEV_ADMIN_OTP) {
      // This is a DEV shortcut - in production, real OTP would be required
      // For now, we'll simulate by requiring Firebase auth to work
      toast({ 
        title: 'DEV MODE', 
        description: 'Admin bypass - please use real Firebase auth in production',
        variant: 'destructive'
      });
      // In real scenario, this would still need Firebase auth
      // The admin role is auto-assigned based on phone number in AuthContext
      return;
    }
    
    setIsLoading(true);
    try {
      if (!confirmationResult) throw new Error('No confirmation result');
      
      await confirmationResult.confirm(otp);
      // Auth state listener in AuthContext will handle the rest
      toast({ title: t('loginSuccess') });
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: t('error'),
        description: error.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = async (selectedRole: 'farmer' | 'buyer') => {
    setIsLoading(true);
    try {
      await setUserRole(selectedRole);
      toast({ title: t('loginSuccess') });
      redirectBasedOnRole(selectedRole);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <span className="text-6xl">🌾</span>
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            {t('appName')}
          </CardTitle>
          <CardDescription>{t('tagline')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'phone' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <Button 
                onClick={sendOTP} 
                className="w-full bg-gradient-primary" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {t('sendOtp')} <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center text-sm text-muted-foreground mb-4">
                {t('otpSentTo')} +91{phone}
                {isDevMode && <span className="block text-yellow-600 mt-1">DEV MODE: Use 567890</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">{t('enterOtp')}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={verifyOTP} 
                className="w-full bg-gradient-primary" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('verifyOtp')
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => {
                  setStep('phone');
                  setIsDevMode(false);
                }}
              >
                {t('changePhone')}
              </Button>
            </>
          )}

          {step === 'role' && (
            <>
              <div className="text-center text-sm text-muted-foreground mb-4">
                {t('selectRole')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleRoleSelect('buyer')}
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  disabled={isLoading}
                >
                  <span className="text-3xl">🛒</span>
                  <span>{t('buyer')}</span>
                </Button>
                <Button
                  onClick={() => handleRoleSelect('farmer')}
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  disabled={isLoading}
                >
                  <span className="text-3xl">🚜</span>
                  <span>{t('farmer')}</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <div ref={recaptchaRef} />
    </div>
  );
}
