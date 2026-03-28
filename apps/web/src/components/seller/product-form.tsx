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
import { useCreateProduct, useUpdateProduct, useSubmitForApproval, useUploadMedia, useDeleteMedia } from '@/lib/hooks/use-seller';
import { ImagePlus, X, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

/* ─────────────────── Zod Schema ─────────────────── */

/**
 * Zod schema for the form. Note: priceInRupees and compareAtPriceInRupees
 * are the user-facing fields (in INR). They get converted to paise (*100)
 * before sending to the API in handleSave / handleSubmitForApproval.
 */
const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  productType: z.enum(['READY_STOCK', 'MADE_TO_ORDER', 'ON_DEMAND']),
  priceInRupees: z.number().min(1, 'Minimum price is 1 rupee').optional(),
  compareAtPriceInRupees: z.number().min(1).optional(),
  stockQuantity: z.number().min(0).optional(),
  leadTimeDays: z.number().min(1).optional(),
  returnPolicy: z.enum(['DEFECT_ONLY', 'NO_RETURN', 'STANDARD']),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  careInstructions: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

/* ─────────────────── Types ─────────────────── */

interface MediaItem {
  id: string;
  filePath: string;
  type: 'IMAGE' | 'VIDEO';
  isPrimary: boolean;
}

interface ProductFormProps {
  /** Pre-populate fields for edit mode. priceInCents / compareAtPriceInCents
   *  come from the API in paise and are converted to rupees for display. */
  initialData?: Omit<ProductFormValues, 'priceInRupees' | 'compareAtPriceInRupees'> & {
    id: string;
    media?: MediaItem[];
    priceInCents?: number;
    compareAtPriceInCents?: number;
  };
  /** Categories list for the category dropdown */
  categories: Array<{ id: string; name: string }>;
}

/* ─────────────────── Component ─────────────────── */

function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const submitForApproval = useSubmitForApproval();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  // Track uploaded media (from initialData in edit mode)
  const [media, setMedia] = useState<MediaItem[]>(initialData?.media ?? []);

  // Form state -- prices stored in rupees for user-friendly display
  const [form, setForm] = useState<ProductFormValues>({
    name: '',
    description: '',
    categoryId: '',
    productType: 'READY_STOCK',
    priceInRupees: undefined,
    compareAtPriceInRupees: undefined,
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

  // Pre-populate when initialData is provided (edit mode).
  // Convert paise -> rupees for the price fields on load.
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        description: initialData.description,
        categoryId: initialData.categoryId,
        productType: initialData.productType,
        // Convert from paise (API) to rupees (display)
        priceInRupees: initialData.priceInCents ? initialData.priceInCents / 100 : undefined,
        compareAtPriceInRupees: initialData.compareAtPriceInCents
          ? initialData.compareAtPriceInCents / 100
          : undefined,
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
      const pricingFields = ['priceInRupees', 'compareAtPriceInRupees', 'stockQuantity', 'leadTimeDays'];
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (basicFields.includes(firstErrorField)) setActiveTab('basic');
      else if (pricingFields.includes(firstErrorField)) setActiveTab('pricing');
      else setActiveTab('details');

      return null;
    }
    setErrors({});
    return result.data;
  }

  /**
   * Convert the form values (rupees) to the API payload (paise).
   * Also ensures stockQuantity defaults to 0 for READY_STOCK products.
   */
  function toApiPayload(data: ProductFormValues) {
    return {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      productType: data.productType,
      // Convert rupees -> paise for the API
      priceInCents: data.priceInRupees ? Math.round(data.priceInRupees * 100) : undefined,
      compareAtPriceInCents: data.compareAtPriceInRupees
        ? Math.round(data.compareAtPriceInRupees * 100)
        : undefined,
      // Default stockQuantity to 0 for READY_STOCK if not set
      stockQuantity: data.productType === 'READY_STOCK' ? (data.stockQuantity ?? 0) : data.stockQuantity,
      leadTimeDays: data.leadTimeDays,
      returnPolicy: data.returnPolicy,
      materials: data.materials,
      dimensions: data.dimensions,
      careInstructions: data.careInstructions,
    };
  }

  /** Save as draft (create or update) */
  async function handleSave() {
    const data = validate();
    if (!data) return;

    const payload = toApiPayload(data);

    try {
      if (initialData?.id) {
        await updateProduct.mutateAsync({ id: initialData.id, data: payload });
        toast.success('Product updated');
      } else {
        await createProduct.mutateAsync(payload);
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

    const payload = toApiPayload(data);

    try {
      let productId = initialData?.id;

      if (productId) {
        // Update existing product first
        await updateProduct.mutateAsync({ id: productId, data: payload });
      } else {
        // Create new product first
        const result = await createProduct.mutateAsync(payload);
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
          <TabsTrigger value="images">Images</TabsTrigger>
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

        {/* ── Images Tab ── */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {!initialData?.id ? (
                /* Must save product first before uploading images */
                <div className="text-center py-8 text-muted-foreground">
                  <ImagePlus className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Save your product first</p>
                  <p className="text-sm mt-1">
                    Click &quot;Save Draft&quot; below, then edit the product to add images.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Existing images grid */}
                  {media.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {media.map((item) => (
                        <div key={item.id} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.filePath}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                          {/* Primary badge */}
                          {item.isPrimary && (
                            <span className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await deleteMedia.mutateAsync({
                                  productId: initialData.id,
                                  mediaId: item.id,
                                });
                                setMedia((prev) => prev.filter((m) => m.id !== item.id));
                                toast.success('Image removed');
                              } catch {
                                toast.error('Failed to remove image');
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      {uploadMedia.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {uploadMedia.isPending ? 'Uploading...' : 'Add Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadMedia.isPending}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const result = await uploadMedia.mutateAsync({
                              id: initialData.id,
                              file,
                            });
                            setMedia((prev) => [...prev, result]);
                            toast.success('Image uploaded');
                          } catch {
                            toast.error('Failed to upload image');
                          }
                          // Reset input so same file can be re-selected
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Max 5MB per image. JPG, PNG, WebP supported.
                    </p>
                  </div>
                </div>
              )}
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
              {/* Price -- user enters in rupees, converted to paise on save */}
              <div>
                <Label htmlFor="priceInRupees">Price (&#8377;)</Label>
                <Input
                  id="priceInRupees"
                  type="number"
                  value={form.priceInRupees ?? ''}
                  onChange={(e) => setField('priceInRupees', e.target.value ? Number(e.target.value) : undefined)}
                  min={1}
                  step="0.01"
                  placeholder="899"
                  className="mt-1"
                />
                {errors.priceInRupees && <p className="text-sm text-red-600 mt-1">{errors.priceInRupees}</p>}
              </div>

              {/* Compare-at price -- user enters in rupees */}
              <div>
                <Label htmlFor="compareAtPriceInRupees">Compare-at Price (&#8377;, optional, for showing discounts)</Label>
                <Input
                  id="compareAtPriceInRupees"
                  type="number"
                  value={form.compareAtPriceInRupees ?? ''}
                  onChange={(e) => setField('compareAtPriceInRupees', e.target.value ? Number(e.target.value) : undefined)}
                  min={1}
                  step="0.01"
                  placeholder="999"
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

        {/* Preview button -- only visible in edit mode when the product has an ID */}
        {initialData?.id && (
          <Link href={`/seller/products/${initialData.id}/preview`}>
            <Button type="button" variant="secondary" className="gap-2">
              <Eye className="h-4 w-4" /> Preview
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export { ProductForm, productSchema };
export type { ProductFormProps, ProductFormValues };
