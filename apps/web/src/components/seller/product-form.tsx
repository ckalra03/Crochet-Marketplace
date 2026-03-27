'use client';

/**
 * ProductForm -- Tabbed form for creating or editing a seller product.
 *
 * Tabs: Basic Info, Pricing, Details.
 * Uses Zod validation and the useCreateProduct / useUpdateProduct hooks.
 * Accepts `initialData` prop for edit mode (pre-populates all fields).
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProduct, useUpdateProduct, useSubmitForApproval } from '@/lib/hooks/use-seller';

/* ─────────────────── Zod Schema ─────────────────── */

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  productType: z.enum(['READY_STOCK', 'MADE_TO_ORDER', 'ON_DEMAND']),
  priceInCents: z.number().min(100, 'Minimum price is 100 paise (Rs 1)').optional(),
  compareAtPriceInCents: z.number().min(100).optional(),
  stockQuantity: z.number().min(0).optional(),
  leadTimeDays: z.number().min(1).optional(),
  returnPolicy: z.enum(['DEFECT_ONLY', 'NO_RETURN', 'STANDARD']),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  careInstructions: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

/* ─────────────────── Types ─────────────────── */

interface ProductFormProps {
  /** Pre-populate fields for edit mode */
  initialData?: ProductFormValues & { id: string };
  /** Categories list for the category dropdown */
  categories: Array<{ id: string; name: string }>;
}

/* ─────────────────── Component ─────────────────── */

