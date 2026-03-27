'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useRegisterSeller } from '@/lib/hooks/use-seller';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────

const TOTAL_STEPS = 5;

/** Crochet product categories for the multi-select step. */
const CROCHET_CATEGORIES = [
  'Amigurumi',
  'Blankets',
  'Bags',
  'Home Decor',
  'Clothing',
  'Accessories',
  'Baby Items',
] as const;

// ─── Zod Schemas (one per step) ────────────────────────

const step1Schema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be 100 characters or fewer'),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
});

const step2Schema = z.object({
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number (10-15 digits)')
    .optional()
    .or(z.literal('')),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z
      .string()
      .regex(/^[0-9]{6}$/, 'Enter a valid 6-digit postal code'),
  }),
});

const step3Schema = z.object({
  categories: z
    .array(z.string())
    .min(1, 'Select at least one category'),
});

const step4Schema = z.object({
  bankDetails: z.object({
    accountHolderName: z.string().min(1, 'Account holder name is required'),
    accountNumber: z
      .string()
      .regex(/^[0-9]{9,18}$/, 'Enter a valid account number (9-18 digits)'),
    ifscCode: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g. SBIN0001234)'),
    bankName: z.string().min(1, 'Bank name is required'),
  }),
});

const step5Schema = z.object({
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
  qualityAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to quality standards' }),
  }),
});

/** Mapping from step number (1-indexed) to its Zod schema. */
const STEP_SCHEMAS: Record<number, z.ZodTypeAny> = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
};

// ─── Form Data Interface ───────────────────────────────

interface FormData {
  businessName: string;
  description: string;
  phone: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  categories: string[];
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  termsAccepted: boolean;
  qualityAccepted: boolean;
}

const INITIAL_FORM: FormData = {
  businessName: '',
  description: '',
  phone: '',
  address: { line1: '', city: '', state: '', postalCode: '' },
  categories: [],
  bankDetails: {
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  },
  termsAccepted: false,
  qualityAccepted: false,
};

// ─── Step Indicator ────────────────────────────────────

