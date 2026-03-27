'use client';

import { useState } from 'react';
import { Package, Scissors, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

/** A single media item attached to a product. */
interface MediaItem {
  filePath: string;
  type: string;
  isPrimary: boolean;
}

interface ProductGalleryProps {
  media: MediaItem[];
  productName: string;
  /** Used to pick a placeholder icon when no media exists. */
  productType?: 'READY_STOCK' | 'MADE_TO_ORDER' | 'ON_DEMAND';
}

/** Gradient placeholder shown when the product has no images. */
function PlaceholderImage({ productType }: { productType?: string }) {
  // Pick an icon based on the product type
  const Icon =
    productType === 'ON_DEMAND'
      ? Palette
      : productType === 'MADE_TO_ORDER'
        ? Scissors
        : Package;

  return (
    <div className="w-full h-full bg-gradient-to-br from-primary-100 via-primary-50 to-amber-50 flex items-center justify-center">
      <Icon className="h-16 w-16 text-primary-600/40" />
    </div>
  );
}

/**
 * Product image gallery with:
 * - Main image display (aspect-ratio 1:1)
 * - Thumbnail strip for switching images
 * - CSS hover-zoom on the main image
 * - Lightbox dialog on click
 */
export function ProductGallery({ media, productName, productType }: ProductGalleryProps) {
  // Sort so the primary image comes first
  const sorted = [...media].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasMedia = sorted.length > 0;
  const currentMedia = hasMedia ? sorted[selectedIndex] : null;

  return (
    <div>
      {/* ── Main image ────────────────────────────────────────────── */}
      <div
        className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm mb-4 cursor-zoom-in group"
        onClick={() => hasMedia && setLightboxOpen(true)}
      >
        {currentMedia ? (
          <img
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            src={currentMedia.filePath}
            alt={productName}
          />
        ) : (
          <PlaceholderImage productType={productType} />
        )}
      </div>

      {/* ── Thumbnail strip ───────────────────────────────────────── */}
      {sorted.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {sorted.map((item, i) => (
            <button
              key={item.filePath}
              onClick={() => setSelectedIndex(i)}
              className={`aspect-square rounded-lg overflow-hidden bg-white shadow-sm transition-all ${
                i === selectedIndex
                  ? 'ring-2 ring-primary-600'
                  : 'hover:ring-2 hover:ring-primary-300'
              }`}
            >
              <img
                className="w-full h-full object-cover"
                src={item.filePath}
                alt={`${productName} view ${i + 1}`}
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox dialog ───────────────────────────────────────── */}
      {hasMedia && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl w-[95vw] p-2 bg-black/95 border-0">
            <DialogTitle className="sr-only">{productName}</DialogTitle>
            <img
              className="w-full h-auto max-h-[85vh] object-contain rounded"
              src={sorted[selectedIndex].filePath}
              alt={productName}
            />

            {/* Lightbox thumbnail strip */}
            {sorted.length > 1 && (
              <div className="flex gap-2 justify-center mt-2 overflow-x-auto py-1">
                {sorted.map((item, i) => (
                  <button
                    key={item.filePath}
                    onClick={() => setSelectedIndex(i)}
                    className={`w-14 h-14 flex-shrink-0 rounded overflow-hidden transition-all ${
                      i === selectedIndex
                        ? 'ring-2 ring-white'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      className="w-full h-full object-cover"
                      src={item.filePath}
                      alt={`${productName} view ${i + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