function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const submitForApproval = useSubmitForApproval();

  // Form state
  const [form, setForm] = useState<ProductFormValues>({
    name: '',
    description: '',
    categoryId: '',
    productType: 'READY_STOCK',
    priceInCents: undefined,
    compareAtPriceInCents: undefined,
    stockQuantity: 0,
    leadTimeDays: undefined,
    returnPolicy: 'DEFECT_ONLY',
    materials: '',
    dimensions: '',
    careInstructions: '',
  });

  // Validation errors keyed by field name
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  // Pre-populate when initialData is provided (edit mode)
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        description: initialData.description,
        categoryId: initialData.categoryId,
        productType: initialData.productType,
        priceInCents: initialData.priceInCents,
        compareAtPriceInCents: initialData.compareAtPriceInCents,
        stockQuantity: initialData.stockQuantity,
        leadTimeDays: initialData.leadTimeDays,
        returnPolicy: initialData.returnPolicy,
        materials: initialData.materials || '',
        dimensions: initialData.dimensions || '',
        careInstructions: initialData.careInstructions || '',
      });
    }
  }, [initialData]);

  /** Validate the form and return parsed data or null */
  function validate(): ProductFormValues | null {
    const result = productSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);

      // Jump to the tab containing the first error
      const basicFields = ['name', 'description', 'categoryId', 'productType'];
      const pricingFields = ['priceInCents', 'compareAtPriceInCents', 'stockQuantity', 'leadTimeDays'];
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (basicFields.includes(firstErrorField)) setActiveTab('basic');
      else if (pricingFields.includes(firstErrorField)) setActiveTab('pricing');
      else setActiveTab('details');

      return null;
    }
    setErrors({});
    return result.data;
  }

  /** Save as draft (create or update) */
  async function handleSave() {
    const data = validate();
    if (!data) return;

    try {
      if (initialData?.id) {
        await updateProduct.mutateAsync({ id: initialData.id, data });
        toast.success('Product updated');
      } else {
        await createProduct.mutateAsync(data);
        toast.success('Product created as draft');
      }
      router.push('/seller/products');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    }
  }

  /** Save then submit for approval */
  async function handleSubmitForApproval() {
    const data = validate();
    if (!data) return;

    try {
      let productId = initialData?.id;

      if (productId) {
        // Update existing product first
        await updateProduct.mutateAsync({ id: productId, data });
      } else {
        // Create new product first
        const result = await createProduct.mutateAsync(data);
        productId = result.id;
      }

      // Now submit for approval
      if (productId) {
        await submitForApproval.mutateAsync(productId);
        toast.success('Product submitted for approval');
      }
      router.push('/seller/products');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit for approval');
    }
  }

  /** Helper to update a single field */
  function setField<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  const isSubmitting = createProduct.isPending || updateProduct.isPending || submitForApproval.isPending;

  return (
    <div className="max-w-2xl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* ── Basic Info Tab ── */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Name */}
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Amigurumi Bunny"
                  className="mt-1"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe your product in detail..."
                  className="mt-1 min-h-[120px]"
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e) => setField('categoryId', e.target.value)}
                  className="mt-1 w-full border rounded-md p-2 text-sm bg-background"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>}
              </div>

              {/* Product Type (radio buttons) */}
              <div>
                <Label>Product Type</Label>
                <div className="mt-2 flex flex-col gap-2">
                  {[
                    { value: 'READY_STOCK', label: 'Ready Stock', desc: 'Item is already made and in stock' },
                    { value: 'MADE_TO_ORDER', label: 'Made to Order', desc: 'You make it after the order is placed' },
                    { value: 'ON_DEMAND', label: 'On Demand', desc: 'Custom requests from buyers' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                        form.productType === opt.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="productType"
                        value={opt.value}
                        checked={form.productType === opt.value}
                        onChange={(e) => setField('productType', e.target.value as ProductFormValues['productType'])}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pricing Tab ── */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <div>
                <Label htmlFor="priceInCents">Price (in paise, e.g. 89900 = Rs 899)</Label>
                <Input
                  id="priceInCents"
                  type="number"
                  value={form.priceInCents ?? ''}
                  onChange={(e) => setField('priceInCents', e.target.value ? Number(e.target.value) : undefined)}
                  min={100}
                  placeholder="89900"
                  className="mt-1"
                />
                {errors.priceInCents && <p className="text-sm text-red-600 mt-1">{errors.priceInCents}</p>}
              </div>

              {/* Compare-at price */}
              <div>
                <Label htmlFor="compareAtPriceInCents">Compare-at Price (optional, for showing discounts)</Label>
                <Input
                  id="compareAtPriceInCents"
                  type="number"
                  value={form.compareAtPriceInCents ?? ''}
                  onChange={(e) => setField('compareAtPriceInCents', e.target.value ? Number(e.target.value) : undefined)}
                  min={100}
                  placeholder="99900"
                  className="mt-1"
                />
              </div>

              {/* Stock quantity -- only for READY_STOCK */}
              {form.productType === 'READY_STOCK' && (
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={form.stockQuantity ?? 0}
                    onChange={(e) => setField('stockQuantity', Number(e.target.value))}
                    min={0}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Lead time days -- only for MADE_TO_ORDER */}
              {form.productType === 'MADE_TO_ORDER' && (
                <div>
                  <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                  <Input
                    id="leadTimeDays"
                    type="number"
                    value={form.leadTimeDays ?? ''}
                    onChange={(e) => setField('leadTimeDays', e.target.value ? Number(e.target.value) : undefined)}
                    min={1}
                    placeholder="7"
                    className="mt-1"
                  />
                  {errors.leadTimeDays && <p className="text-sm text-red-600 mt-1">{errors.leadTimeDays}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Details Tab ── */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Return Policy (radio buttons) */}
              <div>
                <Label>Return Policy</Label>
                <div className="mt-2 flex flex-col gap-2">
                  {[
                    { value: 'DEFECT_ONLY', label: 'Defect Only', desc: 'Returns accepted only for defective items' },
                    { value: 'NO_RETURN', label: 'No Return', desc: 'No returns or exchanges accepted' },
                    { value: 'STANDARD', label: 'Standard', desc: 'Standard 7-day return window' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                        form.returnPolicy === opt.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="returnPolicy"
                        value={opt.value}
                        checked={form.returnPolicy === opt.value}
                        onChange={(e) => setField('returnPolicy', e.target.value as ProductFormValues['returnPolicy'])}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div>
                <Label htmlFor="materials">Materials</Label>
                <Input
                  id="materials"
                  value={form.materials || ''}
                  onChange={(e) => setField('materials', e.target.value)}
                  placeholder="e.g. 100% cotton yarn, polyester fiberfill"
                  className="mt-1"
                />
              </div>

              {/* Dimensions */}
              <div>
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={form.dimensions || ''}
                  onChange={(e) => setField('dimensions', e.target.value)}
                  placeholder="e.g. 15cm x 10cm x 8cm"
                  className="mt-1"
                />
              </div>

              {/* Care Instructions */}
              <div>
                <Label htmlFor="careInstructions">Care Instructions</Label>
                <Textarea
                  id="careInstructions"
                  value={form.careInstructions || ''}
                  onChange={(e) => setField('careInstructions', e.target.value)}
                  placeholder="e.g. Hand wash in cold water, reshape and air dry"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          variant="outline"
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          onClick={handleSubmitForApproval}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
}

export { ProductForm, productSchema };
export type { ProductFormProps, ProductFormValues };
