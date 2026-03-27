'use client';

/**
 * Admin Audit Logs Page -- Track all administrative actions and system events.
 *
 * Features:
 * - DataTable with columns: Timestamp, User, Action, Entity Type, Entity ID, IP Address
 * - Filters: action type, user search, entity type dropdown, date range
 * - Server-side pagination via useAdminAuditLogs()
 * - Expandable rows to show old/new value JSON diffs
 * - Loading skeletons and empty state
 */

import { useState, useMemo, useCallback, Fragment } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Search, Filter, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAuditLogs } from '@/lib/hooks/use-admin';
import { formatDateTime } from '@/lib/utils/format';

// ─── Constants ──────────────────────────────────────

/** Entity types available for filtering. */
const ENTITY_TYPES = [
  'Order',
  'Product',
  'User',
  'SellerProfile',
  'Return',
  'Dispute',
  'Payout',
  'WarehouseItem',
  'OnDemandRequest',
] as const;

/** Common admin action types for filtering. */
const ACTION_TYPES = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'SUSPEND',
  'STATUS_CHANGE',
  'REFUND',
  'PAYOUT',
  'LOGIN',
] as const;

/** Default number of rows per page. */
const DEFAULT_PAGE_SIZE = 20;

// ─── Types ──────────────────────────────────────────

/** Shape of an audit log row from the API. */
interface AuditLogRow {
  id: string;
  action: string;
  auditableType: string;
  auditableId: string;
  userId: string;
  ipAddress?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

/** Filter state managed by the page. */
interface FilterState {
  action: string;
  userId: string;
  auditableType: string;
  startDate: string;
  endDate: string;
}

const INITIAL_FILTERS: FilterState = {
  action: '',
  userId: '',
  auditableType: '',
  startDate: '',
  endDate: '',
};

// ─── Component ──────────────────────────────────────

export default function AdminAuditLogsPage() {
  // Filter state
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);

  // Track which rows are expanded to show old/new values
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Build API params from filter state (only include non-empty values)
  const apiParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: DEFAULT_PAGE_SIZE,
    };
    if (filters.action) params.action = filters.action;
    if (filters.userId) params.userId = filters.userId;
    if (filters.auditableType) params.auditableType = filters.auditableType;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  }, [filters, page]);

  // Fetch audit logs with current filters and page
  const { data, isLoading } = useAdminAuditLogs(apiParams);

  const logs: AuditLogRow[] = data?.logs ?? data?.auditLogs ?? [];
  const totalPages: number = data?.totalPages ?? data?.meta?.totalPages ?? 1;
  const totalCount: number = data?.total ?? data?.meta?.total ?? logs.length;

  /** Toggle a row's expanded state. */
  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /** Update a single filter field and reset to page 1. */
  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  /** Reset all filters and go back to page 1. */
  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  // Column definitions for the table
  const columns = useMemo<ColumnDef<AuditLogRow, unknown>[]>(
    () => [
      {
        id: 'expand',
        header: '',
        cell: ({ row }) => {
          const hasDetails = row.original.oldValues || row.original.newValues;
          if (!hasDetails) return null;
          const isExpanded = expandedRows.has(row.original.id);
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleRow(row.original.id)}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          );
        },
        size: 40,
      },
      {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'userName',
        header: 'User',
        accessorFn: (row) => row.user?.name ?? row.userId,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">
              {row.original.user?.name ?? 'System'}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.user?.email ?? row.original.userId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            {row.original.action}
          </span>
        ),
      },
      {
        accessorKey: 'auditableType',
        header: 'Entity Type',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.auditableType}</span>
        ),
      },
      {
        accessorKey: 'auditableId',
        header: 'Entity ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.auditableId}
          </span>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.ipAddress ?? '-'}
          </span>
        ),
      },
    ],
    [expandedRows, toggleRow],
  );

  // Build the table instance (no client-side sorting/filtering -- server handles it)
  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all administrative actions and system events
        </p>
      </div>

      {/* ── Filters Section ── */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Action type filter */}
          <div className="space-y-1">
            <Label htmlFor="action-filter">Action</Label>
            <Select
              value={filters.action}
              onValueChange={(val) => updateFilter('action', val === '_all' ? '' : val)}
            >
              <SelectTrigger id="action-filter">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All actions</SelectItem>
                {ACTION_TYPES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User search */}
          <div className="space-y-1">
            <Label htmlFor="user-filter">User ID / Name</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-filter"
                placeholder="Search user..."
                value={filters.userId}
                onChange={(e) => updateFilter('userId', e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Entity type dropdown */}
          <div className="space-y-1">
            <Label htmlFor="entity-filter">Entity Type</Label>
            <Select
              value={filters.auditableType}
              onValueChange={(val) => updateFilter('auditableType', val === '_all' ? '' : val)}
            >
              <SelectTrigger id="entity-filter">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All entities</SelectItem>
                {ENTITY_TYPES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start date */}
          <div className="space-y-1">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>

          {/* End date */}
          <div className="space-y-1">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Reset button */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* ── Loading Skeletons ── */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {/* ── Data Table ── */}
      {!isLoading && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  /* ── Empty State ── */
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <p className="text-muted-foreground">
                        No audit logs found matching your filters
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <Fragment key={row.id}>
                      {/* Main row -- click to expand if it has old/new values */}
                      <TableRow
                        className={
                          (row.original.oldValues || row.original.newValues)
                            ? 'cursor-pointer hover:bg-muted/50'
                            : ''
                        }
                        onClick={() => {
                          if (row.original.oldValues || row.original.newValues) {
                            toggleRow(row.original.id);
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Expanded detail row showing old/new JSON values */}
                      {expandedRows.has(row.original.id) && (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Old values */}
                              <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                  Old Values
                                </p>
                                <pre className="rounded bg-background p-3 text-xs overflow-auto max-h-64 border">
                                  {row.original.oldValues
                                    ? JSON.stringify(row.original.oldValues, null, 2)
                                    : 'null'}
                                </pre>
                              </div>
                              {/* New values */}
                              <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                  New Values
                                </p>
                                <pre className="rounded bg-background p-3 text-xs overflow-auto max-h-64 border">
                                  {row.original.newValues
                                    ? JSON.stringify(row.original.newValues, null, 2)
                                    : 'null'}
                                </pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination Controls ── */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalCount} log{totalCount !== 1 ? 's' : ''} total
              {totalPages > 1 && ` \u00B7 Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
