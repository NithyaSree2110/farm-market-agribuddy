import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Package, MessageSquare, ShoppingCart, Loader2, AlertTriangle } from 'lucide-react';
import { AgriBuddy } from '@/components/AgriBuddy';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Crop {
  id: string;
  name: string;
  description: string;
  price_per_kg: number;
  quantity_kg: number;
  image_url: string | null;
  location: string | null;
  farmer_id: string;
}

export default function CropDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (id) fetchCrop();
  }, [id]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchCrop = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCrop(data);
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

  const totalPrice = crop ? crop.price_per_kg * quantity : 0;

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!address.trim()) {
      toast({
        title: t('addressRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (quantity > (crop?.quantity_kg || 0)) {
      toast({
        title: t('insufficientStock'),
        variant: 'destructive',
      });
      return;
    }

    setPaying(true);
    
    try {
      // Create Razorpay order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: totalPrice,
          cropId: crop?.id,
          quantity: quantity,
        }
      });

      // Check if edge function returned an error (e.g., missing secret)
      if (orderError || orderData?.error) {
        // FALLBACK: Simulated test payment when secret is not configured
        console.warn('Razorpay order creation failed, using simulated payment');
        await handleSimulatedPayment();
        return;
      }

      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      if (!razorpayKeyId || !window.Razorpay) {
        // FALLBACK: Use simulated payment
        await handleSimulatedPayment();
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Farm2Market',
        description: `Purchase: ${crop?.name}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          await createOrder(response.razorpay_order_id, response.razorpay_payment_id);
        },
        prefill: {
          contact: user.phoneNumber || '',
        },
        theme: {
          color: '#16a34a',
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast({
              title: 'Payment cancelled',
              variant: 'destructive',
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      // FALLBACK: Use simulated payment
      await handleSimulatedPayment();
    }
  };

  // FALLBACK: Simulated test payment when RAZORPAY_KEY_SECRET is not configured
  const handleSimulatedPayment = async () => {
    toast({
      title: 'Test Mode Payment',
      description: 'Processing simulated payment...',
    });

    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create order with simulated payment IDs
    const simulatedOrderId = `sim_order_${Date.now()}`;
    const simulatedPaymentId = `sim_pay_${Date.now()}`;
    
    await createOrder(simulatedOrderId, simulatedPaymentId);
  };

  const createOrder = async (razorpayOrderId: string, razorpayPaymentId: string) => {
    try {
      const { error: dbError } = await supabase.from('orders').insert({
        buyer_id: user!.uid,
        farmer_id: crop?.farmer_id,
        crop_id: crop?.id,
        quantity_kg: quantity,
        total_price: totalPrice,
        status: 'paid',
        delivery_address: address,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
      });

      if (dbError) throw dbError;

      // Update crop quantity
      await supabase
        .from('crops')
        .update({ 
          quantity_kg: (crop?.quantity_kg || 0) - quantity,
          available: (crop?.quantity_kg || 0) - quantity > 0
        })
        .eq('id', crop?.id);

      toast({
        title: t('paymentSuccess'),
        description: t('orderPlaced'),
      });
      
      navigate('/orders');
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setPaying(false);
    }
  };

  const openChat = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/chat?crop=${crop?.id}&farmer=${crop?.farmer_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <div className="container py-8 text-center">{t('loading')}</div>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <Header />
        <div className="container py-8 text-center">
          <p>{t('cropNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image - Fixed height container with object-fit */}
          <div className="relative rounded-lg overflow-hidden bg-card shadow-medium h-[400px]">
            {crop.image_url ? (
              <img
                src={crop.image_url}
                alt={crop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center">
                <span className="text-8xl">🌾</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{crop.name}</h1>
              <p className="text-muted-foreground">{crop.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-lg">
                <span className="text-3xl">💰</span>
                <span className="font-bold text-primary text-2xl">
                  ₹{crop.price_per_kg}/kg
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-5 w-5" />
                <span>{t('available')}: {crop.quantity_kg} kg</span>
              </div>
              {crop.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>{crop.location}</span>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('placeOrder')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Test mode notice */}
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    Test mode – no real money will be deducted.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>{t('quantity')} (kg)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={crop.quantity_kg}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(Number(e.target.value), crop.quantity_kg))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('available')}: {crop.quantity_kg} kg
                  </p>
                </div>
                <div>
                  <Label>{t('deliveryAddress')}</Label>
                  <Input
                    placeholder={t('enterAddress')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('totalAmount')}:</span>
                    <span className="text-primary">₹{totalPrice}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={openChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('chatWithFarmer')}
                  </Button>
                  <Button 
                    className="bg-gradient-primary" 
                    onClick={handlePayment}
                    disabled={paying}
                  >
                    {paying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t('payNow')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AgriBuddy />
    </div>
  );
}
