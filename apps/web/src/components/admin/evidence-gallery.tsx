'use client';

/**
 * EvidenceGallery -- Grid of evidence images for returns/disputes.
 * Click an image to open it in a Dialog (lightbox).
 */

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageIcon } from 'lucide-react';

interface EvidenceGalleryProps {
  images: string[];
}

function EvidenceGallery({ images }: EvidenceGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <ImageIcon className="h-10 w-10 mb-2" />
        <p className="text-sm">No evidence images provided</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((src, idx) => (
          <button
            key={idx}
            type="button"
            className="relative aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
            onClick={() => setSelectedImage(src)}
          >
            <Image
              src={src}
              alt={`Evidence ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Evidence Image</DialogTitle>
          {selectedImage && (
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={selectedImage}
                alt="Evidence full view"
                fill
                className="object-contain rounded"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { EvidenceGallery };
