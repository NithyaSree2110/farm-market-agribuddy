import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { AgriBuddy } from '@/components/AgriBuddy';

interface Order {
  id: string;
  crop_id: string;
  quantity_kg: number;
  total_price: number;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  created_at: string;
  delivery_address: string | null;
  razorpay_payment_id: string | null;
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-500', label: 'pending' },
  paid: { icon: CheckCircle, color: 'bg-green-500', label: 'paid' },
  delivered: { icon: Truck, color: 'bg-blue-500', label: 'delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-500', label: 'cancelled' },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${user?.id},farmer_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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
        ) : orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('noOrders')}</p>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>
      <AgriBuddy />
    </div>
  );
}
