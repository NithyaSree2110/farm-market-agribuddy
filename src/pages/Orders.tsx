import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { AgriBuddy } from '@/components/AgriBuddy';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  crop_id: string;
  quantity_kg: number;
  total_price: number;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  created_at: string;
  delivery_address: string | null;
  razorpay_payment_id: string | null;
  buyer_id: string;
  farmer_id: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-500', label: 'pending' },
  paid: { icon: CheckCircle, color: 'bg-green-500', label: 'paid' },
  delivered: { icon: Truck, color: 'bg-blue-500', label: 'delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-500', label: 'cancelled' },
};

export default function Orders() {
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      // Buyer orders (where user is buyer)
      const { data: buyerData, error: buyerError } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.uid)
        .order('created_at', { ascending: false });

      if (buyerError) throw buyerError;
      setBuyerOrders(buyerData || []);

      // Farmer orders (where user is farmer)
      const { data: farmerData, error: farmerError } = await supabase
        .from('orders')
        .select('*')
        .eq('farmer_id', user.uid)
        .order('created_at', { ascending: false });

      if (farmerError) throw farmerError;
      setFarmerOrders(farmerData || []);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOrdersList = (orders: Order[], perspective: 'buyer' | 'farmer') => {
    if (orders.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('noOrders')}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;
          
          return (
            <Card key={order.id} className="hover:shadow-medium transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {t('orders')} #{order.id.slice(0, 8)}
                  </CardTitle>
                  <Badge className={`${status.color} text-white`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {t(status.label)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('quantity')}</p>
                    <p className="font-medium">{order.quantity_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('totalAmount')}</p>
                    <p className="font-medium text-primary">₹{order.total_price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('orderDate')}</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {order.razorpay_payment_id && (
                    <div>
                      <p className="text-muted-foreground">{t('paymentId')}</p>
                      <p className="font-medium text-xs">
                        {order.razorpay_payment_id.slice(0, 12)}...
                      </p>
                    </div>
                  )}
                </div>
                {order.delivery_address && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-muted-foreground text-sm">{t('deliveryAddress')}</p>
                    <p className="text-sm">{order.delivery_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <div className="container py-8 text-center">
          <p>{t('loginRequired')}</p>
        </div>
      </div>
    );
  }

  // Show tabs only for farmers (they can see both perspectives)
  const showTabs = userRole === 'farmer';

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            {t('myOrders')}
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12">{t('loading')}</div>
        ) : showTabs ? (
          <Tabs defaultValue="farmer">
            <TabsList className="mb-6">
              <TabsTrigger value="farmer">Orders for My Crops</TabsTrigger>
              <TabsTrigger value="buyer">My Purchases</TabsTrigger>
            </TabsList>
            <TabsContent value="farmer">
              {renderOrdersList(farmerOrders, 'farmer')}
            </TabsContent>
            <TabsContent value="buyer">
              {renderOrdersList(buyerOrders, 'buyer')}
            </TabsContent>
          </Tabs>
        ) : (
          // Buyer sees only their orders
          renderOrdersList(buyerOrders, 'buyer')
        )}
      </div>
      <AgriBuddy />
    </div>
  );
}
