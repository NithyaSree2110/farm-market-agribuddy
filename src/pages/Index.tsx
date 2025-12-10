import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Leaf, MessageSquare, Shield } from 'lucide-react';

export default function Index() {
  const { user, loading, userRole, needsRoleSelection } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && user && userRole && !needsRoleSelection) {
      // Redirect based on role
      switch (userRole) {
        case 'admin':
          navigate('/admin');
          break;
        case 'farmer':
          navigate('/farmer-dashboard');
          break;
        default:
          navigate('/marketplace');
      }
    }
  }, [user, loading, userRole, needsRoleSelection, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="container py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <span className="text-8xl">🌾</span>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            {t('appName')}
          </h1>
          <p className="text-2xl text-muted-foreground mb-8">{t('tagline')}</p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary text-lg px-8 py-6 gap-2"
          >
            {t('login')}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-card shadow-soft">
            <Leaf className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-lg mb-2">Direct Connection</h3>
            <p className="text-muted-foreground">Connect farmers with buyers, no middlemen</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card shadow-soft">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-lg mb-2">Real-time Chat</h3>
            <p className="text-muted-foreground">Communicate directly for fresh deals</p>
          </div>
          <div className="text-center p-6 rounded-lg bg-card shadow-soft">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
            <p className="text-muted-foreground">Safe transactions with Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
