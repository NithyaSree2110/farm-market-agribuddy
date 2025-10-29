import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const authSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['farmer', 'buyer']),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'farmer' | 'buyer'>('buyer');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>, mode: 'signin' | 'signup') => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      authSchema.parse({ email, password, role });

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { role }
          }
        });

        if (error) throw error;
        
        toast({
          title: 'Account created!',
          description: 'You can now sign in.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Welcome back!',
        });
        
        navigate('/marketplace');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
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
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={(e) => handleAuth(e, 'signin')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('email')}</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="farmer@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('password')}</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                  {isLoading ? t('loading') : t('login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => handleAuth(e, 'signup')} className="space-y-4">
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
                  <Label htmlFor="signup-email">{t('email')}</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="farmer@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('password')}</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                  {isLoading ? t('loading') : t('signup')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}