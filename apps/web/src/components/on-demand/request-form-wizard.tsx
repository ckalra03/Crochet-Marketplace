'use client';

/**
 * RequestFormWizard -- Multi-step form for submitting a custom crochet request.
 *
 * Step 1 "Details":            Description + Category
 * Step 2 "Budget & Timeline":  Budget range (INR) + Expected-by date
 * Step 3 "Reference Images":   Upload up to 5 reference images (optional)
 * Step 4 "Review":             Summary of inputs + Submit
 *
 * Uses Zod for per-step validation, React Query for submission,
 * and redirects to /on-demand on success.
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useCategories } from '@/lib/hooks/use-catalog';
import { useSubmitOnDemandRequest } from '@/lib/hooks/use-on-demand';
import { uploadOnDemandImage } from '@/lib/api/on-demand';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

/* ─────────────────── Zod schemas (per step) ─────────────────── */

const step1Schema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be 1000 characters or fewer'),
  categoryId: z.string().optional(),
});

const step2Schema = z.object({
  budgetMin: z.number().min(0, 'Minimum budget cannot be negative').optional(),
  budgetMax: z.number().min(0, 'Maximum budget cannot be negative').optional(),
  expectedBy: z.string().optional(),
}).refine(
  (data) => {
    if (data.budgetMin != null && data.budgetMax != null) {
      return data.budgetMax >= data.budgetMin;
    }
    return true;
  },
  { message: 'Maximum budget must be greater than or equal to minimum', path: ['budgetMax'] },
);

/* ─────────────────── Form data type ─────────────────── */

interface FormData {
  description: string;
  categoryId: string;
  budgetMin: string;
  budgetMax: string;
  expectedBy: string;
}

const INITIAL: FormData = {
  description: '',
  categoryId: '',
  budgetMin: '',
  budgetMax: '',
  expectedBy: '',
};

// Max 5 reference images, 5MB each
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/* ─────────────────── Steps ─────────────────── */

const STEP_TITLES = ['Details', 'Budget & Timeline', 'Reference Images', 'Review'];

/* ─────────────────── Component ─────────────────── */

export function RequestFormWizard() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const submitMutation = useSubmitOnDemandRequest();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reference images state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  /** Update a single field */
  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }

  /** Validate the current step. Returns true if valid. */
  function validateStep(): boolean {
    setErrors({});

    if (step === 0) {
      const result = step1Schema.safeParse({
        description: form.description,
        categoryId: form.categoryId || undefined,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const key = issue.path[0] as string;
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    }

    if (step === 1) {
      const budgetMin = form.budgetMin ? Number(form.budgetMin) : undefined;
      const budgetMax = form.budgetMax ? Number(form.budgetMax) : undefined;
      const result = step2Schema.safeParse({
        budgetMin,
        budgetMax,
        expectedBy: form.expectedBy || undefined,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const key = issue.path[0] as string;
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    }

    // Step 2 (images) has no required validation — images are optional

    return true;
  }

  function goNext() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  /** Handle file selection and upload to server */
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    // Take only as many files as remaining slots
    const filesToUpload = Array.from(files).slice(0, remaining);

    // Validate file sizes
    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds the 5MB size limit`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of filesToUpload) {
        const result = await uploadOnDemandImage(file);
        urls.push(result.url);
      }
      setImageUrls((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  /** Remove a reference image by index */
  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  /** Submit the request to the API */
  async function handleSubmit() {
    if (!validateStep()) return;

    // Convert rupees to cents for the API
    const budgetMinCents = form.budgetMin ? Math.round(Number(form.budgetMin) * 100) : undefined;
    const budgetMaxCents = form.budgetMax ? Math.round(Number(form.budgetMax) * 100) : undefined;

    submitMutation.mutate(
      {
        description: form.description,
        categoryId: form.categoryId || undefined,
        budgetMinCents,
        budgetMaxCents,
        expectedBy: form.expectedBy || undefined,
        referenceImages: imageUrls.length > 0 ? imageUrls : undefined,
      },
      {
        onSuccess: () => {
          router.push('/on-demand');
        },
      },
    );
  }

  /** Resolve category name from id */
  function getCategoryName(id: string): string {
    const cat = categories?.find((c: any) => c.id === id);
    return cat?.name ?? 'Not specified';
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {STEP_TITLES.map((title, i) => (
          <div key={title} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i <= step
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                i <= step ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {title}
            </span>
            {i < STEP_TITLES.length - 1 && (
              <div className="mx-2 h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What would you like crafted?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your custom crochet item -- colours, size, style, any inspiration links..."
                rows={5}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => update('categoryId', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Budget & Timeline */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Budget range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Min Budget (INR)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  min={0}
                  placeholder="e.g. 500"
                  value={form.budgetMin}
                  onChange={(e) => update('budgetMin', e.target.value)}
                />
                {errors.budgetMin && (
                  <p className="text-sm text-red-500">{errors.budgetMin}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Max Budget (INR)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  min={0}
                  placeholder="e.g. 2000"
                  value={form.budgetMax}
                  onChange={(e) => update('budgetMax', e.target.value)}
                />
                {errors.budgetMax && (
                  <p className="text-sm text-red-500">{errors.budgetMax}</p>
                )}
              </div>
            </div>

            {/* Expected by date */}
            <div className="space-y-2">
              <Label htmlFor="expectedBy">Expected By (optional)</Label>
              <Input
                id="expectedBy"
                type="date"
                value={form.expectedBy}
                onChange={(e) => update('expectedBy', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Reference Images */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Reference Images (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload up to {MAX_IMAGES} reference images to help the artisan understand your vision.
              Max 5MB per image.
            </p>

            {/* Uploaded image thumbnails */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imageUrls.map((url, index) => (
                  <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border">
                    <img
                      src={url}
                      alt={`Reference ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {imageUrls.length < MAX_IMAGES && (
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-600"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8" />
                    <span className="text-sm font-medium">Click to upload images</span>
                    <span className="text-xs">
                      {imageUrls.length}/{MAX_IMAGES} uploaded
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
              disabled={uploading}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Request</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap">{form.description}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Category</dt>
                <dd className="mt-1">
                  {form.categoryId ? getCategoryName(form.categoryId) : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Budget Range</dt>
                <dd className="mt-1">
                  {form.budgetMin || form.budgetMax
                    ? `${form.budgetMin ? formatMoney(Number(form.budgetMin) * 100) : '---'} - ${form.budgetMax ? formatMoney(Number(form.budgetMax) * 100) : '---'}`
                    : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Expected By</dt>
                <dd className="mt-1">
                  {form.expectedBy ? formatDate(form.expectedBy) : 'No deadline'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Reference Images</dt>
                <dd className="mt-1">
                  {imageUrls.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {imageUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Reference ${i + 1}`}
                          className="h-16 w-16 rounded border object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-4 w-4" /> None uploaded
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {submitMutation.isError && (
              <p className="mt-4 text-sm text-red-500">
                Something went wrong. Please try again.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === 0}>
          Back
        </Button>
        {step < STEP_TITLES.length - 1 ? (
          <Button onClick={goNext}>Continue</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        )}
      </div>
    </div>
  );
}
