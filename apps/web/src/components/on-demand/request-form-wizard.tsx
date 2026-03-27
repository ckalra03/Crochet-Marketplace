'use client';

/**
 * RequestFormWizard -- Multi-step form for submitting a custom crochet request.
 *
 * Step 1 "Details":          Description + Category
 * Step 2 "Budget & Timeline": Budget range (INR) + Expected-by date
 * Step 3 "Review":            Summary of inputs + Submit
 *
 * Uses Zod for per-step validation, React Query for submission,
 * and redirects to /on-demand on success.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useCategories } from '@/lib/hooks/use-catalog';
import { useSubmitOnDemandRequest } from '@/lib/hooks/use-on-demand';
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

/* ─────────────────── Steps ─────────────────── */

const STEP_TITLES = ['Details', 'Budget & Timeline', 'Review'];

/* ─────────────────── Component ─────────────────── */

export function RequestFormWizard() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const submitMutation = useSubmitOnDemandRequest();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    return true;
  }

  function goNext() {
    if (validateStep()) setStep((s) => Math.min(s + 1, 2));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
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

      {/* Step 3: Review */}
      {step === 2 && (
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
        {step < 2 ? (
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
