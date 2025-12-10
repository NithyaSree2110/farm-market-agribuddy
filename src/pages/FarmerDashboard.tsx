import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sprout, Package, ShoppingBag, Plus } from 'lucide-react';
import { AgriBuddy } from '@/components/AgriBuddy';

export default function FarmerDashboard() {
  const { user, userRole, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ crops: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'farmer')) {
      navigate('/auth');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    
    // Count crops
    const { count: cropsCount } = await supabase
      .from('crops')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', user.uid);

    // Get orders for farmer
    const { data: orders } = await supabase
      .from('orders')
      .select('total_price')
      .eq('farmer_id', user.uid);

    const revenue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

    setStats({
      crops: cropsCount || 0,
      orders: orders?.length || 0,
      revenue,
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            {t('dashboard')} - {t('farmer')}
          </h1>
          <p className="text-muted-foreground">{t('tagline')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('myCrops')}</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.crops}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('orders')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('revenue')}</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{stats.revenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => navigate('/my-crops')} variant="outline" className="h-20 flex flex-col gap-2">
            <Sprout className="h-6 w-6" />
            {t('myCrops')}
          </Button>
          <Button onClick={() => navigate('/my-crops')} className="h-20 flex flex-col gap-2 bg-gradient-primary">
            <Plus className="h-6 w-6" />
            {t('addCrop')}
          </Button>
          <Button onClick={() => navigate('/orders')} variant="outline" className="h-20 flex flex-col gap-2">
            <Package className="h-6 w-6" />
            {t('myOrders')}
          </Button>
          <Button onClick={() => navigate('/marketplace')} variant="outline" className="h-20 flex flex-col gap-2">
            <ShoppingBag className="h-6 w-6" />
            {t('marketplace')}
          </Button>
        </div>
      </div>
      <AgriBuddy />
    </div>
  );
}
