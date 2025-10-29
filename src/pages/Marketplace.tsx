import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AgriBuddy } from '@/components/AgriBuddy';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, MapPin, Package } from 'lucide-react';

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

export default function Marketplace() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrops(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            {t('marketplace')}
          </h1>
          <p className="text-muted-foreground">{t('tagline')}</p>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.map((crop) => (
              <Card key={crop.id} className="overflow-hidden hover:shadow-medium transition-shadow">
                <CardHeader className="p-0">
                  <div className="h-48 bg-gradient-to-br from-primary-light to-primary relative overflow-hidden">
                    {crop.image_url ? (
                      <img
                        src={crop.image_url}
                        alt={crop.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-6xl">🌾</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="mb-2">{crop.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {crop.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">💰</span>
                      <span className="font-semibold text-primary text-lg">
                        ₹{crop.price_per_kg}/{t('quantity')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{crop.quantity_kg} kg available</span>
                    </div>
                    {crop.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{crop.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    onClick={() => navigate(`/crop/${crop.id}`)}
                    className="w-full bg-gradient-primary"
                  >
                    {t('buyNow')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCrops.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl block mb-4">🌾</span>
            <p className="text-muted-foreground">No crops found</p>
          </div>
        )}
      </div>
      <AgriBuddy />
    </div>
  );
}