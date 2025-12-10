import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AgriBuddy } from '@/components/AgriBuddy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function MyCrops() {
  const [crops, setCrops] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) fetchCrops();
  }, [user]);

  const fetchCrops = async () => {
    const { data } = await supabase
      .from('crops')
      .select('*')
      .eq('farmer_id', user?.uid)
      .order('created_at', { ascending: false });
    setCrops(data || []);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.uid}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('crop-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const imageInput = formData.get('image') as File;
    let imageUrl = editingCrop?.image_url || null;

    if (imageInput?.size > 0) {
      const uploadedUrl = await handleImageUpload({
        target: { files: [imageInput] }
      } as any);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const cropData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price_per_kg: parseFloat(formData.get('price_per_kg') as string),
      quantity_kg: parseFloat(formData.get('quantity_kg') as string),
      location: formData.get('location') as string,
      image_url: imageUrl,
      farmer_id: user?.uid,
    };

    try {
      if (editingCrop) {
        const { error } = await supabase
          .from('crops')
          .update(cropData)
          .eq('id', editingCrop.id);
        if (error) throw error;
        toast({ title: 'Crop updated!' });
      } else {
        const { error } = await supabase
          .from('crops')
          .insert([cropData]);
        if (error) throw error;
        toast({ title: 'Crop added!' });
      }
      
      setIsOpen(false);
      setEditingCrop(null);
      fetchCrops();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this crop?')) return;
    
    const { error } = await supabase
      .from('crops')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Crop deleted' });
      fetchCrops();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header />
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t('myCrops')}
            </h1>
            <p className="text-muted-foreground mt-2">Manage your crop listings</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary gap-2">
                <Plus className="h-4 w-4" />
                {t('addCrop')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCrop ? t('edit') : t('addCrop')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Crop Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCrop?.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingCrop?.description}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_per_kg">Price per kg (₹)</Label>
                    <Input
                      id="price_per_kg"
                      name="price_per_kg"
                      type="number"
                      step="0.01"
                      defaultValue={editingCrop?.price_per_kg}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity_kg">Quantity (kg)</Label>
                    <Input
                      id="quantity_kg"
                      name="quantity_kg"
                      type="number"
                      step="0.01"
                      defaultValue={editingCrop?.quantity_kg}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={editingCrop?.location}
                  />
                </div>
                <div>
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : editingCrop ? t('save') : t('addCrop')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <Card key={crop.id} className="overflow-hidden hover:shadow-medium transition-shadow">
              <CardHeader className="p-0">
                <div className="h-48 bg-gradient-to-br from-primary-light to-primary">
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
                <p className="text-sm text-muted-foreground mb-3">{crop.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCrop(crop);
                      setIsOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(crop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {crops.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl block mb-4">🌾</span>
            <p className="text-muted-foreground mb-4">No crops listed yet</p>
            <Button onClick={() => setIsOpen(true)} className="bg-gradient-primary">
              {t('addCrop')}
            </Button>
          </div>
        )}
      </div>
      <AgriBuddy />
    </div>
  );
}