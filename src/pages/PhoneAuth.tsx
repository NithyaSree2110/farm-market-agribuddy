import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/config/firebase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function PhoneAuth() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const [role, setRole] = useState<'farmer' | 'buyer'>('buyer');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (recaptchaRef.current && !recaptchaVerifierRef.current) {
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

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: t('invalidPhone'), variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      if (!recaptchaVerifierRef.current) {
        throw new Error('Recaptcha not initialized');
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
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current!, {
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
    
    setIsLoading(true);
    try {
      if (!confirmationResult) throw new Error('No confirmation result');
      
      const userCredential = await confirmationResult.confirm(otp);
      const firebaseUser = userCredential.user;
      
      // Create/update Supabase profile
      const { error } = await supabase.from('profiles').upsert({
        id: firebaseUser.uid,
        phone: firebaseUser.phoneNumber,
        role: role,
        language: 'en'
      }, { onConflict: 'id' });
      
      if (error) console.error('Profile upsert error:', error);
      
      toast({ title: t('loginSuccess') });
      navigate('/marketplace');
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
                <Label>{t('selectRole')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={role === 'farmer' ? 'default' : 'outline'}
                    onClick={() => setRole('farmer')}
                    className={role === 'farmer' ? 'bg-gradient-primary' : ''}
                  >
                    🚜 {t('farmer')}
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'buyer' ? 'default' : 'outline'}
                    onClick={() => setRole('buyer')}
                    className={role === 'buyer' ? 'bg-gradient-primary' : ''}
                  >
                    🛒 {t('buyer')}
                  </Button>
                </div>
              </div>
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
                onClick={() => setStep('phone')}
              >
                {t('changePhone')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <div ref={recaptchaRef} />
    </div>
  );
}
