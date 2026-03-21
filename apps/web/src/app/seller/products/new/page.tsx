'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api/client';
import { toast } from 'sonner';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', categoryId: '', productType: 'READY_STOCK',
    priceInCents: '', stockQuantity: '0', leadTimeDays: '', returnPolicy: 'DEFECT_ONLY',
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/catalog/categories`)
      .then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/seller/products', {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId,
        productType: form.productType,
        priceInCents: form.priceInCents ? Number(form.priceInCents) : undefined,
        stockQuantity: Number(form.stockQuantity),
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        returnPolicy: form.returnPolicy,
      });
      toast.success('Product created! You can now submit it for approval.');
      router.push('/seller/products');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-lg">Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Product Name</Label><Input value={form.name} onChange={set('name')} required minLength={3} className="mt-1" /></div>
            <div><Label>Description</Label><textarea value={form.description} onChange={set('description')} required minLength={10} className="mt-1 w-full border rounded-md p-2 text-sm min-h-[100px] bg-background" /></div>
            <div><Label>Category</Label>
              <select value={form.categoryId} onChange={set('categoryId')} required className="mt-1 w-full border rounded-md p-2 text-sm bg-background">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-lg">Type & Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Product Type</Label>
              <select value={form.productType} onChange={set('productType')} className="mt-1 w-full border rounded-md p-2 text-sm bg-background">
                <option value="READY_STOCK">Ready Stock</option>
                <option value="MADE_TO_ORDER">Made to Order</option>
              </select>
            </div>
            <div><Label>Price (in paise, e.g. 89900 = ₹899)</Label><Input type="number" value={form.priceInCents} onChange={set('priceInCents')} min="100" className="mt-1" /></div>
            {form.productType === 'READY_STOCK' && (
              <div><Label>Stock Quantity</Label><Input type="number" value={form.stockQuantity} onChange={set('stockQuantity')} min="0" className="mt-1" /></div>
            )}
            {form.productType === 'MADE_TO_ORDER' && (
              <div><Label>Lead Time (days)</Label><Input type="number" value={form.leadTimeDays} onChange={set('leadTimeDays')} min="1" className="mt-1" /></div>
            )}
            <div><Label>Return Policy</Label>
              <select value={form.returnPolicy} onChange={set('returnPolicy')} className="mt-1 w-full border rounded-md p-2 text-sm bg-background">
                <option value="DEFECT_ONLY">Defect Only</option>
                <option value="NO_RETURN">No Return</option>
                <option value="STANDARD">Standard</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </form>
    </div>
  );
}
