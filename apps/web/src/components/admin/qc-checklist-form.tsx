'use client';

/**
 * QCChecklistForm -- Crochet-specific quality control inspection form.
 *
 * 6 checkboxes covering hand-crochet quality aspects, an overall pass/fail
 * radio selection, and a required defect notes field when failing.
 * Submits via the useSubmitQC() mutation hook.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitQC } from '@/lib/hooks/use-admin';
import { toast } from 'sonner';

/** The six crochet-specific QC checks. */
const QC_ITEMS = [
  { key: 'looseEnds', label: 'Loose Ends Secured' },
  { key: 'finishingConsistency', label: 'Finishing Consistency' },
  { key: 'correctDimensions', label: 'Correct Dimensions' },
  { key: 'colorMatch', label: 'Color Match' },
  { key: 'stitchQuality', label: 'Stitch Quality' },
  { key: 'packagingAdequate', label: 'Packaging Adequate' },
] as const;

type ChecklistKey = (typeof QC_ITEMS)[number]['key'];

interface QCChecklistFormProps {
  /** Warehouse item ID to submit QC against. */
  warehouseItemId: string;
  /** Optional callback after successful submission. */
  onSuccess?: () => void;
}

function QCChecklistForm({ warehouseItemId, onSuccess }: QCChecklistFormProps) {
  // Checklist state -- all unchecked by default
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    looseEnds: false,
    finishingConsistency: false,
    correctDimensions: false,
    colorMatch: false,
    stitchQuality: false,
    packagingAdequate: false,
  });

  // Overall result: PASS or FAIL (empty = not selected yet)
  const [result, setResult] = useState<'PASS' | 'FAIL' | ''>('');

  // Defect notes (required when failing)
  const [defectNotes, setDefectNotes] = useState('');

  const submitQC = useSubmitQC();

  /** Toggle a single checklist item. */
  function toggleCheck(key: ChecklistKey) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /** Validate and submit the QC form. */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!result) {
      toast.error('Please select Pass or Fail');
      return;
    }

    if (result === 'FAIL' && !defectNotes.trim()) {
      toast.error('Defect notes are required when failing QC');
      return;
    }

    submitQC.mutate(
      {
        id: warehouseItemId,
        data: {
          result,
          checklist,
          ...(result === 'FAIL' ? { defectNotes: defectNotes.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(result === 'PASS' ? 'QC Passed' : 'QC Failed -- seller notified');
          onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || 'QC submission failed');
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Checklist */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Inspection Checklist</h4>
        {QC_ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              id={`qc-${key}`}
              checked={checklist[key]}
              onCheckedChange={() => toggleCheck(key)}
            />
            <Label htmlFor={`qc-${key}`} className="text-sm cursor-pointer">
              {label}
            </Label>
          </div>
        ))}
      </div>

      {/* Overall result */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Overall Result</h4>
        <RadioGroup
          value={result}
          onValueChange={(val) => setResult(val as 'PASS' | 'FAIL')}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="PASS" id="qc-pass" />
            <Label htmlFor="qc-pass" className="text-sm cursor-pointer">
              Pass
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="FAIL" id="qc-fail" />
            <Label htmlFor="qc-fail" className="text-sm cursor-pointer">
              Fail
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Defect notes (visible only on fail) */}
      {result === 'FAIL' && (
        <div className="space-y-2">
          <Label htmlFor="defect-notes" className="text-sm font-semibold">
            Defect Notes <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="defect-notes"
            placeholder="Describe the defects found..."
            value={defectNotes}
            onChange={(e) => setDefectNotes(e.target.value)}
            rows={3}
          />
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={submitQC.isPending}>
        {submitQC.isPending ? 'Submitting...' : 'Submit QC'}
      </Button>
    </form>
  );
}

export { QCChecklistForm };
export type { QCChecklistFormProps };
