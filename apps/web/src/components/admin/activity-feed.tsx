'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAdminAuditLogs } from '@/lib/hooks/use-admin';
import { formatRelativeTime } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';

function ActivityFeedSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityFeed() {
  const { data, isLoading } = useAdminAuditLogs({ limit: 10 });

  if (isLoading) return <ActivityFeedSkeleton />;

  // API returns { logs: [...], pagination: {...} } — extract the array
  const logs = Array.isArray(data) ? data : (data?.logs ?? data?.data ?? []);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold text-lg mb-4">Recent Activity</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-0">
            {logs.map((log: any, index: number) => (
              <div key={log.id ?? index}>
                {index > 0 && <Separator className="my-2" />}
                <div className="flex items-start justify-between gap-4 py-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {log.action?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.auditableType ?? log.entityType ?? 'System'}
                      {log.user?.name ? ` by ${log.user.name}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {log.createdAt ? formatRelativeTime(log.createdAt) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { ActivityFeed };
