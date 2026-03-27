'use client';

/**
 * On-Demand Requests List Page (/on-demand)
 *
 * Lists the buyer's custom crochet requests with status filter tabs.
 * Shows loading skeletons while fetching and an empty state with a CTA
 * when no requests exist.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useOnDemandRequests } from '@/lib/hooks/use-on-demand';
import { RequestCard } from '@/components/on-demand/request-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles } from 'lucide-react';

/* ─────────── Status filter tabs ─────────── */

const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'COMPLETED', label: 'Completed' },
] as const;

/* ─────────── Loading skeleton ─────────── */

function RequestListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Page ─────────── */

export default function OnDemandListPage() {
  const { data, isLoading } = useOnDemandRequests();
  const [activeTab, setActiveTab] = useState('ALL');

  // Normalise the response -- API may return { requests: [] } or an array directly
  const requests: any[] = Array.isArray(data) ? data : data?.requests ?? [];

  // Filter by status tab
  const filtered =
    activeTab === 'ALL'
      ? requests
      : requests.filter((r: any) => r.status === activeTab);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Requests</h1>
        <Link href="/on-demand/new">
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content */}
      {isLoading ? (
        <RequestListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No custom requests yet"
          description="Describe your dream crochet item and let our artisans craft it for you."
          action={
            <Link href="/on-demand/new">
              <Button>Create Your First Request</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((request: any) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
