import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Sprout, Package, Shield } from 'lucide-react';

interface Profile {
  id: string;
  phone: string | null;
  role: string;
}

interface Crop {
  id: string;
  name: string;
  price_per_kg: number;
  quantity_kg: number;
  farmer_id: string;
}

interface Order {
  id: string;
  buyer_id: string;
  farmer_id: string;
  crop_id: string;
  total_price: number;
  status: string;
  quantity_kg: number;
}

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/auth');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchData();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    // Fetch profiles - admin can see all
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, phone, role')
      .limit(50);
    setProfiles(profilesData || []);

    // Fetch crops
    const { data: cropsData } = await supabase
      .from('crops')
      .select('id, name, price_per_kg, quantity_kg, farmer_id')
      .limit(50);
    setCrops(cropsData || []);

    // Fetch orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('id, buyer_id, farmer_id, crop_id, total_price, status, quantity_kg')
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders(ordersData || []);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Header />
      <div className="container py-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-4xl font-bold text-amber-800">
              {t('admin')} {t('dashboard')}
            </h1>
            <p className="text-amber-600">Read-only admin view</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('users')}</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('totalCrops')}</CardTitle>
              <Sprout className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crops.length}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('orders')}</CardTitle>
              <Package className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="mb-6 border-amber-200">
          <CardHeader>
            <CardTitle>{t('users')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={p.role === 'admin' ? 'default' : 'secondary'}>
                        {p.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.id.slice(0, 8)}...</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Crops Table */}
        <Card className="mb-6 border-amber-200">
          <CardHeader>
            <CardTitle>{t('crops')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price/kg</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Farmer ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crops.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>₹{c.price_per_kg}</TableCell>
                    <TableCell>{c.quantity_kg} kg</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.farmer_id.slice(0, 8)}...</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle>{t('orders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs">{o.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-xs">{o.buyer_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-xs">{o.farmer_id.slice(0, 8)}...</TableCell>
                    <TableCell>₹{o.total_price}</TableCell>
                    <TableCell>
                      <Badge>{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
