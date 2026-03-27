'use client';

/**
 * New On-Demand Request Page (/on-demand/new)
 *
 * Renders the multi-step RequestFormWizard with breadcrumb navigation
 * and a page header.
 */

import Link from 'next/link';
import { RequestFormWizard } from '@/components/on-demand/request-form-wizard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function NewOnDemandPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/on-demand">On-Demand</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Request</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page header */}
      <h1 className="mb-8 text-2xl font-bold">Create a Custom Request</h1>

      {/* Wizard form */}
      <RequestFormWizard />
    </div>
  );
}
