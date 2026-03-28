'use client';

/**
 * ProductWizard -- Multi-step wizard for creating new products.
 *
 * Steps:
 *   1. Basic Info (name, description, category, type) -- creates DRAFT on save
 *   2. Images (upload, since product now has an ID)
 *   3. Pricing & Details (price, stock, return policy, materials, etc.)
 *   4. Review & Submit (read-only preview, submit for approval)
 *
 * Key design decisions:
 * - Product is created as DRAFT in Step 1, so images can be uploaded in Step 2.
 * - Step 3 updates the product with pricing/details.
 * - Step 4 shows a review and allows final submission for approval.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, ChevronRight, ChevronLeft, ImagePlus, X, Loader2, Send } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  useCreateProduct,
  useUpdateProduct,
  useSubmitForApproval,
  useUploadMedia,
  useDeleteMedia,
} from '@/lib/hooks/use-seller';
import { formatMoney } from '@/lib/utils/format';

/* ─────────────────── Types ─────────────────── */

interface MediaItem {
  id: string;
  filePath: string;
  type: 'IMAGE' | 'VIDEO';
  isPrimary: boolean;
}

interface ProductWizardProps {
  /** Categories for the dropdown */
  categories: Array<{ id: string; name: string }>;
}

/* ─────────────────── Validation Schemas ─────────────────── */

// Step 1: Basic info validation
const basicInfoSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  productType: z.enum(['READY_STOCK', 'MADE_TO_ORDER', 'ON_DEMAND']),
});

// Step 3: Pricing & details validation
const pricingSchema = z.object({
  priceInRupees: z.number().min(1, 'Minimum price is 1 rupee').optional(),
  compareAtPriceInRupees: z.number().min(1).optional(),
  stockQuantity: z.number().min(0).optional(),
  leadTimeDays: z.number().min(1).optional(),
  returnPolicy: z.enum(['DEFECT_ONLY', 'NO_RETURN', 'STANDARD']),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  careInstructions: z.string().optional(),
});

/* ─────────────────── Step Labels ─────────────────── */

const STEPS = ['Basic Info', 'Images', 'Pricing & Details', 'Review & Submit'];

/* ─────────────────── Component ─────────────────── */

