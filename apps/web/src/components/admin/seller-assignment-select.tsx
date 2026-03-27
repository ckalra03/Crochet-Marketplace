'use client';

/**
 * SellerAssignmentSelect -- Dropdown to search and select an approved seller.
 *
 * Fetches sellers via useAdminSellers({ status: 'APPROVED' }).
 * Shows business name + rating.
 * Returns selected sellerProfileId via onChange callback.
 */

import { useState, useMemo } from 'react';
import { useAdminSellers } from '@/lib/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface SellerAssignmentSelectProps {
  value?: string;
  onChange: (sellerProfileId: string) => void;
}

interface SellerRow {
  id: string;
  businessName: string;
  averageRating?: number;
  user?: { name: string };
}

function SellerAssignmentSelect({ value, onChange }: SellerAssignmentSelectProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminSellers({ status: 'APPROVED' });

  const sellers: SellerRow[] = data?.sellers ?? data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return sellers;
    const q = search.toLowerCase();
    return sellers.filter(
      (s) =>
        s.businessName?.toLowerCase().includes(q) ||
        s.user?.name?.toLowerCase().includes(q),
    );
  }, [sellers, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign Seller</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="sellerSearch">Search Sellers</Label>
          <Input
            id="sellerSearch"
            placeholder="Search by business name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading sellers...</p>
        )}

        <div className="max-h-48 overflow-y-auto rounded-md border">
          {filtered.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No approved sellers found.
            </p>
          )}
          {filtered.map((seller) => (
            <button
              key={seller.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                value === seller.id ? 'bg-accent font-medium' : ''
              }`}
              onClick={() => onChange(seller.id)}
            >
              <div>
                <p className="font-medium">{seller.businessName}</p>
                {seller.user?.name && (
                  <p className="text-xs text-muted-foreground">{seller.user.name}</p>
                )}
              </div>
              {seller.averageRating != null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {seller.averageRating.toFixed(1)}
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { SellerAssignmentSelect };