const STEP_LABELS = [
  'Business Info',
  'Contact & Address',
  'Categories',
  'Bank Details',
  'Agreement',
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6">
      {/* Step counter */}
      <p className="text-sm text-muted-foreground mb-3 text-center">
        Step {currentStep} of {TOTAL_STEPS}
      </p>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isComplete = stepNum < currentStep;

          return (
            <div key={label} className="flex items-center gap-2">
              {/* Connector line (skip before first) */}
              {i > 0 && (
                <div
                  className={`h-0.5 w-6 ${
                    isComplete ? 'bg-primary-600' : 'bg-muted'
                  }`}
                />
              )}

              {/* Step dot + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isComplete
                        ? 'bg-primary-600/20 text-primary-600'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isComplete ? '✓' : stepNum}
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Wizard Component ─────────────────────────────

export function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const registerMutation = useRegisterSeller();

  // ── Helper: extract the data slice for the current step ──

  function getStepData(stepNum: number): unknown {
    switch (stepNum) {
      case 1:
        return { businessName: form.businessName, description: form.description || undefined };
      case 2:
        return { phone: form.phone || undefined, address: form.address };
      case 3:
        return { categories: form.categories };
      case 4:
        return { bankDetails: form.bankDetails };
      case 5:
        return { termsAccepted: form.termsAccepted, qualityAccepted: form.qualityAccepted };
      default:
        return {};
    }
  }

  // ── Validate the current step, returning true if valid ──

  function validateStep(): boolean {
    const schema = STEP_SCHEMAS[step];
    if (!schema) return true;

    const result = schema.safeParse(getStepData(step));
    if (result.success) {
      setErrors({});
      return true;
    }

    // Flatten Zod issues into a simple path -> message map
    const newErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!newErrors[path]) newErrors[path] = issue.message;
    });
    setErrors(newErrors);
    return false;
  }

  // ── Navigation handlers ──

  function handleNext() {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── Final submit ──

  async function handleSubmit() {
    if (!validateStep()) return;

    try {
      await registerMutation.mutateAsync({
        businessName: form.businessName,
        description: form.description || undefined,
        pickupAddress: {
          line1: form.address.line1,
          city: form.address.city,
          state: form.address.state,
          postalCode: form.address.postalCode,
        },
      });
      setSubmitted(true);
    } catch (err: any) {
      // Show server error at the top
      setErrors({
        _form: err?.response?.data?.message || 'Registration failed. Please try again.',
      });
    }
  }

  // ── Success state ──

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="py-12 space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold">Application Submitted</h2>
          <p className="text-muted-foreground">
            Your seller application has been submitted and is now awaiting review. We will notify you
            once your account is approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Render ──

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      {/* Global / server error */}
      {errors._form && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errors._form}
        </div>
      )}

      {/* Step content — each step wrapped in a Card */}
      {step === 1 && (
        <StepBusinessInfo form={form} setForm={setForm} errors={errors} />
      )}
      {step === 2 && (
        <StepContactAddress form={form} setForm={setForm} errors={errors} />
      )}
      {step === 3 && (
        <StepCategories form={form} setForm={setForm} errors={errors} />
      )}
      {step === 4 && (
        <StepBankDetails form={form} setForm={setForm} errors={errors} />
      )}
      {step === 5 && (
        <StepAgreement form={form} setForm={setForm} errors={errors} />
      )}

      {/* Footer navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          Back
        </Button>

        {step < TOTAL_STEPS ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Business Info ─────────────────────────────

interface StepProps {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
}

function StepBusinessInfo({ form, setForm, errors }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Tell us about your crochet business.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder="e.g. Yarn & Stitch Co."
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
          />
          {errors.businessName && (
            <p className="text-xs text-red-600">{errors.businessName}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what you make and your crafting specialties..."
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 2: Contact & Address ─────────────────────────

function StepContactAddress({ form, setForm, errors }: StepProps) {
  /** Helper to update a nested address field. */
  function setAddress(field: keyof FormData['address'], value: string) {
    setForm((f) => ({
      ...f,
      address: { ...f.address, [field]: value },
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Address</CardTitle>
        <CardDescription>
          Your pickup address for order fulfilment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
        </div>

        {/* Address line 1 */}
        <div className="space-y-2">
          <Label htmlFor="line1">
            Address Line 1 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="line1"
            placeholder="Street address, building, flat"
            value={form.address.line1}
            onChange={(e) => setAddress('line1', e.target.value)}
          />
          {errors['address.line1'] && (
            <p className="text-xs text-red-600">{errors['address.line1']}</p>
          )}
        </div>

        {/* City & State (side by side) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              placeholder="City"
              value={form.address.city}
              onChange={(e) => setAddress('city', e.target.value)}
            />
            {errors['address.city'] && (
              <p className="text-xs text-red-600">{errors['address.city']}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              id="state"
              placeholder="State"
              value={form.address.state}
              onChange={(e) => setAddress('state', e.target.value)}
            />
            {errors['address.state'] && (
              <p className="text-xs text-red-600">{errors['address.state']}</p>
            )}
          </div>
        </div>

        {/* Postal code */}
        <div className="space-y-2">
          <Label htmlFor="postalCode">
            Postal Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="postalCode"
            placeholder="e.g. 110001"
            maxLength={6}
            value={form.address.postalCode}
            onChange={(e) => setAddress('postalCode', e.target.value)}
          />
          {errors['address.postalCode'] && (
            <p className="text-xs text-red-600">{errors['address.postalCode']}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 3: Categories ────────────────────────────────

function StepCategories({ form, setForm, errors }: StepProps) {
  /** Toggle a category in the selected list. */
  function toggleCategory(cat: string) {
    setForm((f) => {
      const has = f.categories.includes(cat);
      return {
        ...f,
        categories: has
          ? f.categories.filter((c) => c !== cat)
          : [...f.categories, cat],
      };
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Categories</CardTitle>
        <CardDescription>
          Select the types of crochet products you plan to sell.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {CROCHET_CATEGORIES.map((cat) => (
          <label
            key={cat}
            className="flex items-center gap-3 cursor-pointer rounded-md border p-3 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={form.categories.includes(cat)}
              onCheckedChange={() => toggleCategory(cat)}
            />
            <span className="text-sm">{cat}</span>
          </label>
        ))}

        {errors.categories && (
          <p className="text-xs text-red-600">{errors.categories}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Step 4: Bank Details ──────────────────────────────

function StepBankDetails({ form, setForm, errors }: StepProps) {
  /** Helper to update a nested bankDetails field. */
  function setBank(field: keyof FormData['bankDetails'], value: string) {
    setForm((f) => ({
      ...f,
      bankDetails: { ...f.bankDetails, [field]: value },
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Details</CardTitle>
        <CardDescription>
          These details are used exclusively for payouts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security note */}
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          Your bank details are stored securely and used only for payouts.
        </div>

        {/* Account holder name */}
        <div className="space-y-2">
          <Label htmlFor="accountHolderName">
            Account Holder Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="accountHolderName"
            placeholder="As per bank records"
            value={form.bankDetails.accountHolderName}
            onChange={(e) => setBank('accountHolderName', e.target.value)}
          />
          {errors['bankDetails.accountHolderName'] && (
            <p className="text-xs text-red-600">
              {errors['bankDetails.accountHolderName']}
            </p>
          )}
        </div>

        {/* Account number */}
        <div className="space-y-2">
          <Label htmlFor="accountNumber">
            Account Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="accountNumber"
            placeholder="e.g. 123456789012"
            value={form.bankDetails.accountNumber}
            onChange={(e) => setBank('accountNumber', e.target.value)}
          />
          {errors['bankDetails.accountNumber'] && (
            <p className="text-xs text-red-600">
              {errors['bankDetails.accountNumber']}
            </p>
          )}
        </div>

        {/* IFSC & Bank name (side by side) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ifscCode">
              IFSC Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ifscCode"
              placeholder="e.g. SBIN0001234"
              value={form.bankDetails.ifscCode}
              onChange={(e) => setBank('ifscCode', e.target.value.toUpperCase())}
            />
            {errors['bankDetails.ifscCode'] && (
              <p className="text-xs text-red-600">
                {errors['bankDetails.ifscCode']}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">
              Bank Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankName"
              placeholder="e.g. State Bank of India"
              value={form.bankDetails.bankName}
              onChange={(e) => setBank('bankName', e.target.value)}
            />
            {errors['bankDetails.bankName'] && (
              <p className="text-xs text-red-600">
                {errors['bankDetails.bankName']}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Step 5: Agreement ─────────────────────────────────

function StepAgreement({ form, setForm, errors }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Agreement</CardTitle>
        <CardDescription>
          Please review and accept our seller agreements before submitting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Terms and conditions */}
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={form.termsAccepted}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, termsAccepted: checked === true }))
            }
            className="mt-0.5"
          />
          <div>
            <span className="text-sm">
              I agree to the{' '}
              <a
                href="/policies/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >
                Terms and Conditions
              </a>{' '}
              for sellers on Crochet Hub.
            </span>
            {errors.termsAccepted && (
              <p className="text-xs text-red-600 mt-1">{errors.termsAccepted}</p>
            )}
          </div>
        </label>

        {/* Quality standards */}
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={form.qualityAccepted}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, qualityAccepted: checked === true }))
            }
            className="mt-0.5"
          />
          <div>
            <span className="text-sm">
              I agree to maintain the quality standards set by Crochet Hub,
              including accurate product descriptions, timely shipping, and
              responsive customer communication.
            </span>
            {errors.qualityAccepted && (
              <p className="text-xs text-red-600 mt-1">{errors.qualityAccepted}</p>
            )}
          </div>
        </label>
      </CardContent>
    </Card>
  );
}