export function ProductWizard({ categories }: ProductWizardProps) {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const submitForApproval = useSubmitForApproval();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  // Current step (0-indexed)
  const [currentStep, setCurrentStep] = useState(0);

  // The product ID, set after Step 1 creates the draft
  const [productId, setProductId] = useState<string | null>(null);

  // Uploaded media (populated after image uploads in Step 2)
  const [media, setMedia] = useState<MediaItem[]>([]);

  // Form state for Step 1
  const [basicForm, setBasicForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    productType: 'READY_STOCK' as 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND',
  });

  // Form state for Step 3
  const [pricingForm, setPricingForm] = useState({
    priceInRupees: undefined as number | undefined,
    compareAtPriceInRupees: undefined as number | undefined,
    stockQuantity: 0,
    leadTimeDays: undefined as number | undefined,
    returnPolicy: 'DEFECT_ONLY' as 'DEFECT_ONLY' | 'NO_RETURN' | 'STANDARD',
    materials: '',
    dimensions: '',
    careInstructions: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSubmitting =
    createProduct.isPending || updateProduct.isPending || submitForApproval.isPending;

  /* ─── Step 1: Save Basic Info (create DRAFT) ─── */

  async function handleSaveBasicInfo() {
    const result = basicInfoSchema.safeParse(basicForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    try {
      const product = await createProduct.mutateAsync({
        ...result.data,
        // Send a default return policy so the product can be created
        returnPolicy: pricingForm.returnPolicy,
      });
      setProductId(product.id);
      toast.success('Product draft created');
      setCurrentStep(1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create product');
    }
  }

  /* ─── Step 2: Continue (images are optional) ─── */

  function handleContinueFromImages() {
    setCurrentStep(2);
  }

  /* ─── Step 3: Save Pricing & Details ─── */

  async function handleSavePricing() {
    const result = pricingSchema.safeParse(pricingForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!productId) return;

    try {
      const data = result.data;
      await updateProduct.mutateAsync({
        id: productId,
        data: {
          priceInCents: data.priceInRupees ? Math.round(data.priceInRupees * 100) : undefined,
          compareAtPriceInCents: data.compareAtPriceInRupees
            ? Math.round(data.compareAtPriceInRupees * 100)
            : undefined,
          stockQuantity:
            basicForm.productType === 'READY_STOCK' ? (data.stockQuantity ?? 0) : data.stockQuantity,
          leadTimeDays: data.leadTimeDays,
          returnPolicy: data.returnPolicy,
          materials: data.materials,
          dimensions: data.dimensions,
          careInstructions: data.careInstructions,
        },
      });
      toast.success('Pricing & details saved');
      setCurrentStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save pricing');
    }
  }

  /* ─── Step 4: Submit for Approval ─── */

  async function handleSubmitForApproval() {
    if (!productId) return;

    try {
      await submitForApproval.mutateAsync(productId);
      toast.success('Product submitted for approval!');
      router.push('/seller/products');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit for approval');
    }
  }

  /* ─── Review: Check if all required fields are filled ─── */

  function getWarnings(): string[] {
    const warnings: string[] = [];
    if (!basicForm.name) warnings.push('Product name is missing');
    if (!basicForm.description) warnings.push('Description is missing');
    if (!basicForm.categoryId) warnings.push('Category is not selected');
    if (basicForm.productType !== 'ON_DEMAND' && !pricingForm.priceInRupees) {
      warnings.push('Price is not set');
    }
    if (media.length === 0) warnings.push('No images uploaded');
    return warnings;
  }

  const canSubmit = getWarnings().length === 0;

  /* ─── Helper to set a field in basicForm ─── */
  function setBasicField<K extends keyof typeof basicForm>(field: K, value: (typeof basicForm)[K]) {
    setBasicForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  /* ─── Helper to set a field in pricingForm ─── */
  function setPricingField<K extends keyof typeof pricingForm>(field: K, value: (typeof pricingForm)[K]) {
    setPricingForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  return (
    <div className="max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center">
            {/* Step circle */}
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                index < currentStep
                  ? 'bg-primary-600 text-white'
                  : index === currentStep
                    ? 'bg-primary-600 text-white ring-4 ring-primary-600/20'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {/* Step label */}
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                index === currentStep ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-primary-600' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Basic Info ── */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Name */}
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={basicForm.name}
                onChange={(e) => setBasicField('name', e.target.value)}
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
                value={basicForm.description}
                onChange={(e) => setBasicField('description', e.target.value)}
                placeholder="Describe your product in detail..."
                className="mt-1 min-h-[120px]"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                value={basicForm.categoryId}
                onChange={(e) => setBasicField('categoryId', e.target.value)}
                className="mt-1 w-full border rounded-md p-2 text-sm bg-background"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>
              )}
            </div>

            {/* Product Type */}
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
                      basicForm.productType === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="productType"
                      value={opt.value}
                      checked={basicForm.productType === opt.value}
                      onChange={(e) =>
                        setBasicField('productType', e.target.value as typeof basicForm.productType)
                      }
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

            {/* Save & Continue */}
            <div className="pt-2">
              <Button onClick={handleSaveBasicInfo} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Images ── */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing images grid */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-lg overflow-hidden border bg-muted aspect-square"
                  >
                    <img
                      src={item.filePath}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                    {item.isPrimary && (
                      <span className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!productId) return;
                        try {
                          await deleteMedia.mutateAsync({ productId, mediaId: item.id });
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
                  disabled={uploadMedia.isPending || !productId}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !productId) return;
                    try {
                      const result = await uploadMedia.mutateAsync({ id: productId, file });
                      setMedia((prev) => [...prev, result]);
                      toast.success('Image uploaded');
                    } catch {
                      toast.error('Failed to upload image');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Max 5MB per image. JPG, PNG, WebP supported.
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(0)} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleContinueFromImages} className="gap-2">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Pricing & Details ── */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 3: Pricing & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price */}
            <div>
              <Label htmlFor="priceInRupees">Price (&#8377;)</Label>
              <Input
                id="priceInRupees"
                type="number"
                value={pricingForm.priceInRupees ?? ''}
                onChange={(e) =>
                  setPricingField('priceInRupees', e.target.value ? Number(e.target.value) : undefined)
                }
                min={1}
                step="0.01"
                placeholder="899"
                className="mt-1"
              />
              {errors.priceInRupees && (
                <p className="text-sm text-red-600 mt-1">{errors.priceInRupees}</p>
              )}
            </div>

            {/* Compare-at price */}
            <div>
              <Label htmlFor="compareAtPriceInRupees">
                Compare-at Price (&#8377;, optional, for showing discounts)
              </Label>
              <Input
                id="compareAtPriceInRupees"
                type="number"
                value={pricingForm.compareAtPriceInRupees ?? ''}
                onChange={(e) =>
                  setPricingField(
                    'compareAtPriceInRupees',
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                min={1}
                step="0.01"
                placeholder="999"
                className="mt-1"
              />
            </div>

            {/* Stock quantity -- only for READY_STOCK */}
            {basicForm.productType === 'READY_STOCK' && (
              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={pricingForm.stockQuantity ?? 0}
                  onChange={(e) => setPricingField('stockQuantity', Number(e.target.value))}
                  min={0}
                  className="mt-1"
                />
              </div>
            )}

            {/* Lead time -- only for MADE_TO_ORDER */}
            {basicForm.productType === 'MADE_TO_ORDER' && (
              <div>
                <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  value={pricingForm.leadTimeDays ?? ''}
                  onChange={(e) =>
                    setPricingField('leadTimeDays', e.target.value ? Number(e.target.value) : undefined)
                  }
                  min={1}
                  placeholder="7"
                  className="mt-1"
                />
                {errors.leadTimeDays && (
                  <p className="text-sm text-red-600 mt-1">{errors.leadTimeDays}</p>
                )}
              </div>
            )}

            {/* Return Policy */}
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
                      pricingForm.returnPolicy === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="returnPolicy"
                      value={opt.value}
                      checked={pricingForm.returnPolicy === opt.value}
                      onChange={(e) =>
                        setPricingField('returnPolicy', e.target.value as typeof pricingForm.returnPolicy)
                      }
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
                value={pricingForm.materials}
                onChange={(e) => setPricingField('materials', e.target.value)}
                placeholder="e.g. 100% cotton yarn, polyester fiberfill"
                className="mt-1"
              />
            </div>

            {/* Dimensions */}
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={pricingForm.dimensions}
                onChange={(e) => setPricingField('dimensions', e.target.value)}
                placeholder="e.g. 15cm x 10cm x 8cm"
                className="mt-1"
              />
            </div>

            {/* Care Instructions */}
            <div>
              <Label htmlFor="careInstructions">Care Instructions</Label>
              <Textarea
                id="careInstructions"
                value={pricingForm.careInstructions}
                onChange={(e) => setPricingField('careInstructions', e.target.value)}
                placeholder="e.g. Hand wash in cold water, reshape and air dry"
                className="mt-1"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSavePricing} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Review & Submit ── */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 4: Review & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warnings for missing fields */}
            {getWarnings().length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Please fix these issues before submitting:
                </p>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  {getWarnings().map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic info review */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{basicForm.name || '--'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <span className="font-medium">
                    {categories.find((c) => c.id === basicForm.categoryId)?.name || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span className="font-medium">
                    {basicForm.productType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              {basicForm.description && (
                <p className="text-sm mt-2 text-muted-foreground line-clamp-3">
                  {basicForm.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Images review */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Images ({media.length})
              </h4>
              {media.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="w-16 h-16 rounded-lg overflow-hidden border bg-muted"
                    >
                      <img
                        src={item.filePath}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images uploaded</p>
              )}
            </div>

            <Separator />

            {/* Pricing review */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Pricing & Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>{' '}
                  <span className="font-medium">
                    {pricingForm.priceInRupees
                      ? formatMoney(pricingForm.priceInRupees * 100)
                      : '--'}
                  </span>
                </div>
                {pricingForm.compareAtPriceInRupees && (
                  <div>
                    <span className="text-muted-foreground">Compare-at:</span>{' '}
                    <span className="font-medium line-through text-muted-foreground">
                      {formatMoney(pricingForm.compareAtPriceInRupees * 100)}
                    </span>
                  </div>
                )}
                {basicForm.productType === 'READY_STOCK' && (
                  <div>
                    <span className="text-muted-foreground">Stock:</span>{' '}
                    <span className="font-medium">{pricingForm.stockQuantity}</span>
                  </div>
                )}
                {basicForm.productType === 'MADE_TO_ORDER' && pricingForm.leadTimeDays && (
                  <div>
                    <span className="text-muted-foreground">Lead Time:</span>{' '}
                    <span className="font-medium">{pricingForm.leadTimeDays} days</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Return Policy:</span>{' '}
                  <span className="font-medium">
                    {pricingForm.returnPolicy.replace(/_/g, ' ')}
                  </span>
                </div>
                {pricingForm.materials && (
                  <div>
                    <span className="text-muted-foreground">Materials:</span>{' '}
                    <span className="font-medium">{pricingForm.materials}</span>
                  </div>
                )}
                {pricingForm.dimensions && (
                  <div>
                    <span className="text-muted-foreground">Dimensions:</span>{' '}
                    <span className="font-medium">{pricingForm.dimensions}</span>
                  </div>
                )}
              </div>
              {pricingForm.careInstructions && (
                <p className="text-sm mt-2">
                  <span className="text-muted-foreground">Care:</span>{' '}
                  {pricingForm.careInstructions}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back to Edit
              </Button>
              <Button
                onClick={handleSubmitForApproval}
                disabled={!canSubmit || isSubmitting}
                className="gap-2 flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
