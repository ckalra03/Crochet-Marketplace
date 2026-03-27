'use client';

/**
 * ConfirmationDialog — Wraps shadcn AlertDialog for confirm-before-action patterns.
 * The trigger is passed as `children`; the dialog appears before executing `onConfirm`.
 */

import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface ConfirmationDialogProps {
  /** Element that triggers the dialog (e.g. a Button) */
  children: ReactNode;
  /** Dialog heading */
  title: string;
  /** Dialog body text */
  description: string;
  /** Callback executed when the user confirms */
  onConfirm: () => void;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Visual variant for the confirm button */
  variant?: 'default' | 'destructive';
}

function ConfirmationDialog({
  children,
  title,
  description,
  onConfirm,
  confirmLabel = 'Confirm',
  variant = 'default',
}: ConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(buttonVariants({ variant }))}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConfirmationDialog };
export type { ConfirmationDialogProps };
